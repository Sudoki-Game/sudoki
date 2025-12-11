/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

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
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} {...props}>
        {children}
      </div>

      {isDragging && <div className='draggable__placeholder' />}
    </div>
  );
};

export default Draggable;
