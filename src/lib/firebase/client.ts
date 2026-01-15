import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.CLIENT_FIREBASE_API_KEY,
  authDomain: process.env.CLIENT_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.CLIENT_FIREBASE_PROJECT_ID,
  storageBucket: process.env.CLIENT_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.CLIENT_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.CLIENT_FIREBASE_APP_ID,
  measurementId: process.env.CLIENT_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
