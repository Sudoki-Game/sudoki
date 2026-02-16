import { fireEvent, render, screen } from '@testing-library/react';
import { useDroppable } from '@dnd-kit/core';
import BoardCell from '../BoardCell';

jest.mock('@dnd-kit/core', () => ({
  useDroppable: jest.fn(),
}));

const sudokuCellMock = jest.fn();
const draggableCellMock = jest.fn();

jest.mock('../SudokuCell', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'button'> & {
    cellValue?: number | null;
    'data-testid'?: string;
  }) => {
    sudokuCellMock(props);
    return (
      <button
        type='button'
        data-testid={props['data-testid'] || 'sudoku-cell'}
        onClick={props.onClick}
      >
        {props.cellValue}
      </button>
    );
  },
}));

jest.mock('../DraggableCell', () => ({
  __esModule: true,
  default: (props: {
    id: string;
    disabled: boolean;
    title?: string;
    cellProps: { onClick?: () => void; cellValue?: number | null };
  }) => {
    draggableCellMock(props);
    return (
      <button
        type='button'
        data-testid={props.id}
        onClick={props.cellProps.onClick}
        disabled={props.disabled}
      >
        {props.cellProps.cellValue}
      </button>
    );
  },
}));

describe('BoardCell', () => {
  const setNodeRef = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDroppable as jest.Mock).mockReturnValue({
      setNodeRef,
      isOver: false,
    });
  });

  function renderBoardCell(overrides: Partial<React.ComponentProps<typeof BoardCell>> = {}) {
    const props: React.ComponentProps<typeof BoardCell> = {
      row: 1,
      col: 2,
      cellValue: null,
      disabled: false,
      isSelected: false,
      isRelated: false,
      isConflicting: false,
      isFixed: false,
      isAutoSolved: false,
      handleClick: jest.fn(),
      ...overrides,
    };

    render(<BoardCell {...props} />);
    return props;
  }

  it('renders SudokuCell branch for empty value and wires click', () => {
    const props = renderBoardCell({ cellValue: null });

    const rendered = screen.getByTestId('cell-1-2');
    expect(rendered).toBeInTheDocument();

    fireEvent.click(rendered);
    expect(props.handleClick).toHaveBeenCalledTimes(1);
    expect(draggableCellMock).not.toHaveBeenCalled();
    expect(sudokuCellMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cell-1-2',
        title: '1-2',
        cellValue: null,
        onClick: props.handleClick,
      }),
    );
  });

  it('renders DraggableCell branch for filled value', () => {
    const props = renderBoardCell({ cellValue: 7 });

    const rendered = screen.getByTestId('cell-1-2');
    expect(rendered).toBeInTheDocument();
    fireEvent.click(rendered);

    expect(draggableCellMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cell-1-2',
        title: '1-2',
        disabled: false,
        cellProps: expect.objectContaining({
          cellValue: 7,
          onClick: props.handleClick,
        }),
      }),
    );
  });

  it('disables droppable behavior when cell is immutable', () => {
    renderBoardCell({ disabled: true });
    expect(useDroppable).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cell-1-2',
        disabled: true,
      }),
    );

    renderBoardCell({ disabled: false, isFixed: true });
    expect(useDroppable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        disabled: true,
      }),
    );

    renderBoardCell({ disabled: false, isFixed: false, isAutoSolved: true });
    expect(useDroppable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        disabled: true,
      }),
    );
  });

  it('passes isOver state from droppable into rendered cell props', () => {
    (useDroppable as jest.Mock).mockReturnValue({
      setNodeRef,
      isOver: true,
    });

    renderBoardCell({ cellValue: 9 });

    expect(draggableCellMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cellProps: expect.objectContaining({ isOver: true }),
      }),
    );
  });
});
