const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const admin = require('firebase-admin');

// Initialize Firebase Admin (Same logic as upload-url.js)
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

module.exports = async (req, res) => {
  // CORS for dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Configuration Guard
  const requiredEnvVars = [
    'R2_ACCOUNT_ID', 
    'R2_ACCESS_KEY_ID', 
    'R2_SECRET_ACCESS_KEY', 
    'R2_BUCKET_NAME', 
    'R2_PUBLIC_URL'
  ];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    return res.status(500).json({ error: 'Missing environment variables', missingVars });
  }

  // Auth Guard
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

  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;
    const folderPrefix = process.env.R2_FOLDER_PREFIX || 'assets/';

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
    });

    const response = await r2Client.send(command);
    
    // Transform R2 contents into a clean Media Gallery format
    const mediaItems = (response.Contents || [])
      .filter(item => {
        // Only include files with image extensions
        const ext = item.Key.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
      })
      .map(item => ({
        url: `${publicUrl.replace(/\/$/, '')}/${item.Key}`,
        fileName: item.Key.split('/').pop(),
        contentType: `image/${item.Key.split('.').pop().toLowerCase()}`,
        size: item.Size,
        lastModified: item.LastModified,
        id: Buffer.from(item.Key).toString('base64').substring(0, 15) // Generate a temporary ID
      }));

    return res.status(200).json({ data: mediaItems });
  } catch (error) {
    console.error('R2 List Error:', error);
    return res.status(500).json({ error: 'Failed to list bucket contents' });
  }
};
