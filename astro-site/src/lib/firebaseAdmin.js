import admin from 'firebase-admin';
import { createRequire } from 'node:module';
import { createVerify } from 'node:crypto';

const _require = createRequire(import.meta.url);

let _getAdminFirestoreInstance = null;
let _getAdminAuthInstance = null;
try {
  _getAdminFirestoreInstance = _require('firebase-admin/firestore').getFirestore;
} catch (e) {}

try {
  _getAdminAuthInstance = _require('firebase-admin/auth').getAuth;
} catch (e) {}

let _adminCache = null;
const getAdmin = () => {
  if (!_adminCache) {
    let resolvedAdmin = admin;
    if (admin && admin.default && typeof admin.default.initializeApp === 'function') {
      resolvedAdmin = admin.default;
    }

    // Build a credential shim if not present (firebase-admin v12+)
    if (resolvedAdmin && !resolvedAdmin.credential) {
      const certFn = resolvedAdmin.cert || admin.cert;
      if (certFn) {
        resolvedAdmin = Object.assign(Object.create(null), resolvedAdmin, {
          credential: { cert: certFn.bind(null) },
        });
      }
    }

    _adminCache = resolvedAdmin;
  }
  return _adminCache;
};

const getApps = () => getAdmin().apps || [];

const getAdminFirestore = (app) => {
  if (typeof _getAdminFirestoreInstance === 'function') {
    return app ? _getAdminFirestoreInstance(app) : _getAdminFirestoreInstance();
  }
  if (_getAdminFirestoreInstance && typeof _getAdminFirestoreInstance.default === 'function') {
    return app ? _getAdminFirestoreInstance.default(app) : _getAdminFirestoreInstance.default();
  }
  const adm = getAdmin();
  if (typeof adm.firestore === 'function') {
    return app ? adm.firestore(app) : adm.firestore();
  }
  if (adm && adm.default && typeof adm.default.firestore === 'function') {
    return app ? adm.default.firestore(app) : adm.default.firestore();
  }
  throw new Error(`firebase-admin: getFirestore not found. _getAdminFirestoreInstance type: ${typeof _getAdminFirestoreInstance}, adm.firestore type: ${adm ? typeof adm.firestore : 'undefined'}`);
};

const getAdminAuth = (app) => {
  if (typeof _getAdminAuthInstance === 'function') {
    return app ? _getAdminAuthInstance(app) : _getAdminAuthInstance();
  }
  if (_getAdminAuthInstance && typeof _getAdminAuthInstance.default === 'function') {
    return app ? _getAdminAuthInstance.default(app) : _getAdminAuthInstance.default();
  }
  const adm = getAdmin();
  if (typeof adm.auth === 'function') {
    return app ? adm.auth(app) : adm.auth();
  }
  if (adm && adm.default && typeof adm.default.auth === 'function') {
    return app ? adm.default.auth(app) : adm.default.auth();
  }
  throw new Error(`firebase-admin: getAuth not found. _getAdminAuthInstance type: ${typeof _getAdminAuthInstance}`);
};
let clientDb = null;
let clientFirestore = null;

const getClientFirestore = async () => {
  if (!clientFirestore) {
    clientFirestore = await import('firebase/firestore');
  }
  return clientFirestore;
};

const getClientDb = async () => {
  if (!clientDb) {
    // Import directly — do NOT use the Proxy from firebase.ts.
    // firebase/firestore's collection() does instanceof checks and rejects a Proxy.
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getFirestore: getClientFirestoreInstance } = await import('firebase/firestore');

    const projectId = env('PUBLIC_FIREBASE_PROJECT_ID') || env('FIREBASE_PROJECT_ID') || env('REACT_APP_FIREBASE_PROJECT_ID');
    const apiKey    = env('PUBLIC_FIREBASE_API_KEY')    || env('REACT_APP_FIREBASE_API_KEY');
    const appId     = env('PUBLIC_FIREBASE_APP_ID')     || env('REACT_APP_FIREBASE_APP_ID');

    const firebaseConfig = {
      apiKey,
      authDomain:        env('PUBLIC_FIREBASE_AUTH_DOMAIN')        || env('REACT_APP_FIREBASE_AUTH_DOMAIN')        || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket:     env('PUBLIC_FIREBASE_STORAGE_BUCKET')     || env('REACT_APP_FIREBASE_STORAGE_BUCKET')     || `${projectId}.firebasestorage.app`,
      messagingSenderId: env('PUBLIC_FIREBASE_MESSAGING_SENDER_ID')|| env('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
      appId,
    };

    // Re-use any already-initialized app (avoid duplicate-app error)
    const existingApps = getApps();
    const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
    clientDb = getClientFirestoreInstance(app);
  }
  return clientDb;
};

