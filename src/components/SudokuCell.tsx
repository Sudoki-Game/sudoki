/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import clsx from 'clsx';
import './SudokuCell.css';

type SudokuCellProps = {
  value: number | null;
  isDisabled: boolean;
  isSelected: boolean;
  isRelated: boolean;
  isConflicting: boolean;
  isFixed: boolean;
  isAutoSolved: boolean;
  isOver: boolean;
} & React.ComponentProps<'div'>;

/**
 * A single cell in the Sudoku board.
 */
const SudokuCell = ({
  value,
  isDisabled,
  isFixed,
  isConflicting,
  isSelected,
  isRelated,
  isAutoSolved,
  isOver,
  ...props
}: SudokuCellProps) => {
  const classNames = clsx('sudoku__cell', {
    'sudoku__cell--ok': isSelected,
    'sudoku__cell--disabled': isDisabled,
    'sudoku__cell--pre-filled': isFixed && !isRelated,
    'sudoku__cell--empty': !isRelated && value == null,
    'sudoku__cell--warning': !isSelected && isAutoSolved,
    'sudoku__cell--danger': !isSelected && isConflicting,
    'sudoku__cell--highlight': !isConflicting && !isSelected && (isRelated || isOver),
    'sudoku__cell--no-outline': isRelated && !isSelected
  });

  return (
    <div className={classNames} {...props}>
      {value}
    </div>
  );
};

export default SudokuCell;
