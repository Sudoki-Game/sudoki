import { fireEvent, render, screen } from '@testing-library/react';
import SudokuCell from '../SudokuCell';

describe('SudokuCell', () => {
  function renderCell(overrides: Partial<React.ComponentProps<typeof SudokuCell>> = {}) {
    const props: React.ComponentProps<typeof SudokuCell> = {
      cellValue: 5,
      isSelected: false,
      isRelated: false,
      isConflicting: false,
      isFixed: false,
      isAutoSolved: false,
      isOver: false,
      onClick: jest.fn(),
      ...overrides,
    };

    render(<SudokuCell data-testid='sudoku-cell' {...props} />);
    return props;
  }

  it('renders the provided cell value', () => {
    renderCell({ cellValue: 8 });

    expect(screen.getByTestId('sudoku-cell')).toHaveTextContent('8');
  });

  it('renders empty content for null value', () => {
    renderCell({ cellValue: null });

    expect(screen.getByTestId('sudoku-cell')).toBeEmptyDOMElement();
  });

  it('forwards button attributes and click handler', () => {
    const onClick = jest.fn();

    renderCell({
      onClick,
      disabled: false,
      title: 'cell-title',
      className: 'custom-class',
    });

    const cell = screen.getByTestId('sudoku-cell');

    expect(cell).toHaveAttribute('type', 'button');
    expect(cell).toHaveAttribute('title', 'cell-title');
    expect(cell).not.toBeDisabled();

    fireEvent.click(cell);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders through different visual-state combinations', () => {
    const { rerender } = render(
      <SudokuCell
        data-testid='sudoku-cell'
        cellValue={1}
        isSelected={true}
        isRelated={false}
        isConflicting={false}
        isFixed={false}
        isAutoSolved={false}
        isOver={false}
      />,
    );

    expect(screen.getByTestId('sudoku-cell')).toBeInTheDocument();

    rerender(
      <SudokuCell
        data-testid='sudoku-cell'
        cellValue={2}
        isSelected={false}
        isRelated={true}
        isConflicting={false}
        isFixed={true}
        isAutoSolved={false}
        isOver={true}
      />,
    );

    expect(screen.getByTestId('sudoku-cell')).toBeInTheDocument();

    rerender(
      <SudokuCell
        data-testid='sudoku-cell'
        cellValue={3}
        isSelected={false}
        isRelated={false}
        isConflicting={true}
        isFixed={false}
        isAutoSolved={true}
        isOver={false}
      />,
    );

    expect(screen.getByTestId('sudoku-cell')).toBeInTheDocument();
  });
});
