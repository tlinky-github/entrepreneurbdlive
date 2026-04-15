// Shared utilities for AI API routes
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK (reuse singleton)
let db = null;

function initializeFirebase() {
  if (admin.apps.length === 0) {
    let serviceAccount;

    // Try different credential sources (same as backend)
    if (process.env.FIREBASE_CREDENTIALS_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
      console.log('ℹ️ Using Firebase credentials from FIREBASE_CREDENTIALS_JSON');
    } else if (process.env.FIREBASE_CREDENTIALS_PATH) {
      serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH);
      console.log('ℹ️ Using Firebase credentials from FIREBASE_CREDENTIALS_PATH');
    } else {
      const credentialsPath = path.join(process.cwd(), 'firebase-credentials.json');
      serviceAccount = require(credentialsPath);
      console.log('ℹ️ Using Firebase credentials from firebase-credentials.json');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  if (!db) {
    db = admin.firestore();
  }

  return db;
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

// Error response handler
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
