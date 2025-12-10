/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import { memo } from 'react';
import SudokuCell from './SudokuCell';
import { useSudoku } from '@/context/SudokuContext';
import './SudokuGrid.css';

type SudokuGridProps = {
  showSolution: boolean;
} & React.ComponentProps<'div'>;

/**
 * Renders the 9x9 Sudoku grid as 3x3 blocks of cells.
 * Each cell is rendered as a SudokuCell component.
 * Handles both the live game view and the solution view.
 *
 * @param showSolution - If true, displays the solution grid; otherwise, displays the current game board.
 * @returns The rendered Sudoku grid as a set of blocks and cells.
 */
const SudokuGrid = ({ showSolution, ref }: SudokuGridProps) => {
  const { game, highlights, handleClick } = useSudoku();

  /**
   * Check if a given cell is selected.
   */
  const isSelected = (row: number, col: number) =>
    game.selected.row === row && game.selected.col === col;

  const isPlaying = game.status === 'playing';

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

              const isHint = game.hints.has(`${cellRow},${cellCol}`);
              const isFixed = !!game.originalBoard[cellRow][cellCol];

              // Solution view
              if (showSolution) {
                return (
                  <SudokuCell
                    key={`${cellRow}-${cellCol}`}
                    row={cellRow}
                    col={cellCol}
                    value={game.solution[cellRow][cellCol]}
                    isDisabled={false}
                    isSelected={
                      !isHint &&
                      !isFixed &&
                      game.board[cellRow][cellCol] === game.solution[cellRow][cellCol]
                    }
                    isRelated={false}
                    isConflicting={false}
                    isFixed={isFixed}
                    isHint={isHint}
                    onClick={() => {}}
                  />
                );
              }

              // Live game view
              return (
                <SudokuCell
                  key={`${cellRow}-${cellCol}`}
                  row={cellRow}
                  col={cellCol}
                  value={game.board[cellRow][cellCol]}
                  isDisabled={!isPlaying}
                  isSelected={isSelected(cellRow, cellCol)}
                  isRelated={highlights.has(`${cellRow},${cellCol}`)}
                  isConflicting={game.conflicts.has(`${cellRow},${cellCol}`)}
                  isFixed={isFixed}
                  isHint={isHint}
                  onClick={handleClick}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default memo(SudokuGrid);
