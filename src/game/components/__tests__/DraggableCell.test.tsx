import { render, screen } from '@testing-library/react';
import DraggableCell from '../DraggableCell';
import { useDraggable } from '@dnd-kit/core';

jest.mock('@dnd-kit/core', () => ({
  useDraggable: jest.fn(),
}));

jest.mock('../SudokuCell', () => ({
  __esModule: true,
  default: ({ style, disabled }: { style?: { opacity?: number }; disabled: boolean }) => (
    <button
      type='button'
      data-testid='draggable-sudoku-cell'
      data-opacity={style?.opacity ?? 'none'}
      data-disabled={String(disabled)}
    />
  ),
}));

describe('DraggableCell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders draggable cell without placeholder when not dragging', () => {
    (useDraggable as jest.Mock).mockReturnValue({
      setNodeRef: jest.fn(),
      attributes: { 'data-drag': 'x' },
      listeners: {},
      isDragging: false,
    });

    const { container } = render(
      <DraggableCell
        id='d1'
        data={{ cell: { row: 0, col: 0, value: 1 } }}
        disabled={false}
        cellProps={{
          cellValue: 1,
          isSelected: false,
          isRelated: false,
          isConflicting: false,
          isFixed: false,
          isAutoSolved: false,
          isOver: false,
        }}
      />,
    );

    expect(screen.getByTestId('draggable-sudoku-cell')).toHaveAttribute(
      'data-opacity',
      'none',
    );
    expect(container.querySelector('div[style*="position: absolute"]')).toBeNull();
  });

  it('renders placeholder and hidden source style when dragging', () => {
    (useDraggable as jest.Mock).mockReturnValue({
      setNodeRef: jest.fn(),
      attributes: {},
      listeners: {},
      isDragging: true,
    });

    const { container } = render(
      <DraggableCell
        id='d2'
        data={{ cell: { row: 0, col: 1, value: 2 } }}
        disabled={false}
        cellProps={{
          cellValue: 2,
          isSelected: false,
          isRelated: false,
          isConflicting: false,
          isFixed: false,
          isAutoSolved: false,
          isOver: false,
        }}
      />,
    );

    expect(screen.getByTestId('draggable-sudoku-cell')).toHaveAttribute(
      'data-opacity',
      '0',
    );
    expect(container.querySelector('div[style*="position: absolute"]')).toBeTruthy();
  });
});