const makeAdminFirestoreWrapper = () => {
  const getDb = async () => {
    return await getClientDb();
  };

  const wrapDocSnapshot = (snap) => {
    const isExists = typeof snap?.exists === 'function' ? snap.exists() : Boolean(snap?.exists);
    return {
      exists: isExists,
      id: snap.id,
      data: () => (typeof snap?.data === 'function' ? snap.data() : snap?.data),
    };
  };

  const wrapQuerySnapshot = (snap) => {
    const docs = snap.docs.map(doc => wrapDocSnapshot(doc));
    return {
      empty: snap.empty,
      docs,
      forEach: (callback) => docs.forEach(callback),
    };
  };

  const docWrapper = (collectionName, docId) => {
    return {
      get: async () => {
        const db = await getDb();
        const { doc, getDoc } = await getClientFirestore();
        const snap = await getDoc(doc(db, collectionName, docId));
        return wrapDocSnapshot(snap);
      },
      set: async (data, options) => {
        const db = await getDb();
        const { doc, setDoc } = await getClientFirestore();
        await setDoc(doc(db, collectionName, docId), data, options);
      },
      update: async (data) => {
        const db = await getDb();
        const { doc, updateDoc } = await getClientFirestore();
        await updateDoc(doc(db, collectionName, docId), data);
      },
      delete: async () => {
        const db = await getDb();
        const { doc, deleteDoc } = await getClientFirestore();
        await deleteDoc(doc(db, collectionName, docId));
      }
    };
  };

  const collectionWrapper = (collectionName) => {
    let filters = [];
    let limitVal = null;
    let orderByField = null;
    let orderByDir = 'asc';

    const queryChain = {
      where: (field, op, value) => {
        filters.push({ field, op, value });
        return queryChain;
      },
      limit: (num) => {
        limitVal = num;
        return queryChain;
      },
      orderBy: (field, dir = 'asc') => {
        orderByField = field;
        orderByDir = dir;
        return queryChain;
      },
      /** count() — returns a CountQuery-like object with .get() that resolves {data: () => {count}} */
      count: () => ({
        get: async () => {
          const db = await getDb();
          const { collection, query, where, getCountFromServer } = await getClientFirestore();
          let q = collection(db, collectionName);
          for (const filter of filters) {
            q = query(q, where(filter.field, filter.op, filter.value));
          }
          try {
            const snap = await getCountFromServer(q);
            return { data: () => ({ count: snap.data().count }) };
          } catch (e) {
            // getCountFromServer may not be available in all SDK versions — fall back to full fetch
            const { getDocs } = await getClientFirestore();
            const snap = await getDocs(q);
            return { data: () => ({ count: snap.size }) };
          }
        }
      }),
      get: async () => {
        const db = await getDb();
        const { collection, query, where, limit, orderBy, getDocs } = await getClientFirestore();
        let q = collection(db, collectionName);
        for (const filter of filters) {
          q = query(q, where(filter.field, filter.op, filter.value));
        }
        if (orderByField) {
          q = query(q, orderBy(orderByField, orderByDir));
        }
        if (limitVal !== null && typeof limit === 'function') {
          q = query(q, limit(limitVal));
        }
        const snap = await getDocs(q);
        return wrapQuerySnapshot(snap);
      }
    };

    return {
      doc: (docId) => docWrapper(collectionName, docId),
      add: async (data) => {
        const db = await getDb();
        const { collection, addDoc } = await getClientFirestore();
        const docRef = await addDoc(collection(db, collectionName), data);
        return { id: docRef.id };
      },
      where: (field, op, value) => {
        filters.push({ field, op, value });
        return queryChain;
      },
      orderBy: (field, dir = 'asc') => {
        orderByField = field;
        orderByDir = dir;
        return queryChain;
      },
      limit: (num) => {
        limitVal = num;
        return queryChain;
      },
      count: () => queryChain.count(),
      get: async () => {
        const db = await getDb();
        const { collection, getDocs } = await getClientFirestore();
        const snap = await getDocs(collection(db, collectionName));
        return wrapQuerySnapshot(snap);
      }
    };
  };

  return {
    collection: (name) => collectionWrapper(name),
  };
};

// Safe environment variable helper supporting both Vite (import.meta.env) and Node (process.env)
export const env = (key, fallbackKey) => {
  if (typeof import.meta.env !== 'undefined') {
    if (import.meta.env[key]) return import.meta.env[key];
    if (fallbackKey && import.meta.env[fallbackKey]) return import.meta.env[fallbackKey];
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    if (fallbackKey && process.env[fallbackKey]) return process.env[fallbackKey];
  }
  return undefined;
};

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

const getFirebaseServiceAccount = () => {
  const credsJson = env('FIREBASE_CREDENTIALS_JSON', 'FIREBASE_SERVICE_ACCOUNT_JSON');
  if (credsJson) {
    let sanitized = credsJson.trim();

    // Strip outer single or double quotes added by some .env editors/shells
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) ||
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
      sanitized = sanitized.slice(1, -1).trim();
    }

    // Replace double-escaped newlines (\\n) with real newlines ONLY inside the private_key value
    // Do this before JSON.parse so the key is valid
    sanitized = sanitized.replace(/\\\\n/g, '\\n');

    try {
      const parsed = JSON.parse(sanitized);
      // Ensure private_key has real newlines (in case they survived as literal \n strings)
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      console.log('[FirebaseAdmin] Service account parsed successfully. project_id:', parsed.project_id, 'client_email:', parsed.client_email);
      return parsed;
    } catch (e) {
      console.error('[FirebaseAdmin] Failed to parse FIREBASE_CREDENTIALS_JSON:', e.message);
      console.error('[FirebaseAdmin] First 100 chars:', sanitized.slice(0, 100));
    }
  }

  // Fallback to individual env vars
  const projectId = env('FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID');
  const clientEmail = env('FIREBASE_CLIENT_EMAIL');
  const privateKey = env('FIREBASE_PRIVATE_KEY');

  if (projectId && clientEmail && privateKey) {
    console.log('[FirebaseAdmin] Using individual FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY vars');
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
  }

  console.error('[FirebaseAdmin] No credentials found. Set FIREBASE_CREDENTIALS_JSON in your .env file.');
  return null;
};


