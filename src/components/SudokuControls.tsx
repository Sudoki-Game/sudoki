import { useSudoku } from '@/context/SudokuContext';
import Draggable from './Draggable';
import Image from 'next/image';
import SudokuCell from './SudokuCell';
import './SudokuControls.css';

const SudokuControls = () => {
  const { game, isReady, isPaused, autoSolve } = useSudoku();

  const isDisabled = isPaused || game.status !== 'playing';

  // Will scale into view when ready
  if (!isReady) return null;

  return (
    <div className={`sudoku__controls}`}>
      <div className='sudoku__controls-numlist'>
        {Array.from({ length: 9 }).map((_, i) => (
          <Draggable
            key={i}
            id={`draggable-${i + 1}`}
            isDisabled={isDisabled}
            data={{ cell: { value: i + 1 } }}
            tabIndex={!isDisabled ? 0 : -1}
            data-testid={`draggable-${i + 1}`}
          >
            <SudokuCell
              value={i + 1}
              isDisabled={isDisabled}
              isSelected={false}
              isRelated={false}
              isConflicting={false}
              isFixed={false}
              isAutoSolved={false}
              isOver={false}
            />
          </Draggable>
        ))}

        <button
          disabled={isDisabled}
          title='Auto-Solve (-1 Life)'
          className='button button--warning'
          onClick={autoSolve}
        >
          <Image src={'/game/auto-solve.svg'} alt={'Auto-Solve Icon'} height={28} width={28} />
        </button>
      </div>
    </div>
  );
};

export default SudokuControls;
