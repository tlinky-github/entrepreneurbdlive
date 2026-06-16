const { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const admin = require('firebase-admin');
const axios = require('axios');
const sharp = require('sharp');
const { createVerify } = require('crypto');

let firebaseInitError = null;
let googleCertCache = null;
let googleCertCacheExpiresAt = 0;

const sanitizeJsonNewlines = (str) => {
  let result = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escape) {
      inString = !inString;
      result += char;
    } else if (char === '\\' && !escape) {
      escape = true;
      result += char;
    } else if (inString && (char === '\n' || char === '\r')) {
      if (char === '\n') {
        result += '\\n';
      }
      escape = false;
    } else {
      escape = false;
      result += char;
    }
  }
  return result;
};

const getFirebaseServiceAccount = () => {
  const credsJson = process.env.FIREBASE_CREDENTIALS_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (credsJson) {
    let sanitized = credsJson.trim();
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) || 
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
      sanitized = sanitized.slice(1, -1).trim();
    }
    return JSON.parse(sanitizeJsonNewlines(sanitized));
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

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
  const projectId = process.env.PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID;
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
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (!ensureFirebaseAdmin()) {
      return res.status(500).json({ error: firebaseInitError?.message || 'Firebase credentials are not configured' });
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const idToken = authHeader.split(' ')[1];
    await verifyFirebaseIdToken(idToken);

    const { action } = req.query;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    // ACTION: LIST
    if (action === 'list' && req.method === 'GET') {
      const folderPrefix = process.env.R2_FOLDER_PREFIX || 'assets/';
      const command = new ListObjectsV2Command({ Bucket: bucketName, Prefix: folderPrefix });
      const response = await r2Client.send(command);
      const mediaItems = (response.Contents || []).filter(item => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(item.Key.split('.').pop().toLowerCase())).map(item => ({
        url: `${publicUrl.replace(/\/$/, '')}/${item.Key}`,
        fileName: item.Key.split('/').pop(),
        contentType: `image/${item.Key.split('.').pop().toLowerCase()}`,
        size: item.Size,
        lastModified: item.LastModified,
        key: item.Key,
      }));
      return res.status(200).json({ data: mediaItems });
    }

    // ACTION: DELETE
    if (action === 'delete' && req.method === 'DELETE') {
      const { key } = req.body;
      if (!key) return res.status(400).json({ error: 'Key required' });
      await r2Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      return res.status(200).json({ success: true });
    }

    // ACTION: UPLOAD (Presigned URL)
    if (action === 'upload' && req.method === 'POST') {
      const { fileName, fileType, contentType } = req.body;
      const folderPrefix = process.env.R2_FOLDER_PREFIX || '';
      const uniqueKey = `${folderPrefix ? folderPrefix.replace(/\/$/, '') + '/' : ''}${fileType}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileName.split('.').pop()}`;
      const command = new PutObjectCommand({ Bucket: bucketName, Key: uniqueKey, ContentType: contentType || 'image/jpeg' });
      const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
      return res.status(200).json({ uploadUrl, publicUrl: `${publicUrl}/${uniqueKey}`, key: uniqueKey });
    }

    // ACTION: OPTIMIZE
    if (action === 'optimize' && req.method === 'POST') {
      const { sourceUrl, fileBase64, contentType, fileName, width, height, quality = 80, format = 'auto', crop = false } = req.body;
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

      return res.status(200).json({ 
        publicUrl: `${publicUrl.replace(/\/$/, '')}/${optimizedKey}`, 
        key: optimizedKey, 
        optimized: true,
        originalSize: buffer.length,
        optimizedSize: optimizedBuffer.length
      });
    }

    return res.status(400).json({ error: 'Invalid action or method' });
  } catch (error) {
    console.error('Media Handler Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