let adminInitError = null;

export const getAdminInitError = () => adminInitError;

export const isClientDb = () => {
  try {
    return !getApps().length;
  } catch (e) {
    return true;
  }
};

export const getServerTimestamp = () => {
  try {
    if (getApps().length) {
      return getAdmin().firestore.FieldValue.serverTimestamp();
    }
  } catch (e) {
    console.warn('[FirebaseAdmin] Failed to get serverTimestamp from Admin SDK, falling back to local Date:', e.message);
  }
  return new Date();
};

export const ensureFirebaseAdmin = () => {
  if (getApps().length) return getAdminFirestore(getApps()[0]);

  try {
    const serviceAccount = getFirebaseServiceAccount();
    if (!serviceAccount) {
      throw new Error('Firebase credentials are not configured (serviceAccount is null)');
    }

    const admin = getAdmin();
    // Support both firebase-admin v11 (admin.credential.cert) and v12+ (admin.cert directly)
    const certFn = (admin.credential && admin.credential.cert)
      ? admin.credential.cert.bind(admin.credential)
      : (admin.cert ? admin.cert.bind(admin) : null);

    if (!certFn) {
      throw new Error('firebase-admin: cannot find cert() function on module');
    }

    let app;
    try {
      app = admin.initializeApp({
        credential: certFn(serviceAccount),
      });
    } catch (initErr) {
      // If the app already exists (e.g. from client SDK init), reuse it
      if (initErr.code === 'app/duplicate-app' || (initErr.message && initErr.message.includes('already exists'))) {
        app = admin.getApp ? admin.getApp() : getApps()[0];
      } else {
        throw initErr;
      }
    }

    adminInitError = null;
    return getAdminFirestore(app);
  } catch (error) {
    adminInitError = error;
    console.error('[FirebaseAdmin] Initialization failed:', error.message);
    throw error;
  }
};

export const getFirestore = () => {
  try {
    return ensureFirebaseAdmin();
  } catch (e) {
    console.warn('[FirebaseAdmin] Admin credentials missing. Using Client SDK wrapper fallback:', e.message);
    return makeAdminFirestoreWrapper();
  }
};

const decodeBase64Url = (value) => Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

const parseJwt = (token) => {
  const [headerPart, payloadPart, signaturePart] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error('Invalid token format');
  }

  return {
    header: JSON.parse(decodeBase64Url(headerPart)),
    payload: JSON.parse(decodeBase64Url(payloadPart)),
    signature: signaturePart,
    signingInput: `${headerPart}.${payloadPart}`,
  };
};

let googleCertCache = null;
let googleCertCacheExpiresAt = 0;

const getGoogleCerts = async () => {
  const now = Date.now();
  if (googleCertCache && now < googleCertCacheExpiresAt) {
    return googleCertCache;
  }

  const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!response.ok) {
    throw new Error('Unable to fetch Firebase public certificates');
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  googleCertCacheExpiresAt = now + maxAgeSeconds * 1000;
  googleCertCache = await response.json();
  return googleCertCache;
};

const verifyFirebaseIdTokenWithoutAdmin = async (idToken) => {
  const projectId = env('PUBLIC_FIREBASE_PROJECT_ID') || env('FIREBASE_PROJECT_ID') || env('REACT_APP_FIREBASE_PROJECT_ID');
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is not set');
  }

  const { header, payload, signature, signingInput } = parseJwt(idToken);
  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error('Firebase signing certificate not found');
  }

  const verified = createVerify('RSA-SHA256')
    .update(signingInput)
    .verify(cert, Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));

  if (!verified) {
    throw new Error('Invalid Firebase ID token signature');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSeconds) {
    throw new Error('Firebase ID token expired');
  }
  if (payload.aud !== projectId) {
    throw new Error('Firebase ID token audience mismatch');
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Firebase ID token issuer mismatch');
  }

  return payload;
};

export const verifyFirebaseIdToken = async (idToken) => {
  try {
    ensureFirebaseAdmin();
    if (getApps().length) {
      return await getAdminAuth().verifyIdToken(idToken);
    }
  } catch (e) {
    console.warn('[FirebaseAdmin] Failed to verify via Admin SDK, falling back to manual validation:', e.message);
  }

  const payload = await verifyFirebaseIdTokenWithoutAdmin(idToken);
  if (payload && !payload.uid) {
    payload.uid = payload.sub;
  }
  return payload;
};
