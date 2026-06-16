import { getFirestore, ensureFirebaseAdmin, getAdminInitError, env } from '../../../lib/firebaseAdmin.js';
import * as adminModule from 'firebase-admin';
const admin = adminModule.default || adminModule;
const getApps = () => admin.apps || [];

export const ALL = async ({ request }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    envKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('API') || k.includes('KEY')),
    firebaseConfig: {
      FIREBASE_CREDENTIALS_JSON_length: env('FIREBASE_CREDENTIALS_JSON') ? env('FIREBASE_CREDENTIALS_JSON').length : 0,
      FIREBASE_SERVICE_ACCOUNT_JSON_length: env('FIREBASE_SERVICE_ACCOUNT_JSON') ? env('FIREBASE_SERVICE_ACCOUNT_JSON').length : 0,
      REACT_APP_FIREBASE_PROJECT_ID: env('REACT_APP_FIREBASE_PROJECT_ID') || 'not set',
      FIREBASE_PROJECT_ID: env('FIREBASE_PROJECT_ID') || 'not set',
    },
    jsonParseTest: null,
    sdkState: {
      appsInitialized: 0,
      initAttemptError: null,
      adminInitErrorSnapshot: null
    }
  };

  // Test JSON parsing
  const credsJson = env('FIREBASE_CREDENTIALS_JSON', 'FIREBASE_SERVICE_ACCOUNT_JSON');
  if (credsJson) {
    try {
      let sanitized = credsJson.trim();
      if ((sanitized.startsWith('"') && sanitized.endsWith('"')) || 
          (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
        sanitized = sanitized.slice(1, -1).trim();
      }

      // Simple clean test
      let cleaned = sanitized;
      // Let's see if we have manual newlines
      const hasEscapedNewlines = cleaned.includes('\\n');
      const hasRealNewlines = cleaned.includes('\n') || cleaned.includes('\r');

      report.jsonParseTest = {
        rawLength: credsJson.length,
        sanitizedLength: sanitized.length,
        hasEscapedNewlines,
        hasRealNewlines,
        startsWith: sanitized.slice(0, 15),
        endsWith: sanitized.slice(-15)
      };

      const parsed = JSON.parse(cleaned);
      report.jsonParseTest.success = true;
      report.jsonParseTest.parsedKeys = Object.keys(parsed);
      report.jsonParseTest.projectIdVal = parsed.project_id || 'missing';
      report.jsonParseTest.clientEmailVal = parsed.client_email ? `${parsed.client_email.slice(0, 5)}...` : 'missing';
      report.jsonParseTest.privateKeyLength = parsed.private_key ? parsed.private_key.length : 0;
      report.jsonParseTest.privateKeyValidPEM = parsed.private_key ? (parsed.private_key.includes('BEGIN PRIVATE KEY') && parsed.private_key.includes('END PRIVATE KEY')) : false;
    } catch (e) {
      report.jsonParseTest = {
        ...report.jsonParseTest,
        success: false,
        errorMessage: e.message,
        errorStack: e.stack
      };
    }
  } else {
    report.jsonParseTest = 'No creds JSON found in environment';
  }

  // Test SDK initialization
  try {
    report.sdkState.appsBefore = getApps().length;
    const db = ensureFirebaseAdmin();
    report.sdkState.success = true;
    report.sdkState.appsAfter = getApps().length;
  } catch (e) {
    report.sdkState.success = false;
    report.sdkState.initAttemptError = {
      message: e.message,
      stack: e.stack,
      keys: Object.keys(e)
    };
  }

  const adminInitErr = getAdminInitError();
  if (adminInitErr) {
    report.sdkState.adminInitErrorSnapshot = {
      message: adminInitErr.message,
      stack: adminInitErr.stack
    };
  }

  return new Response(JSON.stringify(report, null, 2), { status: 200, headers: corsHeaders });
};
