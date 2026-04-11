import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
// In production, these should be securely stored in .env files
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyApu5RhuRN17LrzEKd_0Y50fdip3mgEsoA",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "entrepreneurs-bd.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "entrepreneurs-bd",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "entrepreneurs-bd.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "723868160302",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:723868160302:web:1a0d26dff3663de2ccaabf",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-DSQV4YNE6V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
