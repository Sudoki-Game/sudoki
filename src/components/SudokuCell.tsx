/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import clsx from 'clsx';
import './SudokuCell.css';

export type SudokuCellProps = {
  cellValue: number | null;
  isSelected: boolean;
  isRelated: boolean;
  isConflicting: boolean;
  isFixed: boolean;
  isAutoSolved: boolean;
  isOver: boolean;
} & React.ComponentProps<'button'>;

/**
 * A single cell in the Sudoku board.
 */
const SudokuCell = ({
  cellValue,
  isFixed,
  isConflicting,
  isSelected,
  isRelated,
  isAutoSolved,
  isOver,
  ref,
  ...props
}: SudokuCellProps) => {
  const classNames = clsx('sudoku__cell', {
    'sudoku__cell--ok': isSelected,
    'sudoku__cell--pre-filled': isFixed && !isRelated,
    'sudoku__cell--empty': !isRelated && cellValue == null,
    'sudoku__cell--warning': !isSelected && isAutoSolved,
    'sudoku__cell--danger': !isSelected && isConflicting,
    'sudoku__cell--highlight': !isConflicting && !isSelected && (isRelated || isOver),
    'sudoku__cell--no-outline': isRelated && !isSelected
  });

  return (
    <button ref={ref} type='button' className={classNames} {...props}>
      {cellValue}
    </button>
  );
};

export default SudokuCell;
