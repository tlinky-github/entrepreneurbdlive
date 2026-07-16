import { createRequire } from 'node:module';
import { createVerify } from 'node:crypto';

// Trick Vercel NFT into tracing these modules without executing them at top-level
if (process.env.NODE_ENV === 'vercel_nft_hack') {
  require('firebase-admin');
  require('firebase-admin/firestore');
  require('firebase-admin/auth');
}

// Use createRequire so the firebase-admin CJS module is loaded at runtime,
// bypassing Vite's ESM interop transform which breaks .credential/.initializeApp.
const _require = createRequire(import.meta.url);

let _adminCache = null;
const getAdmin = () => {
  if (!_adminCache) {
    const mod = _require('firebase-admin');
    // firebase-admin v12+ changed the API: credential.cert() is gone, cert() is now a direct export.
    // We normalize to always expose a `.credential.cert` shim for backward compat.
    let admin = mod;
    if (mod && mod.default && typeof mod.default.initializeApp === 'function') {
      admin = mod.default;
    } else if (mod && mod.__esModule && mod.default) {
      admin = mod.default;
    }

    // Build a credential shim if not present (firebase-admin v12+)
    if (admin && !admin.credential) {
      const certFn = admin.cert || mod.cert;
      if (certFn) {
        admin = Object.assign(Object.create(null), admin, {
          credential: { cert: certFn.bind(null) },
        });
      }
    }

    _adminCache = admin;
  }
  return _adminCache;
};

const getApps = () => getAdmin().apps || [];

// firebase-admin v12+: getFirestore is now from 'firebase-admin/firestore', not admin.firestore()
let _adminFirestoreFn = null;
const getAdminFirestoreFn = () => {
  if (!_adminFirestoreFn) {
    // 1. Try the dedicated sub-package (firebase-admin v12+)
    try {
      const fsModule = _require('firebase-admin/firestore');
      // Handle named export, .default, or any shape that exposes getFirestore
      const candidate =
        (fsModule && typeof fsModule.getFirestore === 'function' && fsModule.getFirestore) ||
        (fsModule && fsModule.default && typeof fsModule.default.getFirestore === 'function' && fsModule.default.getFirestore);
      if (candidate) {
        _adminFirestoreFn = candidate;
        return _adminFirestoreFn;
      }
    } catch (e) { /* sub-package not available, fall through */ }

    // 2. Try the root firebase-admin module's .firestore() method (v11 and some v12 builds)
    try {
      const admin = getAdmin();
      if (typeof admin.firestore === 'function') {
        _adminFirestoreFn = (app) => app ? admin.firestore(app) : admin.firestore();
        return _adminFirestoreFn;
      }
      // v12 root may expose getFirestore directly
      if (typeof admin.getFirestore === 'function') {
        _adminFirestoreFn = (app) => app ? admin.getFirestore(app) : admin.getFirestore();
        return _adminFirestoreFn;
      }
    } catch (e) { /* ignore */ }

    // 3. Nothing worked — throw a clear error
    _adminFirestoreFn = () => { throw new Error('firebase-admin: getFirestore not found'); };
  }
  return _adminFirestoreFn;
};

const getAdminFirestore = (app) => {
  const fn = getAdminFirestoreFn();
  return app ? fn(app) : fn();
};
const getAdminAuth = (app) => {
  try {
    const authModule = _require('firebase-admin/auth');
    if (authModule && typeof authModule.getAuth === 'function') {
      return app ? authModule.getAuth(app) : authModule.getAuth();
    }
  } catch (e) { /* ignore */ }
  
  const admin = getAdmin();
  if (typeof admin.auth === 'function') {
    return app ? admin.auth(app) : admin.auth();
  }
  if (typeof admin.getAuth === 'function') {
    return app ? admin.getAuth(app) : admin.getAuth();
  }
  throw new Error('firebase-admin: getAuth not found');
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

  const wrapDocSnapshot = (snap) => ({
    exists: () => snap.exists(),
    id: snap.id,
    data: () => snap.data(),
  });

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
    // Strip outer quotes if present
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) || 
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
      sanitized = sanitized.slice(1, -1).trim();
    }

    const cleaned = sanitizeJsonNewlines(sanitized);
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('[FirebaseAdmin] Failed to parse FIREBASE_CREDENTIALS_JSON directly:', e.message, 'Length:', cleaned.length, 'Starts with:', cleaned.slice(0, 15));
    }
  }

  const projectId = env('FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID');
  const clientEmail = env('FIREBASE_CLIENT_EMAIL');
  const privateKey = env('FIREBASE_PRIVATE_KEY');

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
  }

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
