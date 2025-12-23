import LoginForm from '@/components/form/LoginForm';
import styles from './page.module.css';

const LoginPage = async () => {
  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Start climbing the Sudoki leaderboard!</h1>

        <p className={styles.description}>
          Solve daily Sudoku puzzles, earn points, and compete with friends and other players
          worldwide.
        </p>
      </header>
      <LoginForm />
    </section>
  );
};

export default LoginPage;
