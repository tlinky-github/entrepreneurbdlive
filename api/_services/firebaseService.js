// Firebase Admin SDK initialization for Vercel
const admin = require('firebase-admin');

let db = null;

const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    let serviceAccount;

    // Try different credential sources
    if (process.env.FIREBASE_CREDENTIALS_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
        console.log('✓ Using Firebase credentials from FIREBASE_CREDENTIALS_JSON');
      } catch (e) {
        throw new Error('FIREBASE_CREDENTIALS_JSON is not valid JSON');
      }
    } else if (process.env.FIREBASE_CREDENTIALS_PATH) {
      try {
        serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH);
        console.log('✓ Using Firebase credentials from FIREBASE_CREDENTIALS_PATH');
      } catch (e) {
        throw new Error(`Cannot load credentials from FIREBASE_CREDENTIALS_PATH: ${e.message}`);
      }
    } else {
      throw new Error(
        'Firebase credentials not found. Set FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  if (!db) {
    db = admin.firestore();
  }

  return db;
};

const getFirestore = () => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

const verifyToken = async (token) => {
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  verifyToken,
  admin,
};
