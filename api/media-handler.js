const { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const admin = require('firebase-admin');
const axios = require('axios');
const sharp = require('sharp');

// Initialize Firebase Admin (Singleton)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') }) });
  } else {
    admin.initializeApp({ projectId: projectId || process.env.REACT_APP_FIREBASE_PROJECT_ID });
  }
}

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
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const idToken = authHeader.split(' ')[1];
    await admin.auth().verifyIdToken(idToken);

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
