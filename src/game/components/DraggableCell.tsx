/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import { useDraggable } from '@dnd-kit/core';
import styles from './DraggableCell.module.css';
import SudokuCell, { SudokuCellProps } from './SudokuCell';
import clsx from 'clsx';

type DraggableProps = {
  id: string;
  data: Record<string, unknown>;
  disabled: boolean;
  cellProps: SudokuCellProps;
} & React.ComponentProps<'div'>;

const DraggableCell = ({
  id,
  data,
  disabled,
  cellProps,
  ref,
  ...props
}: DraggableProps) => {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: id,
    data: data,
    disabled: disabled,
  });

  const style = isDragging ? { opacity: 0 } : undefined;

  return (
    <div
      ref={ref}
      className={clsx(styles.draggable, props.className)}
      {...props}
    >
      <SudokuCell
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        disabled={disabled}
        {...cellProps}
      />

      {isDragging && (
        <div
          className={styles.placeholder}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            border: 'none',
            borderRadius: '0.75rem',
            opacity: 0.3,
            background: 'var(--shadow)',
            boxShadow: 'inset 0 0.375rem 0 var(--shadow)',
          }}
        />
      )}
    </div>
  );
};

export default DraggableCell;
