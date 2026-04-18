const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables
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
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`[Bridge] ${req.method} ${pathname}`);

  // 1. Shims for Vercel/Express compatibility
  req.query = parsedUrl.query;
  res.status = (code) => { 
    res.statusCode = code; 
    return res; 
  };
  res.json = (data) => {
    if (!res.writableEnded) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    }
    return res;
  };

  // 2. CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 3. Read Body
  let bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', async () => {
    try {
      const rawBody = Buffer.concat(bodyChunks).toString();
      if (rawBody && req.headers['content-type']?.includes('application/json')) {
        try {
          req.body = JSON.parse(rawBody);
        } catch (e) {
          req.body = rawBody;
        }
      } else {
        req.body = rawBody;
      }

      // 4. Routes
      // Map local paths to Vercel functions
      if (pathname === '/api/ai/ai-router') {
        const handlerPath = path.resolve(__dirname, '../api/ai/ai-router.js');
        delete require.cache[require.resolve(handlerPath)]; // Hot reload
        const handler = require(handlerPath);
        return handler(req, res);
      }

      if (pathname === '/api/media-handler') {
        const handlerPath = path.resolve(__dirname, '../api/media-handler.js');
        delete require.cache[require.resolve(handlerPath)]; // Hot reload
        const handler = require(handlerPath);
        return handler(req, res);
      }

      // Legacy support (proxies to the consolidated routers)
      if (pathname.startsWith('/api/ai/')) {
        const target = pathname.split('/').pop().replace('-handler', '').replace('posts', 'posts');
        req.query.target = target;
        const handlerPath = path.resolve(__dirname, '../api/ai/ai-router.js');
        const handler = require(handlerPath);
        return handler(req, res);
      }

      // Default 404
      res.status(404).json({ error: `Route ${pathname} not handled by local-bridge` });
    } catch (err) {
      console.error('[Bridge Error]', err);
      if (!res.writableEnded) {
        res.status(500).json({ error: err.message, stack: err.stack });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', `\n🚀 API Bridge (Vercel Emulator) running on http://localhost:${PORT}`);
  console.log('\x1b[32m%s\x1b[0m', `📍 Handling /api/ai/ai-router and /api/media-handler`);
  console.log('\x1b[33m%s\x1b[0m', `💡 Make sure your frontend has "proxy": "http://localhost:${PORT}" in package.json\n`);
});
