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
  getUserData: () => Promise<UserStats | null>;
}

export interface SessionResult {
  success: boolean;
  uid?: string;
  error?: string;
  isNewUser?: boolean;
}

export interface UserStats {
  combinedScore: number;
  dailyStreak: number;
  bestStreak: number;
  matchesPlayed: number;
  personalBestScore: number;
  lastMatchTimestamp: number | null;
}

export interface ServerUserData extends UserStats {
  uid: string;
  email: string | null;
  displayName: string;
  createdAt?: number;
}

export type LocalUserData = UserStats;
