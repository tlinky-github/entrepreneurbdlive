import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import admin from 'firebase-admin';
import sharp from 'sharp';

// Safe environment variable helper supporting both Vite (import.meta.env) and Node (process.env)
const env = (key, fallbackKey) => {
  if (typeof import.meta.env !== 'undefined') {
    if (import.meta.env[key]) return import.meta.env[key];
    if (fallbackKey && import.meta.env[fallbackKey]) return import.meta.env[fallbackKey];
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    if (fallbackKey && process.env[fallbackKey]) return process.env[fallbackKey];
  }
  return undefined;
};

let firebaseInitError = null;

const getFirebaseServiceAccount = () => {
  const credsJson = env('FIREBASE_CREDENTIALS_JSON', 'FIREBASE_SERVICE_ACCOUNT_JSON');
  if (credsJson) {
    return JSON.parse(credsJson);
  }

  const projectId = env('FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID');
  const clientEmail = env('FIREBASE_CLIENT_EMAIL');
  const privateKey = env('FIREBASE_PRIVATE_KEY');

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
  }

  return null;
};

const ensureFirebaseAdmin = () => {
  if (admin.apps?.length) return admin.firestore();
  if (firebaseInitError) throw firebaseInitError;

  try {
    const serviceAccount = getFirebaseServiceAccount();
    if (!serviceAccount) {
      firebaseInitError = new Error('Firebase credentials are not configured');
      throw firebaseInitError;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return admin.firestore();
  } catch (error) {
    firebaseInitError = error;
    throw error;
  }
};

let r2ClientInstance = null;
const getR2Client = () => {
  if (r2ClientInstance) return r2ClientInstance;
  const accountId = env('R2_ACCOUNT_ID');
  const accessKeyId = env('R2_ACCESS_KEY_ID');
  const secretAccessKey = env('R2_SECRET_ACCESS_KEY');
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(`R2 configuration is missing or incomplete. Got accountId=${!!accountId}, accessKeyId=${!!accessKeyId}, secretAccessKey=${!!secretAccessKey}`);
  }
  r2ClientInstance = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return r2ClientInstance;
};

