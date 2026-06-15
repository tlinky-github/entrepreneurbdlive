import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import admin from 'firebase-admin';
import axios from 'axios';
import sharp from 'sharp';

// Initialize Firebase Admin (Singleton)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') }) });
  } else {
    admin.initializeApp({ projectId: projectId || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'demo-project' });
  }
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const idToken = authHeader.split(' ')[1];
    await admin.auth().verifyIdToken(idToken);

    const action = url.searchParams.get('action');
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    // ACTION: LIST
    if (action === 'list' && request.method === 'GET') {
      const folderPrefix = process.env.R2_FOLDER_PREFIX || 'assets/';
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
      const folderPrefix = process.env.R2_FOLDER_PREFIX || '';
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
