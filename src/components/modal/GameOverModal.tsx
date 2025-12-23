import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
import Image from 'next/image';
import { MAX_LIVES } from '@/util/constants';
import styles from './GameOverModal.module.css';
import modalStyles from './Modal.module.css';
import Button from '../ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserData } from '@/lib/firebase/firestore';
import type { MatchData } from '@/lib/firebase/firestore';

const GameOverModal = () => {
  const { user, getUserData, getDailyMatch } = useAuth();
  const { openModal } = useModalRouter();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dailyMatch, setDailyMatch] = useState<MatchData | null>(null);

  useEffect(() => {
    if (user?.uid && getUserData && getDailyMatch) {
      Promise.all([getUserData(), getDailyMatch()]).then(([data, match]) => {
        setUserData(data);
        setDailyMatch(match);
      });
    }
  }, [user?.uid, getUserData, getDailyMatch]);

  return (
    <Modal className={styles.gameoverModal}>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Day {userData?.dailyStreak}</h2>

        {dailyMatch?.gameStatus === 'win' ? (
          <Image
            className={styles.stateImage}
            src={'/game/you-win-text.png'}
            alt={'You Win!'}
            height={84}
            width={328}
          />
        ) : (
          <Image
            className={styles.stateImage}
            src={'/game/game-over-text.png'}
            alt={'Game Over!'}
            height={70}
            width={352}
          />
        )}

        <div className={styles.livesContainer}>
          {Array.from({ length: MAX_LIVES }).map((_, i) =>
            i < (dailyMatch?.livesRemaining ?? 0) ? (
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
          <span className={styles.statNumerical}>{dailyMatch?.score ?? 0}</span>

          <span className={styles.stat}>Daily Streak</span>
          <span className={styles.statNumerical}>{dailyMatch?.streakBonus ?? 0}</span>

          <hr />

          <span className={styles.stat}>Personal Best</span>
          <span className={styles.statNumerical}>{userData?.personalBestScore}</span>

          <hr />

          <span className={styles.stat}>Total Score</span>
          <span className={styles.statNumerical}>{userData?.combinedScore}</span>
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
          disabled={dailyMatch?.gameStatus !== 'lose'}
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
