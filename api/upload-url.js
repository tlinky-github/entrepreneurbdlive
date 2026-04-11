const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

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
