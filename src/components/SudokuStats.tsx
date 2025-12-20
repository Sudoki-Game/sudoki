import Image from 'next/image';
import { MAX_LIVES } from '@/util/constants';
import styles from './SudokuStats.module.css';

interface SudokuStatsProps {
  score: number;
  lives: number;
}

const SudokuStats = ({ score, lives }: SudokuStatsProps) => {
  return (
    <div className={styles.stats}>
      <div className={styles.statContainer}>
        <span className={styles.stat}>Score</span>
        <span className={`${styles.stat} ${styles.statNumerical}`}>{score}</span>
      </div>

      <div className={styles.livesContainer}>
        {Array.from({ length: MAX_LIVES }).map((_, i) =>
          i < lives ? (
            <Image
              key={`heart-${i}`}
              src={'/game/heart.svg'}
              alt={'Heart'}
              height={24}
              width={24}
            />
          ) : (
            <Image
              key={`heart-${i}`}
              src={'/game/heart-empty.svg'}
              alt={'Empty Heart'}
              height={24}
              width={24}
            />
          )
        )}
      </div>
    </div>
  );
};

export default SudokuStats;
