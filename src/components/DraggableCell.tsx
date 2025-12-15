/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import { useDraggable } from '@dnd-kit/core';
import './DraggableCell.css';
import SudokuCell, { SudokuCellProps } from './SudokuCell';
import clsx from 'clsx';

type DraggableProps = {
  id: string;
  data: Record<string, unknown>;
  disabled: boolean;
  cellProps: SudokuCellProps;
} & React.ComponentProps<'div'>;

const DraggableCell = ({ id, data, disabled, cellProps, ref, ...props }: DraggableProps) => {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: id,
    data: data,
    disabled: disabled
  });

  const style = isDragging ? { opacity: 0 } : undefined;

  return (
    <div ref={ref} className={clsx(['draggable', props.className])} {...props}>
      <SudokuCell
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        disabled={disabled}
        {...cellProps}
      />

      {isDragging && <div className='draggable__placeholder' />}
    </div>
  );
};

export default DraggableCell;
