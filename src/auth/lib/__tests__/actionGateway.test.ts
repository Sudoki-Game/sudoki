// Mock must be hoisted before imports
jest.mock('@/app/actions/auth', () => ({
  createSession: jest.fn(),
  removeSession: jest.fn(),
  deleteAccount: jest.fn(),
  completeOnboarding: jest.fn(),
}));

import {
  createSession,
  removeSession,
  deleteAccount,
  completeOnboarding,
} from '../actionGateway';
import * as authActions from '@/app/actions/auth';
import type { SessionResult } from '@/auth/types';
import type {
  DeleteAccountResult,
  OnboardingResult,
} from '@/app/actions/auth';

const mockedAuthActions = authActions as jest.Mocked<typeof authActions>;

describe('Auth Action Gateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should delegate to createSession action and return result', async () => {
      const idToken = 'test-id-token';
      const mockResult: SessionResult = { success: true };

      mockedAuthActions.createSession.mockResolvedValue(mockResult);

      const result = await createSession(idToken);

      expect(authActions.createSession).toHaveBeenCalledWith(idToken);
      expect(result).toBe(mockResult);
    });

    it('should pass through action errors', async () => {
      const idToken = 'test-id-token';
      const mockError = new Error('Session creation failed');

      mockedAuthActions.createSession.mockRejectedValue(mockError);

      await expect(createSession(idToken)).rejects.toThrow(
        'Session creation failed',
      );
    });
  });

  describe('removeSession', () => {
    it('should delegate to removeSession action', async () => {
      mockedAuthActions.removeSession.mockResolvedValue(undefined);

      await removeSession();

      expect(authActions.removeSession).toHaveBeenCalledWith();
    });

    it('should pass through action errors', async () => {
      const mockError = new Error('Session removal failed');

      mockedAuthActions.removeSession.mockRejectedValue(mockError);

      await expect(removeSession()).rejects.toThrow('Session removal failed');
    });
  });

  describe('deleteAccount', () => {
    it('should delegate to deleteAccount action and return result', async () => {
      const mockResult: DeleteAccountResult = { success: true };

      mockedAuthActions.deleteAccount.mockResolvedValue(mockResult);

      const result = await deleteAccount();

      expect(authActions.deleteAccount).toHaveBeenCalledWith();
      expect(result).toBe(mockResult);
    });

    it('should pass through error results from action', async () => {
      const mockResult: DeleteAccountResult = {
        success: false,
        error: 'Account deletion failed',
      };

      mockedAuthActions.deleteAccount.mockResolvedValue(mockResult);

      const result = await deleteAccount();

      expect(result).toEqual(mockResult);
    });
  });

  describe('completeOnboarding', () => {
    it('should delegate to completeOnboarding action and return result', async () => {
      const prevState: OnboardingResult = { success: false };
      const formData = new FormData();
      formData.set('displayName', 'Test User');

      const mockResult: OnboardingResult = {
        success: true,
      };

      mockedAuthActions.completeOnboarding.mockResolvedValue(mockResult);

      const result = await completeOnboarding(prevState, formData);

      expect(authActions.completeOnboarding).toHaveBeenCalledWith(
        prevState,
        formData,
      );
      expect(result).toBe(mockResult);
    });

    it('should pass through validation errors from action', async () => {
      const prevState: OnboardingResult = { success: false };
      const formData = new FormData();

      const mockResult: OnboardingResult = {
        success: false,
        error: 'Display name is required',
      };

      mockedAuthActions.completeOnboarding.mockResolvedValue(mockResult);

      const result = await completeOnboarding(prevState, formData);

      expect(result).toEqual(mockResult);
    });
  });
});
