import { useDroppable } from '@dnd-kit/core';
import Draggable from './Draggable';
import SudokuCell from './SudokuCell';

type BoardCellProps = {
  row: number;
  col: number;
  value: number | null;
  isDisabled: boolean;
  isSelected: boolean;
  isRelated: boolean;
  isConflicting: boolean;
  isFixed: boolean;
  isAutoSolved: boolean;
} & React.ComponentProps<'div'>;

const BoardCell = ({
  row,
  col,
  value,
  isDisabled,
  isFixed,
  isConflicting,
  isSelected,
  isRelated,
  isAutoSolved,
  ...props
}: BoardCellProps) => {
  const isImmutable = isDisabled || isFixed || isAutoSolved;

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { cell: { row, col } },
    disabled: isImmutable
  });

  if (isAutoSolved) console.log('adasad');

  return (
    <Draggable
      ref={setDroppableRef}
      id={`cell-${row}-${col}`}
      data-testid={`cell-${row}-${col}`}
      data={{ cell: { row, col, value } }}
      isDisabled={isImmutable || value == null}
      title={`${row}-${col}`}
      tabIndex={isImmutable ? -1 : 0}
      {...props}
    >
      <SudokuCell
        value={value}
        isDisabled={isDisabled}
        isSelected={isSelected}
        isRelated={isRelated}
        isConflicting={isConflicting}
        isFixed={isFixed}
        isAutoSolved={isAutoSolved}
        isOver={isOver}
      />
    </Draggable>
  );
};

export default BoardCell;
