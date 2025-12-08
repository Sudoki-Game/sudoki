/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */
'use client';

import { useDraggable } from '@dnd-kit/core';
import './Draggable.css';

type DraggableProps = {
  id: string;
  data: Record<string, unknown>;
  isDisabled: boolean;
} & React.ComponentProps<'div'>;

const Draggable = ({ id, data, isDisabled, children, ref, ...props }: DraggableProps) => {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: id,
    data: data,
    disabled: isDisabled
  });

  const style = isDragging ? { opacity: 0 } : undefined;

  return (
    <div ref={ref} className='draggable'>
      <div
        ref={setNodeRef}
        className={'draggable__wrapper'}
        style={style}
        {...attributes}
        {...listeners}
        tabIndex={props.tabIndex}
      >
        <div {...props} tabIndex={-1}>
          {children}
        </div>
      </div>

      {isDragging && <div className='draggable__placeholder' />}
    </div>
  );
};

export default Draggable;
