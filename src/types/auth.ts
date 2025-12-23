import { User } from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export interface SessionResult {
  success: boolean;
  uid?: string;
  error?: string;
  isNewUser?: boolean;
}
