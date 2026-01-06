/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import clsx from 'clsx';
import { cva } from 'class-variance-authority';
import styles from './SudokuCell.module.css';

/**
 * A single cell in the Sudoku board.
 */
const sudokuCellVariants = cva(styles.cell, {
  variants: {
    selected: { true: styles.cellOk },
    preFilled: { true: styles.cellPreFilled },
    empty: { true: styles.cellEmpty },
    autoSolved: { true: styles.cellWarning },
    danger: { true: styles.cellDanger },
    highlight: { true: styles.cellHighlight },
    noOutline: { true: styles.cellNoOutline }
  }
});

export type SudokuCellProps = {
  cellValue: number | null;
  isSelected: boolean;
  isRelated: boolean;
  isConflicting: boolean;
  isFixed: boolean;
  isAutoSolved: boolean;
  isOver: boolean;
} & React.ComponentProps<'button'>;

const SudokuCell = ({
  cellValue,
  isFixed,
  isConflicting,
  isSelected,
  isRelated,
  isAutoSolved,
  isOver,
  className,
  ref,
  ...props
}: SudokuCellProps) => {
  const classNames = clsx(
    sudokuCellVariants({
      selected: isSelected,
      preFilled: isFixed && !isRelated,
      empty: !isRelated && cellValue == null,
      autoSolved: !isSelected && isAutoSolved,
      danger: !isSelected && isConflicting,
      highlight: !isConflicting && !isSelected && (isRelated || isOver),
      noOutline: isRelated && !isSelected
    }),
    className
  );

  return (
    <button ref={ref} type='button' className={classNames} {...props}>
      {cellValue}
    </button>
  );
};

export default SudokuCell;
