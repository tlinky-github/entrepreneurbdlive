const { initializeFirebase } = require('./_lib');
const admin = require('firebase-admin');

module.exports = async (req, res) => {
  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    envKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('API') || k.includes('KEY')),
    firebaseConfig: {
      FIREBASE_CREDENTIALS_JSON_length: process.env.FIREBASE_CREDENTIALS_JSON ? process.env.FIREBASE_CREDENTIALS_JSON.length : 0,
      FIREBASE_SERVICE_ACCOUNT_JSON_length: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length : 0,
      REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'not set',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'not set',
    },
    jsonParseTest: null,
    sdkState: {
      appsInitialized: admin.apps.length,
      initAttemptError: null
    }
  };

  const credsJson = process.env.FIREBASE_CREDENTIALS_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (credsJson) {
    try {
      let sanitized = credsJson.trim();
      if ((sanitized.startsWith('"') && sanitized.endsWith('"')) || 
          (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
        sanitized = sanitized.slice(1, -1).trim();
      }

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

      const cleaned = sanitizeJsonNewlines(sanitized);
      report.jsonParseTest = {
        rawLength: credsJson.length,
        sanitizedLength: sanitized.length,
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

  try {
    initializeFirebase();
    report.sdkState.success = true;
    report.sdkState.appsAfter = admin.apps.length;
  } catch (e) {
    report.sdkState.success = false;
    report.sdkState.initAttemptError = {
      message: e.message,
      stack: e.stack
    };
  }

  res.status(200).json(report);
};
