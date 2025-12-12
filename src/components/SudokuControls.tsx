import { useSudoku } from '@/context/SudokuContext';
import Image from 'next/image';
import './SudokuControls.css';
import DraggableCell from './DraggableCell';

const SudokuControls = () => {
  const { game, isReady, isPaused, autoSolve } = useSudoku();

  const disabled = isPaused || game.status !== 'playing';

  // Will scale into view when ready
  if (!isReady) return null;

  return (
    <div className={`sudoku__controls}`}>
      <div className='sudoku__controls-numlist'>
        {Array.from({ length: 9 }).map((_, i) => (
          <DraggableCell
            key={i}
            id={`draggable-${i + 1}`}
            disabled={disabled}
            data={{ cell: { value: i + 1 } }}
            // tabIndex={!isDisabled ? 0 : -1}
            data-testid={`draggable-${i + 1}`}
            cellProps={{
              cellValue: i + 1,
              disabled: disabled,
              isSelected: false,
              isRelated: false,
              isConflicting: false,
              isFixed: false,
              isAutoSolved: false,
              isOver: false
            }}
          />
        ))}

        <button
          disabled={disabled}
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
