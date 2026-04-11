const http = require('http');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// 1. Simple .env loader
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const PORT = 5000;

const server = http.createServer(async (req, res) => {
  // Add CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/upload-url') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { fileName, fileType } = JSON.parse(body);

        if (!fileName || !fileType) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing fileName or fileType' }));
          return;
        }

        // Initialize S3 Client (R2)
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
        });

        const folderPrefix = process.env.R2_FOLDER_PREFIX || '';
        const fileExtension = fileName.split('.').pop();
        const folderPath = folderPrefix ? `${folderPrefix.replace(/\/$/, '')}/` : '';
        const uniqueKey = `${folderPath}${fileType}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const command = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: uniqueKey,
          ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        const publicUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${uniqueKey}`;

        console.log(`[Bridge] Generated URL for: ${uniqueKey}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ uploadUrl, publicUrl }));
      } catch (error) {
        console.error('[Bridge] Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 R2 Bridge running on http://localhost:${PORT}`);
  console.log(`📍 Proxying /api/upload-url to Cloudflare R2\n`);
});
