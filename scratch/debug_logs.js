const admin = require('firebase-admin');

// Service account from environment
const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

const db = admin.firestore();

async function getRecentLogs() {
  try {
    console.log('Fetching last 5 AI logs...');
    const snapshot = await db.collection('ai_logs')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    
    if (snapshot.empty) {
      console.log('No logs found.');
      return;
    }

    snapshot.forEach(doc => {
      console.log('--- Log ID:', doc.id);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getRecentLogs();
