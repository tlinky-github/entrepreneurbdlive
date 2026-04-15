const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const admin = require('firebase-admin');
const axios = require('axios');
const sharp = require('sharp');

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    admin.initializeApp({
      projectId: projectId || process.env.REACT_APP_FIREBASE_PROJECT_ID,
    });
  }
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const getFileNameFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    const fileName = parsed.pathname.split('/').pop() || 'optimized-image';
    return fileName.split('?')[0];
  } catch {
    return 'optimized-image';
  }
};

const getExtensionFromMime = (mime) => {
  if (!mime) return 'jpg';
  const normalized = mime.toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  return 'jpg';
};

const getContentTypeForExt = (ext) => {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requiredEnvVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    return res.status(500).json({ error: 'Missing environment variables', missingVars });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split(' ')[1];
  try {
    await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const { sourceUrl, fileBase64, contentType, fileName, width, height, quality = 80, format = 'auto', crop = false } = req.body || {};
  if (!sourceUrl && !fileBase64) {
    return res.status(400).json({ error: 'sourceUrl or fileBase64 is required' });
  }

  let buffer;
  let sourceMime = contentType;
  let finalFileName = fileName;

  try {
    if (sourceUrl) {
      const response = await axios.get(sourceUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });
      buffer = Buffer.from(response.data);
      sourceMime = response.headers['content-type'] || sourceMime;
      finalFileName = finalFileName || getFileNameFromUrl(sourceUrl);
    } else {
      if (!contentType) {
        return res.status(400).json({ error: 'contentType is required when uploading fileBase64' });
      }
      buffer = Buffer.from(fileBase64, 'base64');
      finalFileName = finalFileName || `optimized-image.${getExtensionFromMime(contentType)}`;
    }
  } catch (error) {
    console.error('Failed to load source image:', error.message || error);
    return res.status(500).json({ error: 'Failed to load source image', details: error.message });
  }

  const sourceExtension = getExtensionFromMime(sourceMime || 'image/jpeg');
  const targetExtension = format !== 'auto' ? format : sourceExtension;
  const targetMime = getContentTypeForExt(targetExtension);
  const folderPrefix = process.env.R2_FOLDER_PREFIX || '';
  const folderPath = folderPrefix ? `${folderPrefix.replace(/\/$/, '')}/` : '';
  const optimizedKey = `${folderPath}optimized/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${targetExtension}`;

  try {
    let pipeline = sharp(buffer);
    const resizeOptions = {
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      withoutEnlargement: true,
      fit: crop ? 'cover' : 'inside',
      position: 'center',
    };

    if (resizeOptions.width || resizeOptions.height) {
      pipeline = pipeline.resize(resizeOptions);
    }

    let optimizedBuffer;
    if (targetExtension === 'png') {
      optimizedBuffer = await pipeline.png({ quality: Number(quality), compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    } else if (targetExtension === 'webp') {
      optimizedBuffer = await pipeline.webp({ quality: Number(quality) }).toBuffer();
    } else if (targetExtension === 'gif') {
      optimizedBuffer = await pipeline.gif().toBuffer();
    } else {
      optimizedBuffer = await pipeline.jpeg({ mozjpeg: true, quality: Number(quality) }).toBuffer();
    }

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: optimizedKey,
      ContentType: targetMime,
      Body: optimizedBuffer,
    });

    await r2Client.send(command);

    return res.status(200).json({
      publicUrl: `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${optimizedKey}`,
      key: optimizedKey,
      optimized: true,
      contentType: targetMime,
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length,
      savingsPercent: buffer.length > 0 ? Math.round((1 - optimizedBuffer.length / buffer.length) * 100) : 0,
    });
  } catch (error) {
    console.error('Image optimization/upload failed:', error.message || error);
    return res.status(500).json({ error: 'Failed to optimize image', details: error.message });
  }
};
