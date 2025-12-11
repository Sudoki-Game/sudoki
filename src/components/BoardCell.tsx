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
  isHint: boolean;
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
  isHint,
  ...props
}: BoardCellProps) => {
  const isImmutable = isDisabled || isFixed || isHint;

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { cell: { row, col } },
    disabled: isImmutable
  });

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
        isHint={isHint}
        isOver={isOver}
      />
    </Draggable>
  );
};

export default BoardCell;
