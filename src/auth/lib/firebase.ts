import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  type NextOrObserver,
  type User,
  sendSignInLinkToEmail,
} from 'firebase/auth';
import { auth } from '../../firebase/client';
import { FirebaseError } from 'firebase/app';

const actionCodeSettings = {
  url:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/finishSignIn'
      : 'https://sudoki.uk/finishSignIn',
  handleCodeInApp: true,
};

export function onAuthStateChanged(cb: NextOrObserver<User>) {
  return _onAuthStateChanged(auth, cb);
}

export async function signUpWithEmail(email: string, password: string) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function sendMagicLink(email: string) {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save the email locally to prevent the user from typing it again
    localStorage.setItem('emailForSignIn', email);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to send magic link: ${message}`);
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

export async function signOut() {
  try {
    return auth.signOut();
  } catch (error) {
    console.error('Error signing out', error);
  }
}

/**
 * Centralized Firebase error mapping
 */
export function mapFirebaseError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/popup-closed-by-user':
        return 'Auth session closed by user, please try again';
      default:
        return 'Authentication failed';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Authentication failed';
}
