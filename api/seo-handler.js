const { initializeApp, getApp, getApps } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit, doc, updateDoc, increment } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

module.exports = async (req, res) => {
  const { path: rawPath, action } = req.query;
  const path = rawPath ? (rawPath.startsWith('/') ? rawPath : '/' + rawPath) : '/';
  
  try {
    // --- 1. REDIRECT ENGINE (Highest Priority) ---
    // Check if this path matches a manual redirect in Firestore
    const redirectQuery = query(collection(db, 'redirects'), where('fromPath', '==', path.replace(/\/$/, '') || '/'), limit(1));
    const redirectSnap = await getDocs(redirectQuery);
    
    if (!redirectSnap.empty) {
      const redirectData = redirectSnap.docs[0].data();
      const targetUrl = redirectData.toPath;
      
      // Hit Tracking (Non-blocking)
      updateDoc(doc(db, 'redirects', redirectSnap.docs[0].id), {
        hit_count: increment(1),
        last_hit: new Date()
      }).catch(() => {});

      // Perform 301 Redirect
      res.setHeader('Location', targetUrl);
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(301).end();
    }

    // --- 2. DYNAMIC SITEMAP ENGINE ---
    if (action === 'sitemap' || path === '/sitemap.xml') {
      console.log('📡 Generating live sitemap...');
      const SITE_URL = 'https://entrepreneurs.bd';
      const lastmod = new Date().toISOString().split('T')[0];
      
      // Define static core routes
      let routes = [
        { url: '/', priority: 1.0, changefreq: 'weekly' },
        { url: '/blog', priority: 0.9, changefreq: 'daily' },
        { url: '/entrepreneurs', priority: 0.9, changefreq: 'daily' },
        { url: '/directory', priority: 0.9, changefreq: 'daily' },
        { url: '/knowledge', priority: 0.8, changefreq: 'weekly' },
        { url: '/about', priority: 0.6, changefreq: 'monthly' },
        { url: '/contact', priority: 0.6, changefreq: 'monthly' }
      ];

      // Fetch dynamic published content
      const collections = [
        { name: 'posts', path: '/blog/', priority: 0.8 },
        { name: 'profiles', path: '/entrepreneurs/', priority: 0.7 },
        { name: 'listings', path: '/directory/', priority: 0.7 },
        { name: 'resources', path: '/knowledge/', priority: 0.7 }
      ];

      for (const col of collections) {
        const q = query(collection(db, col.name), where('status', '==', 'published'));
        const snap = await getDocs(q);
        snap.forEach(doc => {
          const data = doc.data();
          routes.push({
            url: `${col.path}${data.slug || doc.id}`,
            priority: col.priority,
            changefreq: 'weekly'
          });
        });
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${SITE_URL}${r.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // 1 hour cache
      return res.status(200).send(xml);
    }

    // --- 3. BOT META-INJECTION ENGINE (Original Logic) ---
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|facebookexternalhit|whatsapp|google-marketing-platform|twitterbot|messenger|slackbot|linkedinbot|embedly|quora link preview|outbrain|pinterest\/0\.|bingbot|msnbot|bingpreview|googlebot|adsbot-google|twitterbot|baiduspider|yandexbot|metainspector/i.test(userAgent);

    if (!isBot && !req.query.force_bot) {
      // For real users, just redirect to the relevant frontend page (or let them hit 404 in SPA)
      return res.status(200).send('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=' + path + '"></head><body>Redirecting...</body></html>');
    }

    // Bot processing...
    const segments = path.split('/').filter(Boolean);
    const type = segments[0]; 
    const slug = segments[1];

    let title = "Entrepreneurs BD | The National Engine of Growth";
    let description = "Bangladesh's premier platform for entrepreneurs, startups, and business insights.";
    let image = "https://entrepreneurs.bd/og-default.png";
    let url = `https://entrepreneurs.bd${path}`;

    if (type && slug) {
      const collectionName = type === 'blog' ? 'posts' : 
                          type === 'directory' ? 'listings' : 
                          type === 'entrepreneurs' ? 'profiles' : 
                          type === 'knowledge' ? 'resources' : null;

      if (collectionName) {
        const q = query(collection(db, collectionName), where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (type === 'blog' || type === 'knowledge') {
            title = data.title || title;
            description = data.excerpt || data.seo_description || description;
            image = data.featured_image || image;
          } else if (type === 'directory') {
            title = data.business_name || title;
            description = data.short_description || data.description || description;
            image = data.logo || data.featured_image || image;
          } else if (type === 'entrepreneurs') {
            title = data.name || title;
            description = data.short_bio || data.details || description;
            image = data.photo || data.featured_image || image;
          }
        }
      }
    }

    description = description.replace(/<[^>]*>/g, '').substring(0, 160);
    const ogImageUrl = `https://entrepreneurs.bd/api/og-image?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(image)}&type=${type}`;

    const host = req.headers.host || 'entrepreneurs.bd';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const indexRes = await fetch(`${protocol}://${host}/index.html`);
    const baseHtml = await indexRes.text();

    const metaTags = `
    <!-- Injected by Unified SEO Engine -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${ogImageUrl}">
    `;

    // If we reach here, no content was found for this bot query
    // Log the dead link (Non-blocking)
    try {
      const id = path.replace(/[\/\.]/g, '_') || 'root';
      const docRef = doc(db, 'dead_links', id);
      const snap = await getDocs(query(collection(db, 'dead_links'), where('path', '==', path), limit(1)));
      
      if (!snap.empty) {
        updateDoc(doc(snap.docs[0].ref), {
          hit_count: increment(1),
          last_hit: new Date()
        });
      } else {
        // Fallback to simpler add logic if docRef is complex
        // We'll just use a collection add for simplicity in serverless
        const { addDoc } = require('firebase/firestore');
        addDoc(collection(db, 'dead_links'), {
          path,
          hit_count: 1,
          created_at: new Date(),
          last_hit: new Date()
        });
      }
    } catch (e) {}

    const finalHtml = baseHtml.includes('<head>') 
      ? baseHtml.replace('<head>', '<head>' + metaTags)
      : baseHtml.replace('<html>', '<html><head>' + metaTags + '</head>');

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(finalHtml);

  } catch (error) {
    console.error('Unified SEO Engine Error:', error);
    return res.status(500).send('Internal Server Error');
  }
};
