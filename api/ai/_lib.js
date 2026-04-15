// Shared utilities for AI API routes
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (reuse singleton)
let db = null;
let initialized = false;

function initializeFirebase() {
  if (initialized) return db;
  
  try {
    if (admin.apps.length === 0) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON || '{}');
      
      if (!serviceAccount.project_id) {
        throw new Error('FIREBASE_CREDENTIALS_JSON environment variable not set or invalid');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    db = admin.firestore();
    initialized = true;
    return db;
  } catch (error) {
    console.error('Firebase initialization failed:', error.message);
    throw error;
  }
}

// Authentication middleware
async function authenticateUser(req) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      throw new Error('No token provided');
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error(`Unauthorized: ${error.message}`);
  }
}

// Error response handler (statusCode, message) - consistent order
function errorResponse(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

// Success response handler
function successResponse(res, data, message = '') {
  return res.status(200).json({
    success: true,
    data,
    message,
  });
}

module.exports = {
  initializeFirebase,
  authenticateUser,
  errorResponse,
  successResponse,
  getDB: () => db || initializeFirebase(),
};
