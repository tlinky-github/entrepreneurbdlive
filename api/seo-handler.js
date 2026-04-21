const sharp = require('sharp');
const axios = require('axios');

// --- CONFIG ---
const PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
const SITE_URL = 'https://entrepreneurs.bd';

// --- IRONCLAD MASTER HTML SHELL ---
const HTML_SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#34d399">
    <link rel="icon" href="${SITE_URL}/favicon.ico">
    {{META_TAGS}}
    <style>
        body { background: #022c22; color: #34d399; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        .emerald-loader { border: 4px solid #064e3b; border-top: 4px solid #34d399; border-radius: 50%; width: 50px; height: 50px; animation: spin 0.8s ease-in-out infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        h1 { font-size: 1.5rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
        p { color: #d1d5db; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div>
        <div class="emerald-loader"></div>
        <h1>Entrepreneurs BD</h1>
        <p>Connecting you to the National Growth Engine...</p>
    </div>
    <script>window.location.href = "{{REDIRECT_PATH}}";</script>
</body>
</html>`;

// --- HELPER: FIRESTORE REST API ---
async function fetchFirestoreDoc(collection, slug) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    const query = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'slug' },
            op: 'EQUAL',
            value: { stringValue: slug }
          }
        },
        limit: 1
      }
    };
    
    const res = await axios.post(`${url}?key=${API_KEY}`, query, { timeout: 5000 });
    if (res.data && res.data[0] && res.data[0].document) {
      const doc = res.data[0].document;
      const fields = doc.fields;
      // Simple transform from Firestore REST format to JS Object
      const data = {};
      for (const key in fields) {
        const val = fields[key];
        data[key] = val.stringValue || val.integerValue || val.booleanValue || val.timestampValue || (val.mapValue ? val.mapValue.fields : null);
      }
      return data;
    }
    return null;
  } catch (e) {
    console.warn(`[Firestore REST] Fail: ${e.message}`);
    return null;
  }
}

// --- HELPER: OG IMAGE ENGINE ---
async function generateOgImage(title, description, image, category) {
  const cleanTitle = (title || 'Entrepreneurs BD').length > 70 ? (title || 'Entrepreneurs BD').substring(0, 67) + '...' : (title || 'Entrepreneurs BD');
  const cleanDesc = (description || '').replace(/<[^>]*>/g, '').substring(0, 100);
  const cleanCategory = (category || 'Insights').toUpperCase();

  let backgroundBuffer;
  try {
    if (image && image.startsWith('http')) {
      const imgRes = await axios.get(image, { responseType: 'arraybuffer', timeout: 5000 });
      backgroundBuffer = await sharp(imgRes.data)
        .resize(1200, 630, { fit: 'cover' })
        .blur(8)
        .modulate({ brightness: 0.4 })
        .toBuffer();
    }
  } catch (e) { console.warn('[OG Engine] BG Fail:', e.message); }

  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#064e3b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#022c22;stop-opacity:1" />
        </linearGradient>
      </defs>
      ${!backgroundBuffer ? `<rect width="1200" height="630" fill="url(#bgGrad)" />` : ''}
      <text x="80" y="100" font-family="sans-serif" font-size="28" font-weight="900" fill="#34d399" letter-spacing="3">ENTREPRENEURS BD</text>
      <rect x="80" y="140" width="${cleanCategory.length * 15 + 40}" height="40" rx="20" fill="#059669" />
      <text x="${80 + (cleanCategory.length * 15 + 40) / 2}" y="166" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${cleanCategory}</text>
      <foreignObject x="80" y="210" width="1040" height="280">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: sans-serif; font-size: 68px; font-weight: 800; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
          ${cleanTitle}
        </div>
      </foreignObject>
      <text x="80" y="585" font-family="sans-serif" font-size="24" font-weight="bold" fill="#059669" opacity="0.8">entrepreneurs.bd</text>
    </svg>
  `;

  let finalImage = sharp(backgroundBuffer || {
    create: { width: 1200, height: 630, channels: 4, background: { r: 6, g: 78, b: 59 } }
  });

  return await finalImage.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
}

module.exports = async (req, res) => {
  const host = req.headers.host || 'entrepreneurs.bd';
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /bot|google|crawler|spider|facebook|whatsapp|linkedin|twitter|slack|discord|telegram|apple|bing|yandex|baiduspider|metainspector|structured-data|rich-results/i.test(userAgent);

  // --- PATH RESOLVER ---
  const pathParam = req.query.path || '';
  const finalPath = (pathParam === 'home' || !pathParam) ? '/' : (pathParam.startsWith('/') ? pathParam : `/${pathParam}`);
  const segments = finalPath.split('/').filter(Boolean);
  const type = (finalPath === '/' || segments.length === 0) ? 'home' : segments[0];
  const slug = segments.length > 1 ? segments[1] : null;

  // --- HUMAN ESCAPE HATCH ---
  if (!isBot && !req.query.force_bot) {
    const sep = finalPath.includes('?') ? '&' : '?';
    res.setHeader('Location', `${finalPath}${sep}no_bot=1`);
    return res.status(301).end();
  }

  try {
    let title = "Entrepreneurs BD | The National Engine of Growth";
    let description = "Developing 1 million entrepreneurs by 2030. Connect, discover, and scale your startup on Bangladesh's premier growth hub.";
    let image = `${SITE_URL}/og-default.png`;
    let docData = null;

    // --- ESCAPE PATH (Force Human Mode) ---
    const sep = finalPath.includes('?') ? '&' : '?';
    const escapedRedirectPath = `${finalPath}${sep}no_bot=1`;

    // --- DATA FETCHING (REST) ---
    if (type !== 'home' && slug) {
      const colMap = { 'blog': 'posts', 'directory': 'listings', 'entrepreneurs': 'profiles', 'knowledge': 'resources' };
      if (colMap[type]) {
        docData = await fetchFirestoreDoc(colMap[type], slug);
        if (docData) {
          title = docData.title || docData.business_name || docData.name || title;
          description = (docData.excerpt || docData.seo_description || docData.short_description || docData.short_bio || description).replace(/<[^>]*>/g, '').substring(0, 160);
          image = docData.featured_image || docData.logo || docData.photo || image;
        }
      }
    }

    const currentAbsoluteUrl = `https://${host}${finalPath}`;
    const dynamicOgUrl = `${SITE_URL}/api/og-image?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(image)}`;

    // --- SCHEMAS ---
    const orgSchema = { "@context": "https://schema.org", "@type": "Organization", "name": "Entrepreneurs BD", "url": SITE_URL, "logo": `${SITE_URL}/logo.png`, "sameAs": ["https://www.facebook.com/entrepreneursbd.official/"] };
    let mainSchema = { "@context": "https://schema.org", "@type": "WebPage", "headline": title, "description": description, "image": image, "url": currentAbsoluteUrl };
    
    if (type === 'blog' && slug) {
      mainSchema = { "@context": "https://schema.org", "@type": "BlogPosting", "headline": title, "description": description, "image": image, "datePublished": new Date().toISOString(), "publisher": orgSchema };
    }

    const metaTags = `
      <title>${title}</title>
      <meta name="description" content="${description}">
      <link rel="canonical" href="${currentAbsoluteUrl}">
      <meta property="og:type" content="${type === 'blog' ? 'article' : 'website'}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${dynamicOgUrl}">
      <meta property="og:url" content="${currentAbsoluteUrl}">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${description}">
      <meta name="twitter:image" content="${dynamicOgUrl}">
      <script type="application/ld+json">${JSON.stringify(orgSchema)}</script>
      <script type="application/ld+json">${JSON.stringify(mainSchema)}</script>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-SEO-Engine', 'NUCLEAR-REST-v1');
    return res.status(200).send(HTML_SHELL.replace('{{META_TAGS}}', metaTags).replace('{{REDIRECT_PATH}}', escapedRedirectPath));

  } catch (error) {
    console.error('[CRITICAL] SEO failure:', error.message);
    const sep = finalPath.includes('?') ? '&' : '?';
    const escapedRedirectPath = `${finalPath}${sep}no_bot=1`;
    return res.status(200).send(HTML_SHELL.replace('{{META_TAGS}}', '').replace('{{REDIRECT_PATH}}', escapedRedirectPath));
  }
};
