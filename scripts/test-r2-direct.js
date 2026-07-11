require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

console.log('R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID);
console.log('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID);
console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  },
});

async function run() {
  try {
    console.log('Sending list objects command...');
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: process.env.R2_FOLDER_PREFIX || 'assets/',
    });
    const response = await r2Client.send(command);
    console.log('Success! Contents count:', (response.Contents || []).length);
    if (response.Contents && response.Contents.length > 0) {
      console.log('First object:', response.Contents[0]);
    }
  } catch (error) {
    console.error('Error connecting to Cloudflare R2:', error);
  }
}

run();
