const sharp = require('sharp');
const axios = require('axios');

// --- CONFIG ---
const PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
const SITE_URL = 'https://entrepreneurs.bd';
const FONT_URL = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf';

// --- FONT CACHE ---
let fontBuffer = null;
async function getFont() {
  if (fontBuffer) return fontBuffer;
  try {
    const res = await axios.get(FONT_URL, { responseType: 'arraybuffer', timeout: 3000 });
    fontBuffer = Buffer.from(res.data);
    return fontBuffer;
  } catch (e) { return null; }
}

// --- HTML SHELL ---
const HTML_SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#064e3b" />
    {{META_TAGS}}
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
</body>
</html>`;

// --- FIRESTORE REST ---
async function fetchFirestoreDoc(collection, slug) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    const query = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } },
        limit: 1
      }
    };
    const res = await axios.post(`${url}?key=${API_KEY}`, query, { timeout: 8000 });
    if (res.data && res.data[0] && res.data[0].document) {
      const fields = res.data[0].document.fields;
      const data = {};
      for (const key in fields) {
        const val = fields[key];
        if (val.stringValue !== undefined) data[key] = val.stringValue;
        else if (val.integerValue !== undefined) data[key] = parseInt(val.integerValue);
        else if (val.doubleValue !== undefined) data[key] = parseFloat(val.doubleValue);
        else if (val.booleanValue !== undefined) data[key] = val.booleanValue;
        else if (val.timestampValue !== undefined) data[key] = val.timestampValue;
        else if (val.mapValue && val.mapValue.fields) data[key] = val.mapValue.fields;
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

// --- OG IMAGE ENGINE (Pango text with downloaded font) ---
async function generateOgImage(title, description, image, category) {
  const clean = (s) => (s || '').replace(/[^\x20-\x7E\u0980-\u09FF]/g, '').trim();
  const pEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanTitle = pEsc(clean(title) || 'Entrepreneurs BD');
  const cleanCat = pEsc(clean(category) || 'STARTUP').toUpperCase();

  const font = await getFont();
  const fontFile = font ? '/tmp/_og_font.ttf' : undefined;
  if (font) {
    const fs = require('fs');
    try { fs.writeFileSync('/tmp/_og_font.ttf', font); } catch (e) {}
  }

  // Background
  let bg = sharp({ create: { width: 1200, height: 630, channels: 4, background: '#064e3b' } }).png();
  let layers = [];

  // Blurred featured image overlay (skip default placeholder to save time)
  try {
    if (image && image.startsWith('http') && !image.includes('og-default') && !image.includes('logo')) {
      const imgRes = await axios.get(image, { responseType: 'arraybuffer', timeout: 2000 });
      const blurred = await sharp(imgRes.data).resize(1200, 630, { fit: 'cover' }).blur(25).modulate({ brightness: 0.3 }).png().toBuffer();
      layers.push({ input: blurred, top: 0, left: 0 });
    }
  } catch (e) {}

  // Title text via Pango
  const titleOpts = { text: { text: `<span foreground="white" font_weight="bold">${cleanTitle}</span>`, font: 'Noto Sans', rgba: true, width: 1040, height: 300 } };
  if (fontFile) titleOpts.text.fontfile = fontFile;
  try {
    const titleBuf = await sharp(titleOpts).png().toBuffer();
    layers.push({ input: titleBuf, top: 220, left: 80 });
  } catch (e) {}

  // Brand name via Pango
  const brandOpts = { text: { text: `<span foreground="white" font_weight="bold" font_size="22pt">ENTREPRENEURS BD</span>`, font: 'Noto Sans', rgba: true } };
  if (fontFile) brandOpts.text.fontfile = fontFile;
  try {
    const brandBuf = await sharp(brandOpts).png().toBuffer();
    layers.push({ input: brandBuf, top: 90, left: 155 });
  } catch (e) {}

  // Logo box (white rounded rect with "e")
  const logoSvg = Buffer.from(`<svg width="50" height="50"><rect width="50" height="50" rx="10" fill="#ecfdf5"/><text x="25" y="36" text-anchor="middle" font-size="30" font-weight="900" fill="#064e3b">e</text></svg>`);
  layers.push({ input: logoSvg, top: 78, left: 80 });

  // Category badge: render text first to measure, then badge background, then text on top
  let catBuf = null;
  const catOpts = { text: { text: `<span foreground="white" font_weight="bold" font_size="16pt">${cleanCat}</span>`, font: 'Noto Sans', rgba: true } };
  if (fontFile) catOpts.text.fontfile = fontFile;
  try { catBuf = await sharp(catOpts).png().toBuffer(); } catch (e) {}

  const catMeta = catBuf ? await sharp(catBuf).metadata() : null;
  const badgeW = catMeta ? catMeta.width + 40 : 160;
  const badgeSvg = Buffer.from(`<svg width="${badgeW}" height="40"><rect width="${badgeW}" height="40" rx="8" fill="#065f46" stroke="rgba(255,255,255,0.15)" stroke-width="1"/></svg>`);
  layers.push({ input: badgeSvg, top: 80, left: 1120 - badgeW });
  if (catBuf && catMeta) {
    const catX = 1120 - badgeW + Math.round((badgeW - catMeta.width) / 2);
    layers.push({ input: catBuf, top: 92, left: catX });
  }

  // Green accent bar
  const barSvg = Buffer.from(`<svg width="80" height="6"><rect width="80" height="6" rx="3" fill="#10b981" opacity="0.5"/></svg>`);
  layers.push({ input: barSvg, top: 540, left: 80 });

  // Footer watermark
  const footOpts = { text: { text: `<span foreground="white" font_size="12pt" font_style="italic">entrepreneurs.bd</span>`, font: 'Noto Sans', rgba: true } };
  if (fontFile) footOpts.text.fontfile = fontFile;
  try {
    const footBuf = await sharp(footOpts).png().toBuffer();
    // Make it semi-transparent
    const footFinal = await sharp(footBuf).ensureAlpha().composite([{
      input: Buffer.from([0, 0, 0, 50]),
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: 'dest-in'
    }]).png().toBuffer();
    layers.push({ input: footFinal, top: 580, left: 1020 });
  } catch (e) {}

  return await bg.toBuffer().then(base => sharp(base).composite(layers).png().toBuffer());
}

// --- MAIN HANDLER ---
module.exports = async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const host = req.headers.host || 'entrepreneurs.bd';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const SITE_URL_DYN = `${protocol}://${host}`;
  const isBot = /bot|google|crawler|spider|facebook|whatsapp|linkedin|twitter|slack|discord|telegram|apple|bing|yandex|baiduspider|metainspector|structured-data|rich-results/i.test(userAgent);

  // --- 1. IMAGE RENDERING ---
  if (req.query.render === 'image') {
    const { title, description, image, category } = req.query;
    try {
      const buffer = await generateOgImage(title, description, image, category);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(buffer);
    } catch (e) {
      console.error('[OG Engine] Render Fail:', e.message);
      try {
        const fallback = await generateOgImage(title, description, null, category);
        res.setHeader('Content-Type', 'image/png');
        return res.status(200).send(fallback);
      } catch (err) {
        return res.status(500).send('Image generation failed');
      }
    }
  }

  // --- 2. SITEMAP ---
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
  const escapedRedirectPath = `${finalPath}${finalPath.includes('?') ? '&' : '?'}no_bot=1`;

  try {
    let title = "Entrepreneurs BD | The National Engine of Growth";
    let description = "Developing 1 million entrepreneurs by 2030. Connect, discover, and scale your startup on Bangladesh's premier growth hub.";
    let image = `${SITE_URL}/og-default.png`;
    let docData = null;

    if (type !== 'home' && slug) {
      const colMap = { 'blog': 'posts', 'directory': 'listings', 'entrepreneurs': 'profiles', 'knowledge': 'resources' };
      if (colMap[type]) {
        docData = await fetchFirestoreDoc(colMap[type], slug);
        if (docData) {
          title = docData.seoTitle || docData.seo_title || docData.title || docData.business_name || docData.name || title;
          const rawDesc = docData.metaDescription || docData.seo_description || docData.seoDescription || docData.excerpt || docData.short_description || docData.short_bio || docData.details || description;
          description = rawDesc.replace(/<[^>]*>/g, '').substring(0, 160);
          image = docData.featured_image || docData.logo || docData.photo || image;
        }
      }
    }

    const esc = (str) => (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, ' ');
    const safeTitle = esc(title);
    const safeDescription = esc(description);
    const currentAbsoluteUrl = `https://${host}${finalPath}`;
    const dynamicOgUrl = `${SITE_URL}/api/og-image?title=${encodeURIComponent(title.substring(0, 100))}&amp;description=${encodeURIComponent(description.substring(0, 160))}&amp;image=${encodeURIComponent(image)}&amp;category=${encodeURIComponent(type)}`;

    const orgSchema = { 
      "@context": "https://schema.org", "@type": "Organization", "name": "Entrepreneurs BD", 
      "url": SITE_URL, "logo": `${SITE_URL}/logo.png`, 
      "contactPoint": { "@type": "ContactPoint", "telephone": "+8801700000000", "contactType": "customer service" },
      "sameAs": ["https://www.facebook.com/entrepreneursbd.official/"] 
    };
    const websiteSchema = {
      "@context": "https://schema.org", "@type": "WebSite", "name": "Entrepreneurs BD", "url": SITE_URL,
      "potentialAction": { "@type": "SearchAction", "target": `${SITE_URL}/search?q={search_term_string}`, "query-input": "required name=search_term_string" }
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
      <!-- SEO Debug: Time=${new Date().toISOString()}, Type=${type}, Slug=${slug}, DataFound=${!!docData}, Engine=PANGO-v1 -->
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
    res.setHeader('X-SEO-Engine', 'PANGO-v1');
    return res.status(200).send(HTML_SHELL.replace('{{META_TAGS}}', metaTags).replace('{{REDIRECT_PATH}}', escapedRedirectPath));

  } catch (error) {
    console.error('[CRITICAL] SEO failure:', error.message);
    const sep = finalPath.includes('?') ? '&' : '?';
    const fallbackPath = `${finalPath}${sep}no_bot=1`;
    return res.status(200).send(HTML_SHELL.replace('{{META_TAGS}}', '').replace('{{REDIRECT_PATH}}', fallbackPath));
  }
};
