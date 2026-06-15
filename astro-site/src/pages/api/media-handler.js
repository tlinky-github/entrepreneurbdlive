import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import admin from 'firebase-admin';
import axios from 'axios';
import sharp from 'sharp';
import { createVerify } from 'node:crypto';

let firebaseInitError = null;
let googleCertCache = null;
let googleCertCacheExpiresAt = 0;

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
  if (admin.apps?.length) return true;
  if (firebaseInitError) return false;

  try {
    const serviceAccount = getFirebaseServiceAccount();
    if (!serviceAccount) {
      firebaseInitError = new Error('Firebase credentials are not configured');
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return true;
  } catch (error) {
    firebaseInitError = error;
    return false;
  }
};

const decodeBase64Url = (value) => Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

const parseJwt = (token) => {
  const [headerPart, payloadPart, signaturePart] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error('Invalid token format');
  }

  return {
    header: JSON.parse(decodeBase64Url(headerPart)),
    payload: JSON.parse(decodeBase64Url(payloadPart)),
    signature: signaturePart,
    signingInput: `${headerPart}.${payloadPart}`,
  };
};

const getGoogleCerts = async () => {
  const now = Date.now();
  if (googleCertCache && now < googleCertCacheExpiresAt) {
    return googleCertCache;
  }

  const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!response.ok) {
    throw new Error('Unable to fetch Firebase public certificates');
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  googleCertCacheExpiresAt = now + maxAgeSeconds * 1000;
  googleCertCache = await response.json();
  return googleCertCache;
};

const verifyFirebaseIdTokenWithoutAdmin = async (idToken) => {
  const projectId = env('PUBLIC_FIREBASE_PROJECT_ID') || env('FIREBASE_PROJECT_ID') || env('REACT_APP_FIREBASE_PROJECT_ID');
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is not set');
  }

  const { header, payload, signature, signingInput } = parseJwt(idToken);
  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error('Firebase signing certificate not found');
  }

  const verified = createVerify('RSA-SHA256')
    .update(signingInput)
    .verify(cert, Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));

  if (!verified) {
    throw new Error('Invalid Firebase ID token signature');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSeconds) {
    throw new Error('Firebase ID token expired');
  }
  if (payload.aud !== projectId) {
    throw new Error('Firebase ID token audience mismatch');
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Firebase ID token issuer mismatch');
  }

  return payload;
};

const verifyFirebaseIdToken = async (idToken) => {
  if (admin.apps?.length) {
    return admin.auth().verifyIdToken(idToken);
  }

  return verifyFirebaseIdTokenWithoutAdmin(idToken);
};

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env('R2_ACCESS_KEY_ID'), secretAccessKey: env('R2_SECRET_ACCESS_KEY') },
});

export const ALL = async ({ request, url }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    ensureFirebaseAdmin();

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const idToken = authHeader.split(' ')[1];
    await verifyFirebaseIdToken(idToken);

    const action = url.searchParams.get('action');
    const bucketName = env('R2_BUCKET_NAME');
    const publicUrl = env('R2_PUBLIC_URL');

    // ACTION: LIST
    if (action === 'list' && request.method === 'GET') {
      const folderPrefix = env('R2_FOLDER_PREFIX') || 'assets/';
      const command = new ListObjectsV2Command({ Bucket: bucketName, Prefix: folderPrefix });
      const response = await r2Client.send(command);
      const mediaItems = (response.Contents || [])
        .filter(item => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(item.Key.split('.').pop().toLowerCase()))
        .map(item => ({
          url: `${publicUrl.replace(/\/$/, '')}/${item.Key}`,
          fileName: item.Key.split('/').pop(),
          contentType: `image/${item.Key.split('.').pop().toLowerCase()}`,
          size: item.Size,
          lastModified: item.LastModified,
          key: item.Key,
        }));
      return new Response(JSON.stringify({ data: mediaItems }), { status: 200, headers: corsHeaders });
    }

    // ACTION: DELETE
    if (action === 'delete' && request.method === 'DELETE') {
      const body = await request.json();
      const { key } = body;
      if (!key) return new Response(JSON.stringify({ error: 'Key required' }), { status: 400, headers: corsHeaders });
      await r2Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    // ACTION: UPLOAD (Presigned URL)
    if (action === 'upload' && request.method === 'POST') {
      const body = await request.json();
      const { fileName, fileType, contentType } = body;
      const folderPrefix = env('R2_FOLDER_PREFIX') || '';
      const uniqueKey = `${folderPrefix ? folderPrefix.replace(/\/$/, '') + '/' : ''}${fileType}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileName.split('.').pop()}`;
      const command = new PutObjectCommand({ Bucket: bucketName, Key: uniqueKey, ContentType: contentType || 'image/jpeg' });
      const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
      return new Response(JSON.stringify({ uploadUrl, publicUrl: `${publicUrl}/${uniqueKey}`, key: uniqueKey }), { status: 200, headers: corsHeaders });
    }

    // ACTION: OPTIMIZE
    if (action === 'optimize' && request.method === 'POST') {
      const body = await request.json();
      const { sourceUrl, fileBase64, contentType, width, height, quality = 80, format = 'auto', crop = false } = body;
      let buffer;
      let sourceMime = contentType;
      
      if (sourceUrl) {
        const response = await axios.get(sourceUrl, { responseType: 'arraybuffer' });
        buffer = Buffer.from(response.data);
        sourceMime = response.headers['content-type'] || sourceMime;
      } else {
        buffer = Buffer.from(fileBase64, 'base64');
      }

      const getExt = (mime) => {
        const m = (mime || '').toLowerCase();
        if (m.includes('png')) return 'png';
        if (m.includes('webp')) return 'webp';
        if (m.includes('gif')) return 'gif';
        return 'jpg';
      };

      const targetExt = format !== 'auto' ? format : getExt(sourceMime);
      const optimizedKey = `assets/optimized/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${targetExt}`;
      
      let pipeline = sharp(buffer);
      if (width || height) {
        pipeline = pipeline.resize({ 
          width: width ? Number(width) : undefined, 
          height: height ? Number(height) : undefined, 
          fit: crop ? 'cover' : 'inside',
          withoutEnlargement: true 
        });
      }

      let optimizedBuffer;
      const qNum = Number(quality);
      if (targetExt === 'png') optimizedBuffer = await pipeline.png({ quality: qNum, compressionLevel: 9 }).toBuffer();
      else if (targetExt === 'webp') optimizedBuffer = await pipeline.webp({ quality: qNum }).toBuffer();
      else if (targetExt === 'gif') optimizedBuffer = await pipeline.gif().toBuffer();
      else optimizedBuffer = await pipeline.jpeg({ quality: qNum, mozjpeg: true }).toBuffer();

      await r2Client.send(new PutObjectCommand({ 
        Bucket: bucketName, 
        Key: optimizedKey, 
        ContentType: `image/${targetExt === 'jpg' ? 'jpeg' : targetExt}`, 
        Body: optimizedBuffer 
      }));

      return new Response(JSON.stringify({ 
        publicUrl: `${publicUrl.replace(/\/$/, '')}/${optimizedKey}`, 
        key: optimizedKey, 
        optimized: true,
        originalSize: buffer.length,
        optimizedSize: optimizedBuffer.length
      }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Invalid action or method' }), { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error('Media Handler Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
};
