'use client';

import OnboardingForm from '@/auth/components/OnboardingForm';
import styles from './page.module.css';

const OnboardingPage = () => {
  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>A Challenger Arises!</h1>
        <p className={styles.description}>
          Set Your Username and Decide How You&apos;ll Appear on the Global
          Leaderboard.
        </p>
      </header>
      <OnboardingForm />
    </section>
  );
};

export default OnboardingPage;
