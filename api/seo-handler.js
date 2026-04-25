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
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#064e3b" />
    <style>
        body { margin: 0; font-family: 'Inter', sans-serif, system-ui; background: #fafaf9; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
        .loader { display: flex; flex-direction: column; align-items: center; gap: 20px; animation: fadeIn 0.5s ease-out; text-align: center; }
        .logo { width: 120px; height: auto; animation: pulse 2s infinite ease-in-out; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .spinner { width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #059669; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader">
        <img src="/logo.png" alt="Entrepreneurs BD" class="logo" />
        <div class="spinner"></div>
        <div style="color: #064e3b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Loading Growth Engine...</div>
    </div>
    <script>window.location.href = "{{REDIRECT_PATH}}";</script>
    {{META_TAGS}}
</body>
</html>`;

// --- HELPER: FIRESTORE REST API (Robust) ---
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
    
    const res = await axios.post(`${url}?key=${API_KEY}`, query, { timeout: 8000 });
    if (res.data && res.data[0] && res.data[0].document) {
      const doc = res.data[0].document;
      const fields = doc.fields;
      const data = {};
      
      // Advanced Transform for all Firestore Types
      for (const key in fields) {
        const val = fields[key];
        if (val.stringValue !== undefined) data[key] = val.stringValue;
        else if (val.integerValue !== undefined) data[key] = parseInt(val.integerValue);
        else if (val.doubleValue !== undefined) data[key] = parseFloat(val.doubleValue);
        else if (val.booleanValue !== undefined) data[key] = val.booleanValue;
        else if (val.timestampValue !== undefined) data[key] = val.timestampValue;
        else if (val.mapValue) data[key] = val.mapValue.fields; // Deep mapping skipped for brevity
        else if (val.arrayValue && val.arrayValue.values) {
          data[key] = val.arrayValue.values.map(v => v.stringValue || v.integerValue || v.booleanValue || "");
        }
      }
      return data;
    }
    return null;
  } catch (e) {
    console.error(`[Firestore REST] Error for ${collection}/${slug}:`, e.message);
    return null;
  }
}

// --- HELPER: OG IMAGE ENGINE ---
async function generateOgImage(title, description, image, category) {
  const cleanTitle = (title || 'Entrepreneurs BD').length > 80 ? (title || 'Entrepreneurs BD').substring(0, 77) + '...' : (title || 'Entrepreneurs BD');
  const cleanCategory = (category || 'Startup').toUpperCase();

  let backgroundBuffer;
  try {
    if (image && image.startsWith('http')) {
      const imgRes = await axios.get(image, { responseType: 'arraybuffer', timeout: 5000 });
      backgroundBuffer = await sharp(imgRes.data)
        .resize(1200, 630, { fit: 'cover' })
        .blur(10)
        .modulate({ brightness: 0.35 })
        .toBuffer();
    }
  } catch (e) { console.warn('[OG Engine] BG Fail:', e.message); }

  const svg = `
      <!-- Header Overlay -->
      <rect x="80" y="80" width="60" height="60" rx="12" fill="#ffffff" />
      <text x="110" y="122" font-family="sans-serif" font-size="36" font-weight="900" fill="#064e3b" text-anchor="middle">e</text>
      <text x="160" y="120" font-family="sans-serif" font-size="28" font-weight="700" fill="#ffffff">ENTREPRENEURS BD</text>
      
      <!-- Category Badge -->
      <rect x="940" y="80" width="180" height="50" rx="25" fill="#059669" opacity="0.9" />
      <text x="1030" y="114" font-family="sans-serif" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle">${cleanCategory}</text>
      
      <!-- Content Area (Manual Line Wrapping for Compatibility) -->
      ${(() => {
        const words = cleanTitle.split(' ');
        let lines = [];
        let currentLine = '';
        words.forEach(word => {
          if ((currentLine + word).length > 25) {
            lines.push(currentLine);
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        lines.push(currentLine);
        return lines.slice(0, 3).map((line, i) => 
          `<text x="80" y="${280 + (i * 85)}" font-family="sans-serif" font-size="72" font-weight="800" fill="#ffffff">${line.trim()}</text>`
        ).join('');
      })()}
      
      <!-- Accent Line -->
      <rect x="80" y="520" width="120" height="10" rx="5" fill="#10b981" />
      
      <!-- Footer Branding -->
      <text x="1120" y="570" font-family="sans-serif" font-size="24" font-weight="600" fill="#10b981" opacity="0.7" text-anchor="end">entrepreneurs.bd</text>
    </svg>
  `;

  try {
    return await sharp({
      create: { width: 1200, height: 630, channels: 4, background: '#064e3b' }
    }).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
  } catch (e) {
    console.error('[OG Engine] Sharp Crash:', e.message);
    throw e;
  }
}

module.exports = async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /bot|google|crawler|spider|facebook|whatsapp|linkedin|twitter|slack|discord|telegram|apple|bing|yandex|baiduspider|metainspector|structured-data|rich-results/i.test(userAgent);
  const host = req.headers.host || 'entrepreneurs.bd';
  
  console.log(`[SEO Engine] Req: ${req.url} | Bot: ${isBot}`);

  // --- 1. IMAGE RENDERING BRANCH (CRITICAL FIX) ---
  if (req.query.render === 'image') {
    const { title, description, image, category } = req.query;
    try {
      const buffer = await generateOgImage(title, description, image, category);
      res.setHeader('Content-Type', 'image/png');
      // "Ironclad" Caching: Cache for 1 year, but allow revalidation
      res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800');
      return res.status(200).send(buffer);
    } catch (e) {
      console.error('[OG Engine] Render Fail:', e.message);
      return res.status(500).send('Image Generation Failed');
    }
  }

  // --- 2. SITEMAP BRANCH ---
  if (req.query.action === 'sitemap-news') {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }

  // --- 3. PATH RESOLVER ---
  const pathParam = req.query.path || '';
  const finalPath = (pathParam === 'home' || !pathParam) ? '/' : (pathParam.startsWith('/') ? pathParam : `/${pathParam}`);
  const segments = finalPath.split('/').filter(Boolean);
  const type = (finalPath === '/' || segments.length === 0) ? 'home' : segments[0];
  const slug = segments.length > 1 ? segments[1] : null;

  // --- 4. HUMAN/BOT LOGIC ---
  // Senior Engineer Fix: Remove 301 redirect. 
  // We serve SEO tags to EVERYONE first to ensure 100% crawler hit rate.
  // Real humans will be instantly transitioned by the JS redirect in the shell.
  const escapedRedirectPath = `${finalPath}${finalPath.includes('?') ? '&' : '?'}no_bot=1`;

  try {
    let title = "Entrepreneurs BD | The National Engine of Growth";
    let description = "Developing 1 million entrepreneurs by 2030. Connect, discover, and scale your startup on Bangladesh's premier growth hub.";
    let image = `${SITE_URL}/og-default.png`;
    let docData = null;

    // --- DATA FETCHING (REST) ---
    if (type !== 'home' && slug) {
      const colMap = { 'blog': 'posts', 'directory': 'listings', 'entrepreneurs': 'profiles', 'knowledge': 'resources' };
      if (colMap[type]) {
        docData = await fetchFirestoreDoc(colMap[type], slug);
        if (docData) {
          // Priority Selection for Metadata
          title = docData.seoTitle || docData.seo_title || docData.title || docData.business_name || docData.name || title;
          
          const rawDesc = docData.metaDescription || docData.seo_description || docData.seoDescription || 
                         docData.excerpt || docData.short_description || docData.short_bio || 
                         docData.details || description;
          
          description = rawDesc.replace(/<[^>]*>/g, '').substring(0, 160);
          image = docData.featured_image || docData.logo || docData.photo || image;
        } else {
          console.warn(`[SEO Engine] No data found for slug: ${slug} in ${colMap[type]}`);
        }
      }
    }

    // --- CHARACTER ESCAPING (Prevent meta tag breakage) ---
    const esc = (str) => (str || '').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeTitle = esc(title);
    const safeDescription = esc(description);

    const currentAbsoluteUrl = `https://${host}${finalPath}`;
    const version = docData?.updated_at?.seconds || docData?.updated_at?._seconds || Date.now();
    const dynamicOgUrl = `${SITE_URL}/api/og-image?title=${encodeURIComponent(title.substring(0, 100))}&image=${encodeURIComponent(image)}&category=${encodeURIComponent(type)}&v=${version}`;

    // --- SCHEMAS ---
    const orgSchema = { 
      "@context": "https://schema.org", 
      "@type": "Organization", 
      "name": "Entrepreneurs BD", 
      "url": SITE_URL, 
      "logo": `${SITE_URL}/logo.png`, 
      "contactPoint": { "@type": "ContactPoint", "telephone": "+8801700000000", "contactType": "customer service" },
      "sameAs": ["https://www.facebook.com/entrepreneursbd.official/"] 
    };
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Entrepreneurs BD",
      "url": SITE_URL,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
    let mainSchema = { "@context": "https://schema.org", "@type": "WebPage", "headline": title, "description": description, "image": image, "url": currentAbsoluteUrl };
    
    if (type === 'blog' && slug) {
      mainSchema = { "@context": "https://schema.org", "@type": "BlogPosting", "headline": title, "description": description, "image": image, "datePublished": new Date().toISOString(), "publisher": orgSchema };
    }

    const metaTags = `
      <title>${safeTitle}</title>
      <meta name="description" content="${safeDescription}">
      <link rel="canonical" href="${currentAbsoluteUrl}">
      <meta property="og:site_name" content="Entrepreneurs BD">
      <meta property="og:type" content="${type === 'blog' ? 'article' : 'website'}">
      <meta property="og:title" content="${safeTitle}">
      <meta property="og:description" content="${safeDescription}">
      <meta property="og:image" content="${dynamicOgUrl}">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta property="og:image:type" content="image/png">
      <meta property="og:url" content="${currentAbsoluteUrl}">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:site" content="@entrepreneursbd">
      <meta name="twitter:title" content="${safeTitle}">
      <meta name="twitter:description" content="${safeDescription}">
      <meta name="twitter:image" content="${dynamicOgUrl}">
      <script type="application/ld+json">${JSON.stringify(orgSchema)}</script>
      <script type="application/ld+json">${JSON.stringify(websiteSchema)}</script>
      <script type="application/ld+json">${JSON.stringify(mainSchema)}</script>
      <link rel="icon" type="image/x-icon" href="/favicon.ico">
      <link rel="shortcut icon" href="/favicon.ico">
      <link rel="apple-touch-icon" sizes="180x180" href="/logo192.png">
      <!-- SEO Debug: Time=${new Date().toISOString()}, Type=${type}, Slug=${slug}, DataFound=${!!docData}, Engine=NUCLEAR-REST-v3 -->
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
    res.setHeader('X-SEO-Engine', 'NUCLEAR-REST-v2');
    return res.status(200).send(HTML_SHELL.replace('{{META_TAGS}}', metaTags).replace('{{REDIRECT_PATH}}', escapedRedirectPath));

  } catch (error) {
    console.error('[CRITICAL] SEO failure:', error.message);
    const sep = finalPath.includes('?') ? '&' : '?';
    const escapedRedirectPath = `${finalPath}${sep}no_bot=1`;
    return res.status(200).send(HTML_SHELL.replace('{{META_TAGS}}', '').replace('{{REDIRECT_PATH}}', escapedRedirectPath));
  }
};
