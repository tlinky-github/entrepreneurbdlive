const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const admin = require('firebase-admin');

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
  ];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
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

  const { key } = req.body || {};
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Missing R2 object key' });
  }

  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await r2Client.send(command);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('R2 Delete Error:', error);
    return res.status(500).json({ error: 'Failed to delete R2 object', details: error.message });
  }
};