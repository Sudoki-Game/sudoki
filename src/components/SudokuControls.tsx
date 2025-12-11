import { useSudoku } from '@/context/SudokuContext';
import Draggable from './Draggable';
import HintIcon from '../../public/game/hint.svg';
import Image from 'next/image';
import './SudokuControls.css';

const SudokuControls = () => {
  const { game, isReady, addHint } = useSudoku();

  const isPlaying = game.status === 'playing';

  // Will scale into view when ready
  if (!isReady) return null;

  return (
    <div className={`sudoku__controls}`}>
      <div className='sudoku__controls-numlist'>
        {Array.from({ length: 9 }).map((_, i) => (
          <Draggable
            key={i}
            id={`draggable-${i + 1}`}
            isDisabled={!isPlaying}
            className={`sudoku__cell ${!isPlaying ? 'sudoku__cell--disabled' : ''}`}
            data={{ cell: { value: i + 1 } }}
            tabIndex={isPlaying ? 0 : -1}
            data-testid={`draggable-${i + 1}`}
          >
            {i + 1}
          </Draggable>
        ))}

        <button
          disabled={!isPlaying}
          aria-label='Show Hint'
          className='button button--warning'
          onClick={addHint}
        >
          <Image src={HintIcon} alt={'Hint'} height={28} />
        </button>
      </div>
    </div>
  );
};

export default SudokuControls;
