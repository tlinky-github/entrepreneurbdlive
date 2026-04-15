const admin = require('firebase-admin');
const path = require('path');

/**
 * Firebase Admin SDK Initialization
 * Initializes Firebase for Firestore access and authentication verification
 */

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) {
    return admin;
  }

  try {
    // Check if Firebase credentials file exists
    const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH ||
      path.join(__dirname, '../../firebase-credentials.json');

    const serviceAccount = require(credentialsPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log('✓ Firebase Admin SDK initialized');
    return admin;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:');
    console.error('Make sure FIREBASE_CREDENTIALS_PATH is set or firebase-credentials.json exists in root');
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