export const ALL = async ({ request }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { action, turnstileToken, data } = body;
    if (!action) {
      return new Response(JSON.stringify({ success: false, error: 'Missing action' }), { status: 400, headers: corsHeaders });
    }

    // CAPTCHA Verification (Mandatory for mutating public actions)
    if (action !== 'list-metadata') {
      if (!turnstileToken) {
        return new Response(JSON.stringify({ success: false, error: 'Captcha verification required' }), { status: 400, headers: corsHeaders });
      }

      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(env('TURNSTILE_SECRET_KEY'))}&response=${encodeURIComponent(turnstileToken)}`,
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return new Response(JSON.stringify({ success: false, error: 'Captcha verification failed. Please try again.' }), { status: 400, headers: corsHeaders });
        }
      } catch (err) {
        console.error('[Turnstile] Error:', err);
      }
    }

    const db = ensureFirebaseAdmin();

    switch (action) {
      case 'submit-entrepreneur':
        return await handleSubmitProfile(db, data, corsHeaders);
      case 'submit-listing':
        return await handleSubmitListing(db, data, corsHeaders);
      case 'get-upload-url':
        return await handleGetUploadUrl(body.fileData, corsHeaders);
      case 'optimize-image':
        return await handleOptimizeImage(body.imageParams, corsHeaders);
      case 'list-metadata':
        return await handleListMetadata(db, corsHeaders);
      default:
        return new Response(JSON.stringify({ success: false, error: `Unknown action: ${action}` }), { status: 400, headers: corsHeaders });
    }
  } catch (error) {
    console.error(`[PublicHandler] Action failed:`, error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
  }
};

async function handleListMetadata(db, corsHeaders) {
  const [cats, industries, types] = await Promise.all([
    db.collection('categories').get(),
    db.collection('taxonomies').doc('industries').get(),
    db.collection('taxonomies').get()
  ]);

  const listingTypes = types.docs.find(d => d.id === 'listing_types')?.data()?.items || [];
  const startupStages = types.docs.find(d => d.id === 'startup_stages')?.data()?.items || [];
  const employeeSizes = types.docs.find(d => d.id === 'employee_sizes')?.data()?.items || [];
  const cityItems = types.docs.find(d => d.id === 'cities')?.data()?.items || [];
  const industryItems = industries.exists ? (industries.data().items || []) : [];

  return new Response(JSON.stringify({
    success: true,
    categories: cats.docs.map(d => ({ id: d.id, ...d.data() })),
    industries: industryItems,
    listing_types: listingTypes,
    startup_stages: startupStages,
    employee_sizes: employeeSizes,
    cities: cityItems
  }), { status: 200, headers: corsHeaders });
}

async function handleSubmitProfile(db, data, corsHeaders) {
  if (!data.name || !data.email) {
    return new Response(JSON.stringify({ success: false, error: 'Missing Name or Email' }), { status: 400, headers: corsHeaders });
  }
  const submission = {
    ...data,
    status: 'pending',
    source: 'public',
    is_featured: false,
    view_count: 0,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    slug: data.slug || generateSlug(data.name)
  };
  const docRef = await db.collection('profiles').add(submission);
  return new Response(JSON.stringify({ success: true, id: docRef.id, name: data.name }), { status: 200, headers: corsHeaders });
}

async function handleSubmitListing(db, data, corsHeaders) {
  if (!data.business_name) {
    return new Response(JSON.stringify({ success: false, error: 'Missing Business Name' }), { status: 400, headers: corsHeaders });
  }
  const submission = {
    ...data,
    status: 'pending',
    source: 'public',
    is_featured: false,
    is_verified: false,
    view_count: 0,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    slug: data.slug || generateSlug(data.business_name)
  };
  const docRef = await db.collection('listings').add(submission);
  return new Response(JSON.stringify({ success: true, id: docRef.id, business_name: data.business_name }), { status: 200, headers: corsHeaders });
}

async function handleGetUploadUrl(fileData, corsHeaders) {
  const { fileName, contentType } = fileData;
  const bucketName = env('R2_BUCKET_NAME');
  const publicUrl = env('R2_PUBLIC_URL');
  const key = `public/submissions/${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;
  
  const command = new PutObjectCommand({ 
    Bucket: bucketName, 
    Key: key, 
    ContentType: contentType || 'image/jpeg' 
  });
  
  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 });
  return new Response(JSON.stringify({ success: true, uploadUrl, publicUrl: `${publicUrl}/${key}`, key }), { status: 200, headers: corsHeaders });
}

async function handleOptimizeImage(params, corsHeaders) {
  const { fileBase64, width, height, quality = 70, crop = true, type = 'profile' } = params;
  const buffer = Buffer.from(fileBase64, 'base64');
  
  let targetWidth = width ? Number(width) : 800;
  let targetHeight = height ? Number(height) : undefined;
  let targetQuality = Number(quality);

  if (type === 'profile' || type === 'logo') {
    targetWidth = 400;
    targetHeight = 400;
    targetQuality = 60;
  } else if (type === 'cover') {
    targetWidth = 1220;
    targetHeight = 320;
    targetQuality = 65;
  }

  let pipeline = sharp(buffer);
  pipeline = pipeline.resize({ 
    width: targetWidth, 
    height: targetHeight, 
    fit: crop ? 'cover' : 'inside'
  });

  const optimizedBuffer = await pipeline
    .jpeg({ 
      quality: targetQuality, 
      mozjpeg: true, 
      progressive: true,
      chromaSubsampling: '4:2:0'
    })
    .toBuffer();

  const key = `public/optimized/${type}-${Date.now()}.jpg`;
  const bucketName = env('R2_BUCKET_NAME');

  await getR2Client().send(new PutObjectCommand({ 
    Bucket: bucketName, 
    Key: key, 
    ContentType: 'image/jpeg', 
    Body: optimizedBuffer 
  }));

  return new Response(JSON.stringify({ 
    success: true,
    publicUrl: `${env('R2_PUBLIC_URL')}/${key}`, 
    key 
  }), { status: 200, headers: corsHeaders });
}

function generateSlug(text) {
  return text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}
