const axios = require('axios');
const admin = require('firebase-admin');

const sanitizeJsonNewlines = (str) => {
  let result = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escape) {
      inString = !inString;
      result += char;
    } else if (char === '\\' && !escape) {
      escape = true;
      result += char;
    } else if (inString && (char === '\n' || char === '\r')) {
      if (char === '\n') {
        result += '\\n';
      }
      escape = false;
    } else {
      escape = false;
      result += char;
    }
  }
  return result;
};

// 1. Initialize Firebase Admin
if (!admin.apps.length) {
  const credsJson = process.env.FIREBASE_CREDENTIALS_JSON;
  if (credsJson) {
    let sanitized = credsJson.trim();
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) || 
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
      sanitized = sanitized.slice(1, -1).trim();
    }
    const serviceAccount = JSON.parse(sanitizeJsonNewlines(sanitized));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback for local development if credsJson is missing
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID,
    });
  }
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, commentData } = req.body;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!token) {
    return res.status(400).json({ success: false, error: 'Captcha token is missing' });
  }

  if (!secretKey) {
    console.error('Missing TURNSTILE_SECRET_KEY environment variable');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    // 2. Verify Turnstile Token with Cloudflare
    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const response = await axios.post(verifyUrl, {
      secret: secretKey,
      response: token,
      remoteip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    const verification = response.data;

    if (!verification.success) {
      console.error('Turnstile verification failed:', verification['error-codes']);
      return res.status(400).json({ 
        success: false, 
        error: 'Captcha verification failed',
        details: verification['error-codes']
      });
    }

    // 3. Token is valid, write to Firestore
    const docRef = await db.collection('comments').add({
      ...commentData,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ 
      success: true, 
      id: docRef.id,
      message: 'Comment posted successfully'
    });

  } catch (error) {
    console.error('Error processing comment:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
