import {
  completeOnboarding as completeOnboardingAction,
  createSession as createSessionAction,
  removeSession as removeSessionAction,
  deleteAccount as deleteAccountAction,
} from '@/app/actions/auth';
import type { SessionResult } from '@/auth/types';
import type {
  DeleteAccountResult,
  OnboardingResult,
} from '@/app/actions/auth';

/**
 * Create an authenticated session for the current user.
 *
 * @param idToken - Firebase ID token for the signed-in user
 * @returns Session creation result
 */
export const createSession = async (idToken: string): Promise<SessionResult> =>
  createSessionAction(idToken);

/**
 * Remove the current authenticated session.
 *
 * @returns Promise that resolves when the session is removed
 */
export const removeSession = async (): Promise<void> => removeSessionAction();

/**
 * Delete the currently authenticated user account.
 *
 * @returns Result indicating whether account deletion succeeded
 */
export const deleteAccount = async (): Promise<DeleteAccountResult> =>
  deleteAccountAction();

/**
 * Complete user onboarding using submitted form data.
 *
 * @param prevState - Previous onboarding action state
 * @param formData - Form payload containing display name
 * @returns Updated onboarding action state
 */
export const completeOnboarding = async (
  prevState: OnboardingResult,
  formData: FormData,
): Promise<OnboardingResult> => completeOnboardingAction(prevState, formData);

export type { OnboardingResult };
