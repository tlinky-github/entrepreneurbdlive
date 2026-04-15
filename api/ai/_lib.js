// Shared utilities for AI API routes
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (reuse singleton)
let db = null;
let initialized = false;

// Force rebuild marker
const BUILD_VERSION = '2';

function initializeFirebase() {
  if (initialized) return db;
  
  try {
    if (admin.apps.length === 0) {
      const credsJson = process.env.FIREBASE_CREDENTIALS_JSON;
      
      if (!credsJson) {
        throw new Error('FIREBASE_CREDENTIALS_JSON environment variable is not set');
      }
      
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(credsJson);
      } catch (parseErr) {
        console.error('Failed to parse FIREBASE_CREDENTIALS_JSON:', parseErr.message);
        console.error('First 100 chars:', credsJson.substring(0, 100));
        throw new Error(`Invalid JSON in FIREBASE_CREDENTIALS_JSON: ${parseErr.message}`);
      }
      
      if (!serviceAccount.project_id) {
        throw new Error('FIREBASE_CREDENTIALS_JSON missing project_id field');
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
    console.error('Stack:', error.stack);
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
