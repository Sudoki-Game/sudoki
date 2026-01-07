import { useModalRouter } from '@/game/context/ModalRouterContext';
import { useSudokuGame } from '@/game/context/SudokuGameContext';
import Image from 'next/image';
import { MAX_LIVES } from '@/util/constants';
import styles from './GameOverModal.module.css';
import modalStyles from './Modal.module.css';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '@/ui/components/Button';
import Modal from './Modal';

interface GameOverModalProps {
  onClose: () => void;
}

const GameOverModal = ({ onClose }: GameOverModalProps) => {
  const { game } = useSudokuGame();
  const { user } = useAuth();
  const { openModal } = useModalRouter();
  const router = useRouter();

  const isWin = game.status === 'win';
  const isLose = game.status === 'lose';

  if (game.status !== 'win' && game.status !== 'lose') return null;

  return (
    <Modal className={styles.gameoverModal} onClose={onClose}>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Game Over</h2>

        {isWin ? (
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
          disabled={!isLose}
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
