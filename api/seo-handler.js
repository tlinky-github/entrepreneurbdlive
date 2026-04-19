const { initializeApp, getApp, getApps } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit, doc, updateDoc, increment } = require('firebase/firestore');
const sharp = require('sharp');
const axios = require('axios');

// --- FIREBASE INIT ---
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// --- HELPER: OG IMAGE ENGINE ---
async function generateOgImage(title, description, image, category) {
  const cleanTitle = (title || 'Entrepreneurs BD').length > 70 ? (title || 'Entrepreneurs BD').substring(0, 67) + '...' : (title || 'Entrepreneurs BD');
  const cleanDesc = (description || '').replace(/<[^>]*>/g, '').substring(0, 100);
  const cleanCategory = (category || 'Insights').toUpperCase();

  let backgroundBuffer;
  try {
    if (image && image.startsWith('http')) {
      const imgRes = await axios.get(image, { responseType: 'arraybuffer' });
      backgroundBuffer = await sharp(imgRes.data)
        .resize(1200, 630, { fit: 'cover' })
        .blur(5)
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
      <rect x="80" y="140" width="${cleanCategory.length * 14 + 30}" height="36" rx="18" fill="#059669" />
      <text x="${80 + (cleanCategory.length * 14 + 30) / 2}" y="164" font-family="sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">${cleanCategory}</text>
      <foreignObject x="80" y="220" width="1040" height="280">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: sans-serif; font-size: 72px; font-weight: 800; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
          ${cleanTitle}
        </div>
      </foreignObject>
      <foreignObject x="80" y="480" width="900" height="80">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: #d1d5db; font-family: sans-serif; font-size: 28px; font-weight: 400; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${cleanDesc}
        </div>
      </foreignObject>
      <text x="80" y="580" font-family="sans-serif" font-size="22" font-weight="bold" fill="#059669" opacity="0.8">entrepreneurs.bd</text>
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
  const url = `https://${host}${req.url.split('?')[0]}`;
  const segments = req.url.split('?')[0].split('/').filter(Boolean);
  
  const type = segments[0] || 'home'; 
  const slug = segments[1];

  // Logic switcher: OG Image Render or HTML Render
  const isImageRequest = req.query.render === 'image';

  // --- SENIOR RESILIENCE: Pre-load base HTML in case of DB failure ---
  let baseHtml = '<html><body>Redirecting...</body></html>';
  try {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const indexRes = await fetch(`${protocol}://${host}/index.html`);
    baseHtml = await indexRes.text();
  } catch (e) {
    console.error('[SEO Fallback] Could not fetch base HTML:', e.message);
  }

  try {
    // --- 1. REDIRECT ENGINE (Highest Priority) ---
    const path = req.url.split('?')[0];
    const redirectQuery = query(collection(db, 'redirects'), where('fromPath', '==', path.replace(/\/$/, '') || '/'), limit(1));
    const redirectSnap = await getDocs(redirectQuery);
    
    if (!redirectSnap.empty) {
      const redirectData = redirectSnap.docs[0].data();
      const targetUrl = redirectData.toPath;
      updateDoc(doc(db, 'redirects', redirectSnap.docs[0].id), { hit_count: increment(1), last_hit: new Date() }).catch(() => {});
      res.setHeader('Location', targetUrl);
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(301).end();
    }

    // --- 2. DYNAMIC SITEMAP ENGINE ---
    const { action } = req.query;
    const isNewsSitemap = action === 'sitemap-news' || path === '/sitemap-news.xml';
    const isStandardSitemap = action === 'sitemap' || path === '/sitemap.xml';

    if (isStandardSitemap || isNewsSitemap) {
      const SITE_URL = 'https://entrepreneurs.bd';
      const lastmod = new Date().toISOString().split('T')[0];
      let routes = isStandardSitemap ? [
        { url: '/', priority: 1.0, changefreq: 'weekly' },
        { url: '/blog', priority: 0.9, changefreq: 'daily' },
        { url: '/entrepreneurs', priority: 0.9, changefreq: 'daily' },
        { url: '/directory', priority: 0.9, changefreq: 'daily' },
        { url: '/knowledge', priority: 0.8, changefreq: 'weekly' }
      ] : [];

      const collections = [
        { name: 'posts', path: '/blog/', priority: 0.8 },
        { name: 'profiles', path: '/entrepreneurs/', priority: 0.7 },
        { name: 'listings', path: '/directory/', priority: 0.7 },
        { name: 'resources', path: '/knowledge/', priority: 0.7 }
      ];

      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      for (const col of collections) {
        let q = query(collection(db, col.name), where('status', '==', 'published'));
        if (isNewsSitemap) {
          if (col.name !== 'posts') continue;
          q = query(q, where('created_at', '>=', fortyEightHoursAgo));
        }

        const snap = await getDocs(q);
        snap.forEach(doc => {
          const data = doc.data();
          routes.push({
            url: `${col.path}${data.slug || doc.id}`,
            priority: col.priority,
            changefreq: 'weekly',
            title: data.title || data.business_name || data.name,
            image: data.featured_image || data.logo || data.photo,
            created_at: data.created_at?.toDate?.() || new Date()
          });
        });
      }

      let xml = isNewsSitemap ? `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${routes.map(r => `  <url>
    <loc>${SITE_URL}${r.url}</loc>
    <news:news>
      <news:publication><news:name>Entrepreneurs BD</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${r.created_at.toISOString()}</news:publication_date>
      <news:title>${(r.title || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]))}</news:title>
    </news:news>
  </url>`).join('\n')}
</urlset>` : `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${routes.map(r => `  <url>
    <loc>${SITE_URL}${r.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
    ${r.image ? `<image:image><image:loc>${r.image}</image:loc></image:image>` : ''}
  </url>`).join('\n')}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(200).send(xml);
    }

    // --- 3. DATA FETCHING FOR MODE SWITCHER ---
    let title = "Entrepreneurs BD | The National Engine of Growth";
    let description = "Developing 1 million entrepreneurs by 2030. Connect, discover, and scale your startup on Bangladesh's premier growth engine.";
    let image = "https://entrepreneurs.bd/og-default.png";
    let docData = null;
    let authorData = null;

    // --- SMART HUB TITLING ---
    const hubTitles = {
      'blog': 'Insights: Startup Stories & Business Wisdom',
      'directory': 'Business Directory: Discover Bangladesh\'s Startups',
      'entrepreneurs': 'Founder Profiles: The Pioneers of Bangladesh',
      'knowledge': 'Knowledge Base: Master the Startup Ecosystem'
    };

    if (type && slug) {
      const collectionName = type === 'blog' ? 'posts' : type === 'directory' ? 'listings' : type === 'entrepreneurs' ? 'profiles' : type === 'knowledge' ? 'resources' : null;
      if (collectionName) {
        const snapshot = await getDocs(query(collection(db, collectionName), where('slug', '==', slug), limit(1)));
        if (!snapshot.empty) {
          docData = snapshot.docs[0].data();
          if (type === 'blog' || type === 'knowledge') {
            title = docData.title || title;
            description = docData.excerpt || docData.seo_description || description;
            image = docData.featured_image || image;
            if (docData.authorId) {
              const authorSnap = await getDocs(query(collection(db, 'authors'), where('id', '==', docData.authorId), limit(1)));
              if (!authorSnap.empty) authorData = authorSnap.docs[0].data();
            }
          } else if (type === 'directory') {
            title = docData.business_name || title;
            description = docData.short_description || docData.description || description;
            image = docData.logo || docData.featured_image || image;
          } else if (type === 'entrepreneurs') {
            title = docData.name || title;
            description = docData.short_bio || docData.details || description;
            image = docData.photo || docData.featured_image || image;
          }
        }
      }
    } else if (!slug && hubTitles[type]) {
      // It's a Hub Index (e.g. /blog)
      title = hubTitles[type];
      description = `Discover the comprehensive ${type} at Entrepreneurs BD. The National Engine of Growth.`;
    }

    // --- SMART CATEGORY LOGIC ---
    let category = "Insights";
    if (type === 'home' || segments.length === 0) category = "Ecosystem Hub";
    else if (type === 'entrepreneurs') category = "Founder Profile";
    else if (type === 'directory') category = "Business Directory";
    else if (type === 'knowledge') category = "Knowledge Hub";

    // --- MODE: IMAGE RENDERER ---
    if (isImageRequest) {
      const imageBuffer = await generateOgImage(
        req.query.title || title,
        req.query.description || description,
        req.query.image || image,
        req.query.category || category
      );
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).send(imageBuffer);
    }

    // --- MODE: HTML RENDERER (BOTS) ---
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|facebookexternalhit|whatsapp|google-marketing-platform|twitterbot|messenger|slackbot|linkedinbot|embedly|quora link preview|outbrain|pinterest\/0\.|bingbot|msnbot|bingpreview|googlebot|adsbot-google|twitterbot|baiduspider|yandexbot|metainspector/i.test(userAgent);

    if (!isBot && !req.query.force_bot) {
      return res.status(200).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${path}"></head><body>Redirecting...</body></html>`);
    }

    description = (description || '').replace(/<[^>]*>/g, '').substring(0, 160);
    const ogImageUrl = `https://entrepreneurs.bd/api/og-image?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(image)}&category=${category}`;
    const siteUrl = 'https://entrepreneurs.bd';

    // --- ELITE SCHEMA: Organization Expansion (E-E-A-T) ---
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Entrepreneurs BD",
      "alternateName": "Entrepreneurs Bangladesh",
      "url": siteUrl,
      "logo": `${siteUrl}/logo.png`,
      "foundingDate": "2024",
      "knowsAbout": ["Startup Ecosystem", "Entrepreneurship", "Bangladesh Business", "Venture Capital"],
      "sameAs": ["https://www.facebook.com/entrepreneursbd.official/","https://www.linkedin.com/company/entrepreneursbd/"],
      "contactPoint": { "@type": "ContactPoint", "email": "hello@entrepreneurs.bd", "contactType": "customer support" }
    };

    const breadcrumbMap = {
      "blog": "Insights",
      "directory": "Business Directory",
      "entrepreneurs": "Entrepreneurs",
      "knowledge": "Knowledge Base"
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": segments.map((seg, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": (i === segments.length - 1) ? title : (breadcrumbMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)),
        "item": `${siteUrl}/${segments.slice(0, i + 1).join('/')}`
      }))
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Entrepreneurs BD",
      "url": siteUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/blog?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    // --- ELITE SCHEMA: CollectionPage for Hubs ---
    let mainSchema;
    if (!slug && type !== 'home') {
      mainSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": title,
        "description": description,
        "url": url,
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": 10,
          "itemListOrder": "https://schema.org/ItemListOrderDescending"
        }
      };
    } else {
      mainSchema = { "@context": "https://schema.org", "@type": "WebPage", "headline": title, "description": description, "image": image, "url": url };
    }
    
    // Type-Specific Schemas
    let publishedTime = docData?.created_at?.toDate?.()?.toISOString() || new Date().toISOString();
    let modifiedTime = docData?.updated_at?.toDate?.()?.toISOString() || new Date().toISOString();

    if (type === 'blog' || type === 'knowledge') {
      mainSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "image": image,
        "author": { "@type": "Person", "name": authorData?.name || docData?.author_name || "Entrepreneurs BD Staff" },
        "publisher": orgSchema,
        "datePublished": publishedTime,
        "dateModified": modifiedTime,
        "mainEntityOfPage": { "@type": "WebPage", "@id": url }
      };
    } else if (type === 'entrepreneurs') {
      mainSchema = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": {
          "@type": "Person",
          "name": docData?.name,
          "description": docData?.short_bio || docData?.details,
          "image": docData?.photo || docData?.featured_image,
          "jobTitle": docData?.designation || docData?.role_title,
          "worksFor": { "@type": "Organization", "name": docData?.company_name || docData?.business_name },
          "sameAs": [docData?.linkedin, docData?.twitter, docData?.facebook].filter(Boolean)
        }
      };
    } else if (type === 'directory') {
      mainSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": docData?.business_name,
        "description": description,
        "image": docData?.logo || docData?.featured_image,
        "url": url,
        "email": docData?.email,
        "telephone": docData?.phone,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": docData?.city || "Dhaka",
          "addressRegion": "Dhaka",
          "addressCountry": "BD"
        },
        "sameAs": [docData?.social_linkedin, docData?.social_twitter, docData?.social_facebook].filter(Boolean)
      };
    }

    const faqSchema = (docData?.faqs && docData.faqs.length > 0) ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": docData.faqs.map(f => ({
        "@type": "Question",
        "name": f.question || f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer || f.a }
      }))
    } : null;

    const combinedSchemas = [orgSchema, breadcrumbSchema, websiteSchema, mainSchema];
    if (faqSchema) combinedSchemas.push(faqSchema);

    // --- MASTER SOCIAL & SPEED META ---
    const articleMeta = (type === 'blog' || type === 'knowledge') ? `
    <meta property="article:published_time" content="${publishedTime}">
    <meta property="article:modified_time" content="${modifiedTime}">
    <meta property="article:author" content="${authorData?.name || "Entrepreneurs BD"}">
    <meta property="article:section" content="${category}">
    <meta property="article:tag" content="Entrepreneurship, Startup, Bangladesh, Business">` : '';

    const speedHints = `
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossorigin>`;

    const metaTags = `
    <!-- 1000% SEO Perfection: Master Engine -->
    <title>${title}</title>
    ${speedHints}
    <meta name="description" content="${description}">
    <link rel="canonical" href="${url}">
    <link rel="alternate" hreflang="en-bd" href="${url}">
    <meta name="geo.region" content="BD-13">
    <meta name="geo.placename" content="Dhaka">
    <meta property="og:locale" content="en_BD">
    <meta property="og:type" content="${type === 'blog' ? 'article' : 'website'}">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    ${articleMeta}
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:site" content="@EntrepreneursBD">
    <meta property="twitter:creator" content="@EntrepreneursBD">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${ogImageUrl}">
    ${combinedSchemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
    `;

    const finalHtml = baseHtml.includes('<head>') ? baseHtml.replace('<head>', '<head>' + metaTags) : baseHtml.replace('<html>', '<html><head>' + metaTags + '</head>');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(finalHtml);

  } catch (error) {
    console.error('[SEO ENGINE CRITICAL] Fallback to base HTML:', error.message);
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(baseHtml);
  }
};
