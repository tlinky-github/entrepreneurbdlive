
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkPosts() {
  const snapshot = await db.collection('posts').orderBy('created_at', 'desc').limit(2).get();
  snapshot.forEach(doc => {
    console.log('ID:', doc.id);
    console.log('Content snippet:', doc.data().content_html?.substring(0, 500));
    console.log('-------------------');
  });
}

checkPosts().catch(console.error);
