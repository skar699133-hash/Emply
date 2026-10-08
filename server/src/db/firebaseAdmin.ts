import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let app: App | null = null;
let firestoreDb: Firestore | null = null;
let authAdmin: Auth | null = null;

export const isFirebaseAdminConfigured = (): boolean => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) return true;
  return Boolean(projectId && clientEmail && privateKey);
};

export const initFirebaseAdmin = (): { firestore: Firestore | null; auth: Auth | null } => {
  if (app) {
    return { firestore: firestoreDb, auth: authAdmin };
  }

  const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

  try {
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized with serviceAccountKey.json');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      console.log(`✅ Firebase Admin SDK initialized for project: ${process.env.FIREBASE_PROJECT_ID}`);
    } else {
      console.log('ℹ️ Firebase Admin SDK: Credentials not yet set in server/.env or serviceAccountKey.json. Ready for configuration.');
      return { firestore: null, auth: null };
    }

    firestoreDb = getFirestore(app);
    authAdmin = getAuth(app);
  } catch (err: any) {
    console.warn('⚠️ Firebase Admin SDK initialization note:', err.message);
  }

  return { firestore: firestoreDb, auth: authAdmin };
};

// Initialize on module load
const { firestore, auth } = initFirebaseAdmin();

export { firestore, auth };
