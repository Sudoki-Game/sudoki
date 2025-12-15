import { useModalRouter } from '@/context/ModalRouterContext';
import Modal from './Modal';
import { useSudoku } from '@/context/SudokuContext';
import Image from 'next/image';
import { MAX_LIVES } from '@/util/constants';
import './GameOverModal.css';

const GameOverModal = () => {
  const { game } = useSudoku();
  const { openModal } = useModalRouter();

  return (
    <Modal className='gameover-modal'>
      <div className='modal__content'>
        {game.status === 'win' ? (
          <Image
            className='gameover-modal__state-image'
            src={'/game/you-win-text.png'}
            alt={'You Win!'}
            height={84}
            width={328}
          />
        ) : (
          <Image
            className='gameover-modal__state-image'
            src={'/game/game-over-text.png'}
            alt={'Game Over!'}
            height={70}
            width={352}
          />
        )}

        <div className='gameover-modal__lives-container'>
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

        <section className='gameover-modal__stat-container'>
          <h3>Your Score</h3>
          <span className='gameover-modal__stat--numerical'>{game.score}</span>
        </section>

        {/* <button disabled className='button button--ok button--fill button--lg' type='button'>
          Leaderboard
        </button> */}

        <button
          disabled={game.status !== 'lose'}
          className='button button--fill button--lg'
          type='button'
          onClick={() => openModal('solution')}
        >
          View Solution
        </button>
      </div>
    </Modal>
  );
};

export default GameOverModal;
