'use client';
import {
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './page.module.css';

const FinishSignInPage = () => {
  const router = useRouter();

  const auth = getAuth();

  async function handleMagicLinkSignIn() {
    // Confirm the link is a sign-in with email link.
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.getItem('emailForSignIn');
      if (!email) {
        // User opened the link on a different device or cleared local storage.
        // You might prompt them for their email again.
        email = prompt('Please provide your email for confirmation:');
        if (!email) {
          alert('Email is required to complete sign-in.');
          return;
        }
      }

      try {
        await signInWithEmailLink(auth, email, window.location.href);
        localStorage.removeItem('emailForSignIn'); // Clear the stored email
        // alert('Successfully signed in!');
        // Redirect to a protected page or update UI
        router.replace('/');
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('Error signing in with magic link:', message);
        alert(`Failed to sign in: ${message}`);
      }
    }
  }

  useEffect(() => {
    handleMagicLinkSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={styles.container}>
      <h1 className={styles.heading}>Setting things up...</h1>
      <p className={styles.description}>
        Solve daily Sudoku puzzles, earn points, and compete with friends and
        other players worldwide.
      </p>
    </section>
  );
};

export default FinishSignInPage;
