/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import SudokuCell from './SudokuCell';
import './SudokuGrid.css';
import { GameState } from '@/types';
import BoardCell from './BoardCell';

type SudokuGridProps = {
  game: GameState;
  isReady: boolean;
  highlights: Set<string>;
  showSolution: boolean;
  handleClick: (row: number, col: number) => void;
} & React.ComponentProps<'div'>;

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
  highlights,
  showSolution,
  handleClick,
  ref
}: SudokuGridProps) => {
  /**
   * Check if a given cell is selected.
   */
  const isSelected = (row: number, col: number) =>
    game.selected.row === row && game.selected.col === col;

  const isPlaying = game.status === 'playing';

  // Will scale into view when ready
  if (!isReady) return null;

  return (
    <div ref={ref} className={`sudoku__grid ${showSolution ? 'sudoku__grid--show-solution' : ''}`}>
      {Array.from({ length: 9 }).map((_, blockIdx) => {
        const blockRow = Math.floor(blockIdx / 3);
        const blockCol = blockIdx % 3;
        return (
          <div key={blockIdx} className='sudoku__block'>
            {Array.from({ length: 9 }).map((_, cellIdx) => {
              const cellRow = blockRow * 3 + Math.floor(cellIdx / 3);
              const cellCol = blockCol * 3 + (cellIdx % 3);

              const isAutoSolved = game.autoSolves.has(`${cellRow},${cellCol}`);
              const isFixed = !!game.originalBoard[cellRow][cellCol];

              // Solution view
              if (showSolution) {
                return (
                  <SudokuCell
                    key={`${cellRow}-${cellCol}`}
                    cellValue={game.solution[cellRow][cellCol]}
                    disabled={false}
                    isSelected={
                      !isAutoSolved &&
                      !isFixed &&
                      game.board[cellRow][cellCol] === game.solution[cellRow][cellCol]
                    }
                    isRelated={false}
                    isConflicting={false}
                    isFixed={isFixed}
                    isAutoSolved={isAutoSolved}
                    isOver={false}
                  />
                );
              }

              // Live game view
              const isImmutable = !isPlaying || isFixed || isAutoSolved;

              // Only render cell if immutable
              if (isImmutable) {
                return (
                  <SudokuCell
                    key={`${cellRow}-${cellCol}`}
                    id={`cell-${cellRow}-${cellCol}`}
                    data-testid={`cell-${cellRow}-${cellCol}`}
                    title={`${cellRow}-${cellCol}`}
                    cellValue={game.board[cellRow][cellCol]}
                    disabled={!isPlaying}
                    isSelected={isSelected(cellRow, cellCol)}
                    isRelated={highlights.has(`${cellRow},${cellCol}`)}
                    isConflicting={game.conflicts.has(`${cellRow},${cellCol}`)}
                    isFixed={isFixed}
                    isAutoSolved={isAutoSolved}
                    isOver={false}
                    onClick={() => handleClick(cellRow, cellCol)}
                  />
                );
              }

              return (
                <BoardCell
                  key={`${cellRow}-${cellCol}`}
                  row={cellRow}
                  col={cellCol}
                  cellValue={game.board[cellRow][cellCol]}
                  disabled={!isPlaying}
                  isSelected={isSelected(cellRow, cellCol)}
                  isRelated={highlights.has(`${cellRow},${cellCol}`)}
                  isConflicting={game.conflicts.has(`${cellRow},${cellCol}`)}
                  isFixed={isFixed}
                  isAutoSolved={isAutoSolved}
                  handleClick={() => handleClick(cellRow, cellCol)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default SudokuGrid;
