import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'entrepreneurbdlive'; 
const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
const SITE_URL = 'https://entrepreneurs.bd';

// --- HELPER: FIRESTORE REST ---
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
    
    const res = await fetch(`${url}?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify(query),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) return null;
    const results = await res.json();
    if (!results || !results[0] || !results[0].document) return null;
    
    const doc = results[0].document;
    const fields = doc.fields;
    const data = {};
    
    for (const key in fields) {
      const val = fields[key];
      if (val.stringValue !== undefined) data[key] = val.stringValue;
      else if (val.integerValue !== undefined) data[key] = parseInt(val.integerValue);
      else if (val.doubleValue !== undefined) data[key] = parseFloat(val.doubleValue);
      else if (val.booleanValue !== undefined) data[key] = val.booleanValue;
      else if (val.timestampValue !== undefined) data[key] = val.timestampValue;
      else if (val.mapValue && val.mapValue.fields) {
        const subData = {};
        for (const k in val.mapValue.fields) {
          subData[k] = val.mapValue.fields[k].stringValue || val.mapValue.fields[k].integerValue || "";
        }
        data[key] = subData;
      }
      else if (val.arrayValue && val.arrayValue.values) {
        data[key] = val.arrayValue.values.map(v => v.stringValue || v.integerValue || v.booleanValue || "");
      }
    }
    return data;
  } catch (e) { return null; }
}

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

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const host = req.headers.get('host') || 'entrepreneurs.bd';
  
  // --- 1. IMAGE RENDERING (THE "BRANDED CARD" LOOK) ---
  if (searchParams.get('render') === 'image') {
    const title = searchParams.get('title') || 'Entrepreneurs BD';
    const description = searchParams.get('description') || '';
    const category = (searchParams.get('category') || 'Startup').toUpperCase();
    const image = searchParams.get('image');

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#064e3b', backgroundImage: image ? `linear-gradient(rgba(6, 78, 59, 0.85), rgba(6, 78, 59, 0.92)), url(${image})` : 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
          
          {/* Decorative circles (no filter — Satori doesn't support it) */}
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '150px', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '150px', background: 'rgba(16,185,129,0.08)' }} />

          {/* Header — matches BrandedPlaceholder */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', width: '45px', height: '45px', backgroundColor: '#ecfdf5', borderRadius: '10px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#064e3b', fontSize: '26px', fontWeight: 900 }}>e</span>
              </div>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#ecfdf5', letterSpacing: '3px' }}>ENTREPRENEURS BD</span>
            </div>
            <div style={{ display: 'flex', backgroundColor: '#065f46', padding: '8px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', color: '#ecfdf5', fontSize: '18px', fontWeight: 700 }}>{category}</div>
          </div>

          {/* Title — large, bold, white (like BrandedPlaceholder h3) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: 'auto' }}>
            <div style={{ fontSize: title.length > 60 ? '48px' : title.length > 40 ? '56px' : '68px', fontWeight: 700, color: 'white', lineHeight: 1.15 }}>{title}</div>
            <div style={{ width: '80px', height: '6px', backgroundColor: '#10b981', borderRadius: '3px', opacity: 0.5 }} />
          </div>

          {/* Footer watermark — matches BrandedPlaceholder */}
          <div style={{ position: 'absolute', bottom: '25px', right: '40px', fontSize: '16px', color: 'white', opacity: 0.2, fontStyle: 'italic' }}>entrepreneurs.bd</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // --- 2. SEO HTML RENDERING ---
  const pathParam = searchParams.get('path') || '';
  const finalPath = (pathParam === 'home' || !pathParam) ? '/' : (pathParam.startsWith('/') ? pathParam : `/${pathParam}`);
  const segments = finalPath.split('/').filter(Boolean);
  const type = (finalPath === '/' || segments.length === 0) ? 'home' : segments[0];
  const slug = segments.length > 1 ? segments[1] : null;

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
    const dynamicOgUrl = `${SITE_URL}/api/og-image?title=${encodeURIComponent(title.substring(0, 100))}&description=${encodeURIComponent(description.substring(0, 160))}&image=${encodeURIComponent(image)}&category=${encodeURIComponent(type)}`;

    // --- RESTORED SCHEMAS ---
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
      <!-- SEO Debug: Time=${new Date().toISOString()}, Type=${type}, Slug=${slug}, DataFound=${!!docData}, Engine=EDGE-v1 -->
    `;

    const redirectPath = `${finalPath}${finalPath.includes('?') ? '&' : '?'}no_bot=1`;
    const body = HTML_SHELL.replace('{{META_TAGS}}', metaTags).replace('{{REDIRECT_PATH}}', redirectPath);

    return new Response(body, { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200' } });
  } catch (e) {
    const fallbackRedirect = `${finalPath}${finalPath.includes('?') ? '&' : '?'}no_bot=1`;
    return new Response(HTML_SHELL.replace('{{META_TAGS}}', '').replace('{{REDIRECT_PATH}}', fallbackRedirect), { headers: { 'Content-Type': 'text/html' } });
  }
}
