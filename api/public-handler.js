const { initializeFirebase, errorResponse, successResponse } = require('./ai/_lib');
const admin = require('firebase-admin');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');

// Initialize R2 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { 
    accessKeyId: process.env.R2_ACCESS_KEY_ID, 
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY 
  },
});

/**
 * Public Handler (Consolidated Router)
 * Handles non-authenticated public actions: Submissions, Captcha, Public Media
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return errorResponse(res, 405, 'Method not allowed');

  const { action, turnstileToken, data } = req.body;
  if (!action) return errorResponse(res, 400, 'Missing action');
  
  // CAPTCHA Verification (Mandatory for all public actions)
  if (!turnstileToken) {
    return errorResponse(res, 400, 'Captcha verification required');
  }

  try {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return errorResponse(res, 400, 'Captcha verification failed. Please try again.');
    }
  } catch (err) {
    console.error('[Turnstile] Error:', err);
  }

  const db = initializeFirebase();

  try {
    switch (action) {
      case 'submit-entrepreneur':
        return await handleSubmitProfile(db, data, res);
      case 'submit-listing':
        return await handleSubmitListing(db, data, res);
      case 'get-upload-url':
        return await handleGetUploadUrl(req.body.fileData, res);
      case 'optimize-image':
        return await handleOptimizeImage(req.body.imageParams, res);
      case 'list-metadata':
        return await handleListMetadata(db, res);
      default:
        return errorResponse(res, 400, `Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(`[PublicHandler] Action ${action} failed:`, error);
    return errorResponse(res, 500, error.message);
  }
};

async function handleListMetadata(db, res) {
  const [cats, industries, types] = await Promise.all([
    db.collection('categories').get(),
    db.collection('taxonomies').doc('industries').get(),
    db.collection('taxonomies').get()
  ]);

  // Handle nested taxonomies
  const listingTypes = types.docs.find(d => d.id === 'listing_types')?.data()?.items || [];
  const startupStages = types.docs.find(d => d.id === 'startup_stages')?.data()?.items || [];
  const employeeSizes = types.docs.find(d => d.id === 'employee_sizes')?.data()?.items || [];
  const industryItems = industries.exists ? (industries.data().items || []) : [];

  return successResponse(res, {
    categories: cats.docs.map(d => ({ id: d.id, ...d.data() })),
    industries: industryItems,
    listing_types: listingTypes,
    startup_stages: startupStages,
    employee_sizes: employeeSizes
  });
}

async function handleSubmitProfile(db, data, res) {
  if (!data.name || !data.email) return errorResponse(res, 400, 'Missing Name or Email');
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
  return successResponse(res, { id: docRef.id, name: data.name });
}

async function handleSubmitListing(db, data, res) {
  if (!data.business_name) return errorResponse(res, 400, 'Missing Business Name');
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
  return successResponse(res, { id: docRef.id, business_name: data.business_name });
}

async function handleGetUploadUrl(fileData, res) {
  const { fileName, contentType } = fileData;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  const key = `public/submissions/${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;
  
  const command = new PutObjectCommand({ 
    Bucket: bucketName, 
    Key: key, 
    ContentType: contentType || 'image/jpeg' 
  });
  
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  return successResponse(res, { uploadUrl, publicUrl: `${publicUrl}/${key}`, key });
}

async function handleOptimizeImage(params, res) {
  const { fileBase64, width, height, quality = 70, crop = true, type = 'profile' } = params;
  const buffer = Buffer.from(fileBase64, 'base64');
  
  // Set target constraints based on type
  let targetWidth = width ? Number(width) : 800;
  let targetHeight = height ? Number(height) : undefined;
  let targetQuality = Number(quality);

  if (type === 'profile' || type === 'logo') {
    targetWidth = 400;
    targetHeight = 400;
    targetQuality = 60; // Aggressive for < 20KB
  } else if (type === 'cover') {
    targetWidth = 1220;
    targetHeight = 320;
    targetQuality = 65; // Balanced for < 50KB
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

  return successResponse(res, { 
    publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`, 
    key 
  });
}

function generateSlug(text) {
  return text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}
