import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function getCredential() {
  if (process.env.NODE_ENV === 'development') {
    try {
      const serviceAccount =
        require('../../firebase-service-account.json') as ServiceAccount;
      return cert(serviceAccount);
    } catch (error) {
      console.warn(
        '[FirebaseServer] Failed to load local service account, falling back to application default credentials:',
        error,
      );
    }
  }

  return applicationDefault();
}

const app =
  getApps().length === 0
    ? initializeApp({
        credential: getCredential(),
      })
    : getApps()[0];

export const serverAuth = getAuth(app);
export const serverDb = getFirestore(app);
