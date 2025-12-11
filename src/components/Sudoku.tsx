/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */
'use client';

import { DndContext, DragOverlay } from '@dnd-kit/core';
import SudokuGrid from './SudokuGrid';
import { useSudoku } from '@/context/SudokuContext';
import './Sudoku.css';
import { Dynascale } from 'dynascale';
import useSudokuControls from '@/hooks/useSudokuControls';
import SudokuControls from './SudokuControls';
import { useEffect } from 'react';
import { useMenuRouter } from '@/context/MenuRouterContext';
import SudokuStats from './SudokuStats';

/**
 * Main Sudoku UI component
 * @returns
 */
const Sudoku = () => {
  const { game, isReady, highlights, handleClick, handleDragStart, handleDrop, newGame } =
    useSudoku();
  const { dndSensors, boardRef } = useSudokuControls();

  /**
   * Start new game on mount
   */
  useEffect(newGame, [newGame]);

  const { activeMenu } = useMenuRouter();

  return (
    <div className={`sudoku`} inert={!!activeMenu} style={{ opacity: activeMenu ? '40%' : '' }}>
      <DndContext sensors={dndSensors} onDragStart={handleDragStart} onDragEnd={handleDrop}>
        <DragOverlay dropAnimation={null}>
          {game.dragValue ? (
            <div className='sudoku__cell sudoku__cell--dragging'>{game.dragValue}</div>
          ) : null}
        </DragOverlay>

        <div className='sudoku__game'>
          <SudokuStats />

          {/* Game Board */}
          <Dynascale defaultScale={0} margin={0}>
            <SudokuGrid
              ref={boardRef}
              game={game}
              isReady={isReady}
              handleClick={handleClick}
              highlights={highlights}
              showSolution={false}
            />
          </Dynascale>

          <SudokuControls />
        </div>
      </DndContext>
    </div>
  );
};

export default Sudoku;
