import { initializeFirebaseAdmin, admin } from '@/lib/firebase-admin';
import { getR2Client } from '@/lib/r2-client';
import { successResponse, errorResponse } from '@/lib/api-response';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

/**
 * Public Handler (Consolidated Router)
 * Ported from legacy api/public-handler.js 
 * Handles: list-metadata, submit-entrepreneur, submit-listing, get-upload-url, optimize-image
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, turnstileToken, data } = body;

    if (!action) return errorResponse('Missing action', 400);

    // CAPTCHA Verification (Mandatory for mutating public actions)
    if (action !== 'list-metadata') {
      if (!turnstileToken) {
        return errorResponse('Captcha verification required', 400);
      }

      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(turnstileToken)}`,
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return errorResponse('Captcha verification failed. Please try again.', 400);
        }
      } catch (err) {
        console.error('[Turnstile] Error:', err);
      }
    }

    const db = initializeFirebaseAdmin();
    if (!db) {
      console.error('❌ [PublicHandler] FATAL: Database instance is null. Check FIREBASE_CREDENTIALS_JSON.');
      return errorResponse('Database service is currently unavailable. Please contact administration.', 503);
    }

    switch (action) {
      case 'list-metadata':
        return await handleListMetadata(db);
      case 'submit-entrepreneur':
        return await handleSubmitProfile(db, data);
      case 'submit-listing':
        return await handleSubmitListing(db, data);
      case 'get-upload-url':
        return await handleGetUploadUrl(body.fileData);
      case 'optimize-image':
        return await handleOptimizeImage(body.imageParams);
      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('[PublicHandler] Error:', error);
    return errorResponse(error.message, 500);
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Action Handlers logic ported from legacy api/public-handler.js
 */

async function handleListMetadata(db) {
  const [cats, industries, types] = await Promise.all([
    db.collection('categories').get(),
    db.collection('taxonomies').doc('industries').get(),
    db.collection('taxonomies').get()
  ]);

  const listingTypes = types.docs.find(d => d.id === 'listing_types')?.data()?.items || [];
  const startupStages = types.docs.find(d => d.id === 'startup_stages')?.data()?.items || [];
  const employeeSizes = types.docs.find(d => d.id === 'employee_sizes')?.data()?.items || [];
  const industryItems = industries.exists ? (industries.data().items || []) : [];

  return successResponse({
    categories: cats.docs.map(d => ({ id: d.id, ...d.data() })),
    industries: industryItems,
    listing_types: listingTypes,
    startup_stages: startupStages,
    employee_sizes: employeeSizes
  });
}

function generateSlug(text) {
  return text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}

async function handleSubmitProfile(db, data) {
  if (!data.name || !data.email) return errorResponse('Missing Name or Email', 400);
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
  return successResponse({ id: docRef.id, name: data.name });
}

async function handleSubmitListing(db, data) {
  if (!data.business_name) return errorResponse('Missing Business Name', 400);
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
  return successResponse({ id: docRef.id, business_name: data.business_name });
}

async function handleGetUploadUrl(fileData) {
  const { fileName, contentType } = fileData;
  const r2Client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  const key = `public/submissions/${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;
  
  const command = new PutObjectCommand({ 
    Bucket: bucketName, 
    Key: key, 
    ContentType: contentType || 'image/jpeg' 
  });
  
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  return successResponse({ uploadUrl, publicUrl: `${publicUrl}/${key}`, key });
}

async function handleOptimizeImage(params) {
  const { fileBase64, width, height, quality = 70, crop = true, type = 'profile' } = params;
  const buffer = Buffer.from(fileBase64, 'base64');
  const r2Client = getR2Client();
  
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
  const bucketName = process.env.R2_BUCKET_NAME;

  await r2Client.send(new PutObjectCommand({ 
    Bucket: bucketName, 
    Key: key, 
    ContentType: 'image/jpeg', 
    Body: optimizedBuffer 
  }));

  return successResponse({ 
    publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`, 
    key 
  });
}
