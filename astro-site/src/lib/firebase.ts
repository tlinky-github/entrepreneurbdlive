import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// In Vite/Astro SSR (Node.js), import.meta.env only has vars injected at build time.
// REACT_APP_* vars need to also be read from process.env for server-side rendering.
const env = (key: string, reactKey: string) =>
  import.meta.env[key] ||
  import.meta.env[reactKey] ||
  (typeof process !== 'undefined' ? process.env[reactKey] : undefined) ||
  (typeof process !== 'undefined' ? process.env[key] : undefined);

const firebaseConfig = {
  apiKey:            env('PUBLIC_FIREBASE_API_KEY',            'REACT_APP_FIREBASE_API_KEY'),
  authDomain:        env('PUBLIC_FIREBASE_AUTH_DOMAIN',        'REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId:         env('PUBLIC_FIREBASE_PROJECT_ID',         'REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket:     env('PUBLIC_FIREBASE_STORAGE_BUCKET',     'REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('PUBLIC_FIREBASE_MESSAGING_SENDER_ID','REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             env('PUBLIC_FIREBASE_APP_ID',             'REACT_APP_FIREBASE_APP_ID'),
};

// Prevent duplicate app initialization in SSR hot-reload scenarios
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

