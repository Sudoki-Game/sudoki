/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */
'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import Draggable from './Draggable';
import clsx from 'clsx';
import './SudokuCell.css';

interface SudokuCellProps {
  row: number;
  col: number;
  value: number | null;
  isDisabled: boolean;
  isSelected: boolean;
  isRelated: boolean;
  isConflicting: boolean;
  isFixed: boolean;
  isHint: boolean;
  onClick: (row: number, col: number) => void;
}

/**
 * A single cell in the Sudoku board.
 * Handles both draggable and droppable behaviors for drag-and-drop.
 * @returns
 */
const SudokuCell = ({
  row,
  col,
  value,
  isDisabled,
  isFixed,
  isConflicting,
  isSelected,
  isRelated,
  isHint,
  onClick
}: SudokuCellProps) => {
  const isImmutable = isDisabled || isFixed || isHint;

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { cell: { row, col } },
    disabled: isImmutable,
  });

  const classNames = clsx('sudoku__cell', {
    'sudoku__cell--ok': isSelected,
    'sudoku__cell--disabled': isDisabled,
    'sudoku__cell--pre-filled': isFixed && !isRelated,
    'sudoku__cell--empty': !isRelated && value == null,
    'sudoku__cell--warning': !isSelected && isHint,
    'sudoku__cell--danger': !isSelected && isConflicting,
    'sudoku__cell--highlight': !isConflicting && !isSelected && (isRelated || isOver),
    'sudoku__cell--no-outline': isRelated && !isSelected
  });

  return (
    <Draggable
      ref={setDroppableRef}
      className={classNames}
      id={`cell-${row}-${col}`}
      data-testid={`cell-${row}-${col}`}
      data={{ cell: { row, col, value } }}
      isDisabled={isImmutable || value == null}
      onClick={() => !isDisabled && onClick(row, col)}
      title={`${row}-${col}`}
      tabIndex={isImmutable ? -1 : 0}
    >
      {value}
    </Draggable>
  );
};

export default memo(
  SudokuCell,
  (prev, next) =>
    prev.value === next.value &&
    prev.isDisabled === next.isDisabled &&
    prev.isFixed === next.isFixed &&
    prev.isConflicting === next.isConflicting &&
    prev.isSelected === next.isSelected &&
    prev.isRelated === next.isRelated &&
    prev.isHint === next.isHint
);
