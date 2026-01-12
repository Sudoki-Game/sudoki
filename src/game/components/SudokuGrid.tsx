/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import SudokuCell from './SudokuCell';
import styles from './SudokuGrid.module.css';
import { GameState } from '@/game/types';
import BoardCell from './BoardCell';

type SudokuGridProps = {
  game: GameState;
  showSolution: boolean;
  isReady: boolean;
  handleClick?: (row: number, col: number) => void;
} & React.ComponentProps<'div'>;

/**
 * Individual cell renderer for reusability
 */
interface CellConfig {
  row: number;
  col: number;
  blockRow: number;
  blockCol: number;
  blockIdx: number;
  cellIdx: number;
}

/**
 * Renders the 9x9 Sudoku grid as 3x3 blocks of cells.
 * Each cell is rendered as a SudokuCell component.
 * Handles both the live game view and the solution view.
 *
 * @param showSolution - If true, displays the solution grid; otherwise, displays the current game board.
 * @returns The rendered Sudoku grid as a set of blocks and cells.
 */
const SudokuGrid = ({
  game,
  isReady,
  showSolution,
  handleClick,
  ref,
}: SudokuGridProps) => {
  /**
   * Check if a given cell is selected.
   */
  const isSelected = (row: number, col: number) =>
    game.selected.row === row && game.selected.col === col;

  const isPlaying = game.status === 'playing';

  // Calculate cell configs
  const cellConfigs: CellConfig[] = [];
  for (let blockIdx = 0; blockIdx < 9; blockIdx++) {
    const blockRow = Math.floor(blockIdx / 3);
    const blockCol = blockIdx % 3;
    for (let cellIdx = 0; cellIdx < 9; cellIdx++) {
      cellConfigs.push({
        blockIdx,
        cellIdx,
        blockRow,
        blockCol,
        row: blockRow * 3 + Math.floor(cellIdx / 3),
        col: blockCol * 3 + (cellIdx % 3),
      });
    }
  }

  /**
   * Get cell properties for live game view
   */
  const getCellPropsLive = (config: CellConfig) => {
    const { row, col } = config;
    const cellKey = `${row},${col}`;
    const isAutoSolved = game.autoSolves.has(cellKey);
    const isFixed = !!game.originalBoard[row][col];
    const isImmutable = !isPlaying || isFixed || isAutoSolved;

    return { cellKey, isAutoSolved, isFixed, isImmutable };
  };

  /**
   * Render a single cell
   */
  const renderCell = (config: CellConfig) => {
    const { row, col, blockIdx, cellIdx } = config;

    if (showSolution) {
      const { isAutoSolved, isFixed } = getCellPropsLive(config);
      return (
        <SudokuCell
          key={`${blockIdx}-${cellIdx}`}
          cellValue={game.solution[row][col]}
          disabled={true}
          isSelected={
            !isAutoSolved &&
            !isFixed &&
            game.board[row][col] === game.solution[row][col]
          }
          isRelated={false}
          isConflicting={false}
          isFixed={isFixed}
          isAutoSolved={isAutoSolved}
          isOver={false}
        />
      );
    }

    const { cellKey, isAutoSolved, isFixed, isImmutable } =
      getCellPropsLive(config);

    // Immutable cells
    if (isImmutable) {
      return (
        <SudokuCell
          key={`${blockIdx}-${cellIdx}`}
          id={`cell-${row}-${col}`}
          data-testid={`cell-${row}-${col}`}
          title={`${row}-${col}`}
          cellValue={game.board[row][col]}
          disabled={!isPlaying}
          isSelected={isSelected(row, col)}
          isRelated={game.highlights.has(cellKey)}
          isConflicting={game.conflicts.has(cellKey)}
          isFixed={isFixed}
          isAutoSolved={isAutoSolved}
          isOver={false}
          onClick={() => handleClick?.(row, col)}
        />
      );
    }

    // Mutable cells
    return (
      <BoardCell
        key={`${blockIdx}-${cellIdx}`}
        row={row}
        col={col}
        cellValue={game.board[row][col]}
        disabled={!isPlaying}
        isSelected={isSelected(row, col)}
        isRelated={game.highlights.has(cellKey)}
        isConflicting={game.conflicts.has(cellKey)}
        isFixed={isFixed}
        isAutoSolved={isAutoSolved}
        handleClick={() => handleClick?.(row, col)}
      />
    );
  };

  // Will scale into view when ready
  if (!isReady) {
    const blocks = Array.from({ length: 9 }).map((_, blockIdx) => (
      <div key={`block-${blockIdx}`} className={styles.block}>
        {cellConfigs
          .filter((c) => c.blockIdx === blockIdx)
          .map((c) => (
            <SudokuCell
              key={`${c.row}-${c.col}`}
              id={`cell-${c.row}-${c.col}`}
              data-testid={`cell-${c.row}-${c.col}`}
              title={`${c.row}-${c.col}`}
              cellValue={game.board[c.row][c.col]}
              disabled={true}
              isSelected={false}
              isRelated={false}
              isConflicting={false}
              isOver={false}
              isFixed={false}
              isAutoSolved={false}
            />
          ))}
      </div>
    ));

    return (
      <div ref={ref} className={styles.grid}>
        {blocks}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`${styles.grid} ${showSolution ? styles.gridShowSolution : ''}`}
    >
      {Array.from({ length: 9 }).map((_, blockIdx) => (
        <div key={`block-${blockIdx}`} className={styles.block}>
          {cellConfigs
            .filter((c) => c.blockIdx === blockIdx)
            .map((config) => renderCell(config))}
        </div>
      ))}
    </div>
  );
};

export default SudokuGrid;
