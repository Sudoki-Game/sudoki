import { useSudokuGame } from '@/game/context/SudokuGameContext';
import Image from 'next/image';
import styles from './SudokuControls.module.css';
import DraggableCell from './DraggableCell';
import { playSound } from '@/util/sound';
import Button from '@/ui/components/Button';

const SudokuControls = () => {
  const { game, isReady, isPaused, autoSolve, updateCell } = useSudokuGame();

  const disabled = isPaused || game.status !== 'playing';

  // Click to update current selection
  const handleClick = (value: number) => {
    if (game.selected.col != null && game.selected.row != null) {
      updateCell(game.selected.row, game.selected.col, value);
      playSound('/game/audio/metronome.mp3', { pitch: 1.8 });
    }
  };

  // Will scale into view when ready
  if (!isReady) return null;

  return (
    <div className={styles.controls}>
      <div className={styles.numlist}>
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
              isOver: false,
              onClick: () => handleClick(i + 1)
            }}
          />
        ))}

        <Button
          disabled={disabled}
          title='Auto-Solve (-1 Life)'
          variant='warning'
          size={'icon'}
          onClick={autoSolve}
        >
          <Image src={'/game/auto-solve.svg'} alt={'Auto-Solve Icon'} height={28} width={28} />
        </Button>
      </div>
    </div>
  );
};

export default SudokuControls;
