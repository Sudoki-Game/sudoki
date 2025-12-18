import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from '../../../firebase-service-account.json';

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount as ServiceAccount)
      })
    : getApps()[0];

export const serverAuth = getAuth(app);
