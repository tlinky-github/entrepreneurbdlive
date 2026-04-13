const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const admin = require('firebase-admin');

// 0. Initialize Firebase Admin once with enhanced credential detection
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

// Cloudflare R2 Configuration from Environment Variables
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = async (req, res) => {
  // 1. Basic Security: Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1b. Enhanced Security: Firebase Auth Token Check
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    console.warn('Unauthorized API access attempt: Missing or malformed token');
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split(/\s+/)[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
  } catch (error) {
    console.error('Firebase Auth Error:', error.message);
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }

  // 2. Fetch filename and type from request
  const { fileName, fileType, contentType } = req.body;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  // 3. Validation
  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'Filename and Filetype are required' });
  }

  // 4. Generate a unique key to avoid overwriting
  const folderPrefix = process.env.R2_FOLDER_PREFIX || '';
  const fileExtension = fileName.split('.').pop();
  const folderPath = folderPrefix ? `${folderPrefix.replace(/\/$/, '')}/` : '';
  const uniqueKey = `${folderPath}${fileType}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

  try {
    // 5. Create the PutObject command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: contentType || 'image/jpeg',
    });

    // 6. Generate the Presigned URL (valid for 5 minutes)
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

    // 7. Return the presigned URL and the final public URL
    // Public URL is where the image will be accessible after upload
    const finalPublicUrl = `${publicUrl}/${uniqueKey}`;

    return res.status(200).json({
      uploadUrl: presignedUrl,
      publicUrl: finalPublicUrl,
      key: uniqueKey
    });
  } catch (error) {
    console.error('R2 Presign Error:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};
