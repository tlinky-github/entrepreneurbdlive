if (typeof globalThis.navigator === 'undefined') {
  (globalThis as any).navigator = { userAgent: 'node' };
}

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// In Vite/Astro SSR (Node.js), import.meta.env only has vars injected at build time.
// REACT_APP_* vars need to also be read from process.env for server-side rendering.
const env = (key: string, reactKey: string) => {
  if (typeof import.meta.env !== 'undefined') {
    if (import.meta.env[key]) return import.meta.env[key];
    if (import.meta.env[reactKey]) return import.meta.env[reactKey];
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[reactKey]) return process.env[reactKey];
    if (process.env[key]) return process.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey:            env('PUBLIC_FIREBASE_API_KEY',            'REACT_APP_FIREBASE_API_KEY'),
  authDomain:        env('PUBLIC_FIREBASE_AUTH_DOMAIN',        'REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId:         env('PUBLIC_FIREBASE_PROJECT_ID',         'REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket:     env('PUBLIC_FIREBASE_STORAGE_BUCKET',     'REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('PUBLIC_FIREBASE_MESSAGING_SENDER_ID','REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             env('PUBLIC_FIREBASE_APP_ID',             'REACT_APP_FIREBASE_APP_ID'),
};

let _db: any = null;
const getDb = () => {
  if (!_db) {
    const apps = typeof getApps === 'function' ? (getApps() || []) : [];
    const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
    _db = getFirestore(app);
  }
  return _db;
};

let _auth: any = null;
const getAuthInstance = () => {
  if (!_auth) {
    const apps = typeof getApps === 'function' ? (getApps() || []) : [];
    const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
    _auth = getAuth(app);
  }
  return _auth;
};

let _googleProvider: any = null;

export const db = new Proxy({}, {
  get: (target, prop, receiver) => {
    const inst = getDb();
    const value = Reflect.get(inst, prop);
    if (typeof value === 'function') {
      return value.bind(inst);
    }
    return value;
  },
  set: (target, prop, value) => {
    return Reflect.set(getDb(), prop, value);
  }
}) as any;

export const auth = new Proxy({}, {
  get: (target, prop, receiver) => {
    const inst = getAuthInstance();
    const value = Reflect.get(inst, prop);
    if (typeof value === 'function') {
      return value.bind(inst);
    }
    return value;
  },
  set: (target, prop, value) => {
    return Reflect.set(getAuthInstance(), prop, value);
  }
}) as any;

export const googleProvider = new Proxy({}, {
  get: (target, prop, receiver) => {
    if (!_googleProvider) {
      _googleProvider = new GoogleAuthProvider();
    }
    const value = Reflect.get(_googleProvider, prop);
    if (typeof value === 'function') {
      return value.bind(_googleProvider);
    }
    return value;
  }
}) as any;

