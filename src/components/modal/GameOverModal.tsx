import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
import { useSudoku } from '@/context/SudokuContext';
import Image from 'next/image';
import { MAX_LIVES } from '@/util/constants';
import styles from './GameOverModal.module.css';
import modalStyles from './Modal.module.css';
import Button from '../ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const GameOverModal = () => {
  const { user } = useAuth();
  const { game } = useSudoku();
  const { openModal } = useModalRouter();
  const router = useRouter();

  return (
    <Modal className={styles.gameoverModal}>
      <div className={modalStyles.content}>
        {game.status === 'win' ? (
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
            i < game.lives ? (
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
          <span className={styles.statNumerical}>{game.score}</span>
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
          disabled={game.status !== 'lose'}
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
