import * as adminModule from 'firebase-admin';
import { createVerify } from 'node:crypto';

const getAdmin = () => adminModule.default || adminModule;
const getApps = () => getAdmin().apps || [];
const getAdminFirestore = (app) => getAdmin().firestore(app);
const getAdminAuth = (app) => getAdmin().auth(app);

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
    const firebaseModule = await import('./firebase.ts');
    clientDb = firebaseModule.db;
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

    const queryChain = {
      where: (field, op, value) => {
        filters.push({ field, op, value });
        return queryChain;
      },
      limit: (num) => {
        limitVal = num;
        return queryChain;
      },
      get: async () => {
        const db = await getDb();
        const { collection, query, where, limit, getDocs } = await getClientFirestore();
        let q = collection(db, collectionName);
        for (const filter of filters) {
          q = query(q, where(filter.field, filter.op, filter.value));
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
      limit: (num) => {
        limitVal = num;
        return queryChain;
      },
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
  if (getApps().length) return getAdminFirestore();

  try {
    const serviceAccount = getFirebaseServiceAccount();
    if (!serviceAccount) {
      throw new Error('Firebase credentials are not configured (serviceAccount is null)');
    }

    const admin = getAdmin();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminInitError = null;
    return getAdminFirestore();
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
