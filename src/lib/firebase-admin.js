import admin from 'firebase-admin';

let db = null;

export function initializeFirebaseAdmin() {
  if (db) return db;

  if (admin.apps.length === 0) {
    const credsJson = process.env.FIREBASE_CREDENTIALS_JSON;
    
    if (!credsJson) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[FirebaseAdmin] WARNING: FIREBASE_CREDENTIALS_JSON is missing. Admin features (API/Sitemap) will be unavailable locally.');
        return null; // Return null instead of throwing to permit local UI testing
      }
      throw new Error('FIREBASE_CREDENTIALS_JSON environment variable is not set');
    }

    try {
      const sanitizedCreds = credsJson.trim();
      const serviceAccount = JSON.parse(sanitizedCreds);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.info('[FirebaseAdmin] SUCCESS: Identity Hub Initialized.');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[FirebaseAdmin] ERROR: Malformed credentials. Admin features unavailable.');
        return null;
      }
      throw new Error(`Firebase Admin initialization failed: ${error.message}`);
    }
  }

  db = admin.firestore();
  return db;
}

export { admin };
