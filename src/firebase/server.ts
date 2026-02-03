import {
  initializeApp,
  getApps,
  // cert,
  // ServiceAccount,
  applicationDefault,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
// import serviceAccount from '../../../firebase-service-account.json';

const app =
  getApps().length === 0
    ? initializeApp({
        // credential: cert(serviceAccount as ServiceAccount),
        credential: applicationDefault(),
      })
    : getApps()[0];

export const serverAuth = getAuth(app);
export const serverDb = getFirestore(app);
