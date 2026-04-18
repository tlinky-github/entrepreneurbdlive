const { initializeApp, getApp, getApps } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');

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
  const { path } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /bot|facebookexternalhit|whatsapp|google-marketing-platform|twitterbot|messenger|slackbot|linkedinbot|embedly|quora link preview|outbrain|pinterest\/0\.|bingbot|msnbot|bingpreview|googlebot|adsbot-google|twitterbot|pinterest|baiduspider|yandexbot|facebookexternalhit|metainspector/i.test(userAgent);

  if (!isBot && !req.query.force_bot) {
    // If not a bot, let Vercel handle it normally (this rewrite should only be triggered for bots via vercel.json)
    // But as a fallback, we serve the standard index.html
    return res.status(200).send('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=' + req.url + '"></head><body>Redirecting...</body></html>');
  }

  try {
    const segments = path.split('/').filter(Boolean);
    const type = segments[0]; // blog, directory, entrepreneurs
    const slug = segments[1];

    let title = "Entrepreneurs BD | The National Engine of Growth";
    let description = "Bangladesh's premier platform for entrepreneurs, startups, and business insights.";
    let image = "https://entrepreneurs.bd/og-default.png"; // Fallback
    let url = `https://entrepreneurs.bd/${path}`;

    if (type && slug) {
      const collectionName = type === 'blog' ? 'posts' : 
                          type === 'directory' ? 'listings' : 
                          type === 'entrepreneurs' ? 'profiles' : null;

      if (collectionName) {
        const q = query(collection(db, collectionName), where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          
          if (type === 'blog') {
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

    // Clean up description
    description = description.replace(/<[^>]*>/g, '').substring(0, 160);
    
    // Generate dynamic OG image URL
    const ogImageUrl = `https://entrepreneurs.bd/api/og-image?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&image=${encodeURIComponent(image)}&type=${type}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${ogImageUrl}">

    <!-- Redirection for non-bots who might land here -->
    <script>window.location.href = "${url}";</script>
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
    <img src="${ogImageUrl}" alt="${title}">
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(html);

  } catch (error) {
    console.error('SEO Handler Error:', error);
    return res.status(500).send('Internal Server Error');
  }
};
