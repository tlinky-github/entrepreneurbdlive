import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
// In production, these should be securely stored in .env files
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// --- PRODUCTION HEALTH CHECK ---
const validateConfig = () => {
  const isMissing = !process.env.REACT_APP_FIREBASE_API_KEY || 
                    !process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 
                    !process.env.REACT_APP_FIREBASE_PROJECT_ID;

  if (isMissing) {
    const missingKeys = [];
    if (!process.env.REACT_APP_FIREBASE_API_KEY) missingKeys.push('REACT_APP_FIREBASE_API_KEY');
    if (!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN) missingKeys.push('REACT_APP_FIREBASE_AUTH_DOMAIN');
    if (!process.env.REACT_APP_FIREBASE_PROJECT_ID) missingKeys.push('REACT_APP_FIREBASE_PROJECT_ID');

    console.error(
      `❌ CRITICAL: Missing Environment Variables: ${missingKeys.join(', ')}. ` +
      `Please ensure these are configured in your Vercel Dashboard and your local .env file.`
    );
  }
};

validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
