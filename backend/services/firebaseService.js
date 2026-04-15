const admin = require('firebase-admin');
const path = require('path');

/**
 * Firebase Admin SDK Initialization
 * Initializes Firebase for Firestore access and authentication verification
 * 
 * Environment Variables:
 * - FIREBASE_CREDENTIALS_PATH: Path to credentials.json file
 * - FIREBASE_CREDENTIALS_JSON: Raw JSON string with credentials
 */

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) {
    return admin;
  }

  try {
    let serviceAccount;

    // Try JSON string first (Vercel environment variable)
    if (process.env.FIREBASE_CREDENTIALS_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
      console.log('ℹ️ Using Firebase credentials from FIREBASE_CREDENTIALS_JSON');
    } 
    // Try file path (local development)
    else if (process.env.FIREBASE_CREDENTIALS_PATH) {
      serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH);
      console.log('ℹ️ Using Firebase credentials from FIREBASE_CREDENTIALS_PATH');
    }
    // Default local file
    else {
      const credentialsPath = path.join(__dirname, '../../firebase-credentials.json');
      serviceAccount = require(credentialsPath);
      console.log('ℹ️ Using Firebase credentials from firebase-credentials.json');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log('✓ Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK');
    console.error('Environment Variables to Set:');
    console.error('  Option 1: FIREBASE_CREDENTIALS_JSON="{...json...}"');
    console.error('  Option 2: FIREBASE_CREDENTIALS_PATH="/path/to/credentials.json"');
    console.error('  Option 3: Place firebase-credentials.json in project root');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Verify Firebase ID token from frontend
 * @param {string} token - Firebase ID token from client
 * @returns {Promise<object>} Decoded token with user info
 */
async function verifyToken(token) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Unauthorized: Invalid or expired token');
  }
}

/**
 * Get Firestore instance
 * @returns {object} Firestore database instance
 */
function getFirestore() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return db;
}

/**
 * Get Firebase auth instance
 * @returns {object} Firebase auth instance
 */
function getAuth() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin.auth();
}

// Initialize on module load
initializeFirebase();

module.exports = {
  admin,
  db,
  getFirestore,
  getAuth,
  verifyToken,
  initializeFirebase,
};
