const { initializeApp, getApp, getApps } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit, doc, updateDoc, increment } = require('firebase/firestore');
const sharp = require('sharp');
const axios = require('axios');

// --- FIREBASE INIT ---
// Using REACT_APP prefix as confirmed by Vercel Environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// --- IRONCLAD MASTER HTML SHELL ---
const HTML_SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#34d399">
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
  } catch (e) {
    console.warn('[OG Engine] Background image fetch fail:', e.message);
  }

  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#064e3b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#022c22;stop-opacity:1" />
        </linearGradient>
        <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#ffffff" fill-opacity="0.05" />
        </pattern>
      </defs>
      ${!backgroundBuffer ? `<rect width="1200" height="630" fill="url(#bgGrad)" />` : ''}
      <rect width="1200" height="630" fill="url(#pattern)" />
      <rect x="30" y="30" width="1140" height="570" fill="none" stroke="#34d399" stroke-width="4" rx="15" stroke-opacity="0.2" />
      <text x="80" y="100" font-family="sans-serif" font-size="28" font-weight="900" fill="#34d399" letter-spacing="3">ENTREPRENEURS BD</text>
      <rect x="80" y="140" width="${cleanCategory.length * 15 + 40}" height="40" rx="20" fill="#059669" />
      <text x="${80 + (cleanCategory.length * 15 + 40) / 2}" y="166" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${cleanCategory}</text>
      <foreignObject x="80" y="210" width="1040" height="280">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: sans-serif; font-size: 68px; font-weight: 800; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
          ${cleanTitle}
        </div>
      </foreignObject>
      <foreignObject x="80" y="480" width="900" height="100">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: #d1d5db; font-family: sans-serif; font-size: 26px; font-weight: 400; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
          ${cleanDesc}
        </div>
      </foreignObject>
      <text x="80" y="585" font-family="sans-serif" font-size="24" font-weight="bold" fill="#059669" opacity="0.8">entrepreneurs.bd</text>
    </svg>
  `;

  let finalImage = sharp(backgroundBuffer || {
    create: { width: 1200, height: 630, channels: 4, background: { r: 6, g: 78, b: 59 } }
  });

  return await finalImage
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

module.exports = async (req, res) => {
  const host = req.headers.host || 'entrepreneurs.bd';
  const isImageRequest = req.query.render === 'image';

  // --- MASTER PATH RESOLVER ---
  const pathParam = req.query.path || '';
  const finalPath = (pathParam === 'home' || !pathParam) ? '/' : (pathParam.startsWith('/') ? pathParam : `/${pathParam}`);
  const segments = finalPath.split('/').filter(Boolean);
  
  const type = (finalPath === '/' || segments.length === 0) ? 'home' : segments[0];
  const slug = segments.length > 1 ? segments[1] : null;

  try {
    // --- 1. REDIRECT ENGINE ---
    const searchPath = finalPath.replace(/\/$/, '') || '/';
    const redirectQuery = query(collection(db, 'redirects'), where('fromPath', '==', searchPath), limit(1));
    const redirectSnap = await getDocs(redirectQuery);
    
    if (!redirectSnap.empty) {
      const redirectData = redirectSnap.docs[0].data();
      updateDoc(doc(db, 'redirects', redirectSnap.docs[0].id), { hit_count: increment(1), last_hit: new Date() }).catch(() => {});
      res.setHeader('Location', redirectData.toPath);
      return res.status(301).end();
    }

    const { action } = req.query;
    const SITE_URL = 'https://entrepreneurs.bd';

    // --- 2. DYNAMIC SITEMAP ENGINE ---
    if (action === 'sitemap' || action === 'sitemap-news' || finalPath === '/sitemap.xml' || finalPath === '/sitemap-news.xml') {
      const isNews = action === 'sitemap-news' || finalPath === '/sitemap-news.xml';
      const lastmod = new Date().toISOString().split('T')[0];
      let routes = !isNews ? [
        { url: '/', priority: 1.0, changefreq: 'weekly' },
        { url: '/blog', priority: 0.9, changefreq: 'daily' },
        { url: '/entrepreneurs', priority: 0.9, changefreq: 'daily' },
        { url: '/directory', priority: 0.9, changefreq: 'daily' }
      ] : [];

      const collections = [
        { name: 'posts', path: '/blog/', priority: 0.8 },
        { name: 'profiles', path: '/entrepreneurs/', priority: 0.7 },
        { name: 'listings', path: '/directory/', priority: 0.7 }
      ];

      for (const col of collections) {
        let q = query(collection(db, col.name), where('status', '==', 'published'));
        if (isNews && col.name === 'posts') {
          q = query(q, where('created_at', '>=', new Date(Date.now() - 48 * 60 * 60 * 1000)));
        }
        const snap = await getDocs(q);
        snap.forEach(d => {
          const data = d.data();
          routes.push({
            url: `${col.path}${data.slug || d.id}`,
            priority: col.priority,
            title: data.title || data.business_name || data.name,
            image: data.featured_image || data.logo || data.photo,
            created_at: data.created_at?.toDate?.() || new Date()
          });
        });
      }

      let xml = isNews ? `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
        ${routes.map(r => `<url><loc>${SITE_URL}${r.url}</loc><news:news><news:publication><news:name>Entrepreneurs BD</news:name><news:language>en</news:language></news:publication>
        <news:publication_date>${r.created_at.toISOString()}</news:publication_date><news:title>${(r.title || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]))}</news:title></news:news></url>`).join('')}</urlset>`
      : `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
        ${routes.map(r => `<url><loc>${SITE_URL}${r.url}</loc><lastmod>${lastmod}</lastmod><priority>${r.priority}</priority>${r.image ? `<image:image><image:loc>${r.image}</image:loc></image:image>` : ''}</url>`).join('')}</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(xml);
    }

    // --- 3. DYNAMIC CONTENT ENGINE ---
    let title = "Entrepreneurs BD | The National Engine of Growth";
    let description = "Developing 1 million entrepreneurs by 2030. Connect, discover, and scale your startup on Bangladesh's premier growth hub.";
    let image = `${SITE_URL}/og-default.png`;
    let docData = null;
    let authorData = null;

    const hubTitles = {
      'blog': 'Insights: Startup Stories & Business Wisdom',
      'directory': 'Business Directory: Discover Bangladesh\'s Startups',
      'entrepreneurs': 'Founder Profiles: The Pioneers of Bangladesh',
      'knowledge': 'Knowledge Base: Master the Startup Ecosystem'
    };

    if (type !== 'home' && slug) {
      const colMap = { 'blog': 'posts', 'directory': 'listings', 'entrepreneurs': 'profiles', 'knowledge': 'resources' };
      const colName = colMap[type];
      if (colName) {
        const snap = await getDocs(query(collection(db, colName), where('slug', '==', slug), limit(1)));
        if (!snap.empty) {
          docData = snap.docs[0].data();
          title = docData.title || docData.business_name || docData.name || title;
          description = (docData.excerpt || docData.seo_description || docData.short_description || docData.short_bio || description).replace(/<[^>]*>/g, '').substring(0, 160);
          image = docData.featured_image || docData.logo || docData.photo || image;
          if (docData.authorId) {
            const aSnap = await getDocs(query(collection(db, 'authors'), where('id', '==', docData.authorId), limit(1)));
            if (!aSnap.empty) authorData = aSnap.docs[0].data();
          }
        }
      }
    } else if (hubTitles[type]) {
      title = hubTitles[type];
      description = `Discover the ${type} hub on Entrepreneurs BD. The National Engine of Growth.`;
    }

    // --- 4. RENDERER SWITCHER ---
    let category = "Insights";
    if (type === 'home') category = "Ecosystem Hub";
    else if (type === 'entrepreneurs') category = "Founder Profile";
    else if (type === 'directory') category = "Business Directory";
    else if (type === 'knowledge') category = "Knowledge Hub";

    // MODE: OG Image
    if (isImageRequest) {
      const buffer = await generateOgImage(req.query.title || title, req.query.description || description, req.query.image || image, req.query.category || category);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).send(buffer);
    }

    // MODE: HTML Pre-render (Bots)
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|googlebot|crawler|spider|facebookexternalhit|whatsapp|linkedinbot|twitterbot|slackbot|discordbot|telegrambot|applebot|bingbot|yandexbot|baiduspider|metainspector/i.test(userAgent);

    // HUMAN HANDOFF (Dancing Routing):
    if (!isBot && !req.query.force_bot) {
      const sep = finalPath.includes('?') ? '&' : '?';
      res.setHeader('Location', `${finalPath}${sep}no_bot=1`);
      return res.status(301).end();
    }

    const currentAbsoluteUrl = `https://${host}${finalPath}`;
    const dynamicOgUrl = `${SITE_URL}/api/og-image?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(image)}&category=${category}`;

    // Schemas
    const orgSchema = { "@context": "https://schema.org", "@type": "Organization", "name": "Entrepreneurs BD", "url": SITE_URL, "logo": `${SITE_URL}/logo.png`, "foundingDate": "2024", "sameAs": ["https://www.facebook.com/entrepreneursbd.official/"] };
    const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": segments.map((s, i) => ({ "@type": "ListItem", "position": i + 1, "name": (i === segments.length - 1) ? title : s, "item": `${SITE_URL}/${segments.slice(0, i + 1).join('/')}` })) };
    
    // Default Schema
    let mainSchema = { "@context": "https://schema.org", "@type": "WebPage", "headline": title, "description": description, "image": image, "url": currentAbsoluteUrl };
    
    // Blog Specific Schema
    if (type === 'blog' && slug) {
      mainSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": description,
        "image": image,
        "url": currentAbsoluteUrl,
        "author": { "@type": "Person", "name": authorData?.name || "Entrepreneurs BD Staff" },
        "publisher": orgSchema,
        "datePublished": docData?.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    } else if (type === 'entrepreneurs' && slug) {
       mainSchema = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": { "@type": "Person", "name": docData?.name, "image": docData?.photo, "jobTitle": docData?.role_title }
      };
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
      <meta property="og:site_name" content="Entrepreneurs BD">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${description}">
      <meta name="twitter:image" content="${dynamicOgUrl}">
      <script type="application/ld+json">${JSON.stringify(orgSchema)}</script>
      <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
      <script type="application/ld+json">${JSON.stringify(mainSchema)}</script>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(HTML_SHELL.replace('{{META_TAGS}}', metaTags).replace('{{REDIRECT_PATH}}', finalPath));

  } catch (error) {
    console.error('[CRITICAL] SEO Engine failure:', error.message);
    return res.status(200).send(HTML_SHELL.replace('{{META_TAGS}}', '').replace('{{REDIRECT_PATH}}', finalPath));
  }
};
