import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getFirestore, getServerTimestamp } from '../../lib/firebaseAdmin.js';


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
    const contentTypeHeader = request.headers.get('content-type') || '';
    let action, turnstileToken, data, body;
    let file = null, fileName = null, fileType = null;

    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await request.formData();
      action = formData.get('action');
      turnstileToken = formData.get('turnstileToken');
      file = formData.get('file');
      fileName = formData.get('fileName') || (file ? file.name : '');
      fileType = formData.get('fileType') || 'public-submission';
    } else {
      body = await request.json();
      action = body.action;
      turnstileToken = body.turnstileToken;
      data = body.data;
    }

    if (!action) {
      return new Response(JSON.stringify({ success: false, error: 'Missing action' }), { status: 400, headers: corsHeaders });
    }

    // CAPTCHA Verification (Mandatory for mutating public actions)
    if (action !== 'list-metadata' && action !== 'user-submissions') {
      const isDashboardSource = data?.source === 'dashboard';
      if (!turnstileToken && !isDashboardSource) {
        return new Response(JSON.stringify({ success: false, error: 'Captcha verification required' }), { status: 400, headers: corsHeaders });
      }

      if (turnstileToken) {
        try {
          const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(env('TURNSTILE_SECRET_KEY'))}&response=${encodeURIComponent(turnstileToken)}`,
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success && !isDashboardSource) {
            return new Response(JSON.stringify({ success: false, error: 'Captcha verification failed. Please try again.' }), { status: 400, headers: corsHeaders });
          }
        } catch (err) {
          console.error('[Turnstile] Error:', err);
        }
      }
    }

    const db = getFirestore();

    switch (action) {
      case 'submit-entrepreneur':
        return await handleSubmitProfile(db, data, corsHeaders);
      case 'submit-listing':
        return await handleSubmitListing(db, data, corsHeaders);
      case 'submit-article':
        return await handleSubmitArticle(db, data, corsHeaders);
      case 'user-submissions':
        return await handleGetUserSubmissions(db, body?.email || data?.email, corsHeaders);
      case 'get-upload-url':
        return await handleGetUploadUrl(body.fileData, corsHeaders);
      case 'upload-direct':
        return await handleUploadDirect(file, fileName, fileType, corsHeaders);
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
  // Fetch all taxonomy data from Firestore in parallel — no hardcoded values
  const [catsSnap, indSnap, citySnap, listingTypesSnap, startupStagesSnap, employeeSizesSnap] = await Promise.all([
    db.collection('categories').get().catch(() => ({ docs: [] })),
    db.collection('industries').get().catch(() => ({ docs: [] })),
    db.collection('cities').get().catch(() => ({ docs: [] })),
    db.collection('listing_types').get().catch(() => ({ docs: [] })),
    db.collection('startup_stages').get().catch(() => ({ docs: [] })),
    db.collection('employee_sizes').get().catch(() => ({ docs: [] })),
  ]);

  const categories = (catsSnap.docs || []).map(d => ({ id: d.id, ...d.data() }));
  const industries = (indSnap.docs || []).map(d => d.data().name || d.id);
  const cities = (citySnap.docs || []).map(d => d.data().name || d.id);
  const listing_types = (listingTypesSnap.docs || []).map(d => ({ id: d.id, ...d.data() }));
  const startup_stages = (startupStagesSnap.docs || []).map(d => d.data().name || d.id);
  const employee_sizes = (employeeSizesSnap.docs || []).map(d => d.data().name || d.id);

  return new Response(JSON.stringify({
    success: true,
    data: { categories, industries, cities, listing_types, startup_stages, employee_sizes }
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
    created_at: getServerTimestamp(),
    updated_at: getServerTimestamp(),
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
    created_at: getServerTimestamp(),
    updated_at: getServerTimestamp(),
    slug: data.slug || generateSlug(data.business_name)
  };
  const docRef = await db.collection('listings').add(submission);
  return new Response(JSON.stringify({ success: true, id: docRef.id, business_name: data.business_name }), { status: 200, headers: corsHeaders });
}

async function handleSubmitArticle(db, data, corsHeaders) {
  if (!data.title || !data.email) {
    return new Response(JSON.stringify({ success: false, error: 'Missing Article Title or Email' }), { status: 400, headers: corsHeaders });
  }
  const submission = {
    ...data,
    type: 'post',
    status: 'pending',
    source: data.source || 'public',
    is_featured: false,
    view_count: 0,
    created_at: getServerTimestamp(),
    updated_at: getServerTimestamp(),
    slug: data.slug || generateSlug(data.title)
  };
  const docRef = await db.collection('posts').add(submission);
  await db.collection('submissions').add(submission).catch(() => {});
  return new Response(JSON.stringify({ success: true, id: docRef.id, title: data.title }), { status: 200, headers: corsHeaders });
}

async function handleGetUserSubmissions(db, email, corsHeaders) {
  if (!email) {
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: corsHeaders });
  }
  try {
    const [subSnap, postSnap, profileSnap, listingSnap] = await Promise.all([
      db.collection('submissions').where('email', '==', email).get().catch(() => ({ docs: [] })),
      db.collection('posts').where('email', '==', email).get().catch(() => ({ docs: [] })),
      db.collection('profiles').where('email', '==', email).get().catch(() => ({ docs: [] })),
      db.collection('listings').where('email', '==', email).get().catch(() => ({ docs: [] }))
    ]);

    const items = [
      ...subSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      ...postSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'post' })),
      ...profileSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'entrepreneur' })),
      ...listingSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'directory' }))
    ];

    const seen = new Set();
    const uniqueItems = items.filter(item => {
      const key = item.id || item.title || item.business_name || item.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return new Response(JSON.stringify({ success: true, data: uniqueItems }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('GetUserSubmissions error:', err);
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: corsHeaders });
  }
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

  const sharpModule = await import('sharp');
  const sharp = sharpModule.default;
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

async function handleUploadDirect(file, fileName, fileType, corsHeaders) {
  if (!file) {
    return new Response(JSON.stringify({ success: false, error: 'No file uploaded' }), { status: 400, headers: corsHeaders });
  }
  const bucketName = env('R2_BUCKET_NAME');
  const publicUrl = env('R2_PUBLIC_URL');
  const key = `public/submissions/${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  await getR2Client().send(new PutObjectCommand({ 
    Bucket: bucketName, 
    Key: key, 
    ContentType: file.type || 'image/jpeg', 
    Body: buffer
  }));

  return new Response(JSON.stringify({ 
    success: true, 
    publicUrl: `${publicUrl.replace(/\/$/, '')}/${key}`, 
    key 
  }), { status: 200, headers: corsHeaders });
}
