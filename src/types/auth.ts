// Re-export user types for convenience
export type {
  BaseUserStats,
  LocalUserData,
  ServerUserData
} from '@/user/types';
export {
  createDefaultLocalUserData,
  createInitialServerUserData,
  hasCompletedOnboarding
} from '@/user/types';

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
}

export interface SessionResult {
  success: boolean;
  uid?: string;
  error?: string;
  isNewUser?: boolean;
}

/**
 * Alias for backward compatibility
 * @deprecated Use BaseUserStats instead
 */
export type UserStats = import('@/user/types').BaseUserStats;

export interface AuthContextType {
  loading: boolean;
  getUserData: () => Promise<import('@/user/types').BaseUserStats | null>;
}
