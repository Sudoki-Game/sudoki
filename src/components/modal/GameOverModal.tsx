import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
import Image from 'next/image';
import { MAX_LIVES } from '@/util/constants';
import styles from './GameOverModal.module.css';
import modalStyles from './Modal.module.css';
import Button from '../ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getCurrentMatch } from '@/util/localStorage';
import { useEffect, useState } from 'react';
import { UserStats } from '@/types';

interface GameOverModalProps {
  onClose: () => void;
}

const GameOverModal = ({ onClose }: GameOverModalProps) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const { user, getUserData } = useAuth();
  const { openModal } = useModalRouter();
  const router = useRouter();

  useEffect(() => {
    getUserData().then((res) => {
      setUserStats(res);
    });
  }, [getUserData]);

  const currentMatch = getCurrentMatch();

  if (userStats == null || currentMatch == null) return null;

  return (
    <Modal className={styles.gameoverModal} onClose={onClose}>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Day {userStats.dailyStreak ?? 0}</h2>

        {currentMatch?.gameStatus === 'win' ? (
          <Image
            className={styles.stateImage}
            src={'/game/you-win-text.png'}
            alt={'You Win!'}
            loading={'eager'}
            height={84}
            width={328}
          />
        ) : (
          <Image
            className={styles.stateImage}
            src={'/game/game-over-text.png'}
            alt={'Game Over!'}
            loading={'eager'}
            height={70}
            width={352}
          />
        )}

        <div className={styles.livesContainer}>
          {Array.from({ length: MAX_LIVES }).map((_, i) =>
            i < (currentMatch?.livesRemaining ?? 0) ? (
              <Image
                key={`heart-${i}`}
                src={'/game/heart.svg'}
                alt={'Heart'}
                height={48}
                width={48}
              />
            ) : (
              <Image
                key={`heart-${i}`}
                src={'/game/heart-empty.svg'}
                alt={'Empty Heart'}
                height={48}
                width={48}
              />
            )
          )}
        </div>

        <section className={styles.statContainer}>
          <span className={styles.stat}>Your Score</span>
          <span className={styles.statNumerical}>{currentMatch?.score ?? 0}</span>

          <span className={styles.stat}>Streak Bonus</span>
          <span className={styles.statNumerical}>{currentMatch?.streakBonus ?? 0}</span>

          <hr />

          <span className={styles.stat}>Personal Best</span>
          <span className={styles.statNumerical}>{userStats?.personalBestScore ?? 0}</span>

          <hr />

          <span className={styles.stat}>Total Score</span>
          <span className={styles.statNumerical}>{userStats?.combinedScore ?? 0}</span>
        </section>

        {/* <button disabled className='button button--ok button--fill button--lg' type='button'>
          Leaderboard
        </button> */}

        {user ? null : (
          <div className={styles.registerCTA}>
            <p>Want to see your score on the leaderboard?</p>
            <Button
              onClick={() => router.push('/login')}
              fill
              size={'lg'}
              variant={'ok'}
              type='button'
            >
              Create an Account
            </Button>
          </div>
        )}

        <Button
          disabled={currentMatch?.gameStatus !== 'lose'}
          fill
          size='lg'
          type='button'
          onClick={() => openModal('solution')}
        >
          View Solution
        </Button>
      </div>
    </Modal>
  );
};

export default GameOverModal;
