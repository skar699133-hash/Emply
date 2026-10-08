import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const env = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAiIQ86F8YFdlocWP1G_haUrnad4YWFy_o",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "one7-001.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "one7-001",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "one7-001.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "595197475064",
  appId: env.VITE_FIREBASE_APP_ID || "1:595197475064:web:6f8002bfd631a8f158a30d",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-GBX3GWY4XC"
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes('YOUR_')
  );
};

// Initialize Firebase safely
export const app = isFirebaseConfigured()
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

export let analytics: any = null;
if (app && typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Graceful fallback for non-browser/unsupported environments
  });
}

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
};
export type { FirebaseUser };
