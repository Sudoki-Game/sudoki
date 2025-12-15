import { useDroppable } from '@dnd-kit/core';
import DraggableCell from './DraggableCell';
import SudokuCell from './SudokuCell';

type BoardCellProps = {
  row: number;
  col: number;
  cellValue: number | null;
  disabled: boolean;
  isSelected: boolean;
  isRelated: boolean;
  isConflicting: boolean;
  isFixed: boolean;
  isAutoSolved: boolean;
  handleClick: () => void;
} & React.ComponentProps<'div'>;

const BoardCell = ({
  row,
  col,
  cellValue,
  disabled,
  isFixed,
  isConflicting,
  isSelected,
  isRelated,
  isAutoSolved,
  handleClick
}: BoardCellProps) => {
  const isImmutable = disabled || isFixed || isAutoSolved;

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { cell: { row, col } },
    disabled: isImmutable
  });

  // If empty, only show drop-zone
  if (cellValue == null) {
    return (
      <SudokuCell
        ref={setDroppableRef}
        id={`cell-${row}-${col}`}
        data-testid={`cell-${row}-${col}`}
        title={`${row}-${col}`}
        cellValue={cellValue}
        isSelected={isSelected}
        isRelated={isRelated}
        isConflicting={isConflicting}
        isFixed={isFixed}
        isAutoSolved={isAutoSolved}
        isOver={isOver}
        onClick={handleClick}
      />
    );
  }

  return (
    <DraggableCell
      ref={setDroppableRef}
      id={`cell-${row}-${col}`}
      data-testid={`cell-${row}-${col}`}
      data={{ cell: { row, col, value: cellValue } }}
      title={`${row}-${col}`}
      disabled={false}
      cellProps={{
        cellValue,
        isSelected,
        isRelated,
        isConflicting,
        isFixed,
        isAutoSolved,
        isOver,
        onClick: handleClick
      }}
    />
  );
};

export default BoardCell;
