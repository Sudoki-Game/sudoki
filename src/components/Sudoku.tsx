/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */
'use client';

import { DndContext, DragOverlay } from '@dnd-kit/core';
import SudokuGrid from './SudokuGrid';
import { useSudoku } from '@/context/SudokuContext';
import { Dynascale } from 'dynascale';
import useSudokuControls from '@/hooks/useSudokuControls';
import SudokuControls from './SudokuControls';
import { useEffect } from 'react';
import { useMenuRouter } from '@/context/MenuRouterContext';
import SudokuStats from './SudokuStats';
import './Sudoku.css';

/**
 * Main Sudoku UI component
 * @returns
 */
const Sudoku = () => {
  const {
    game,
    isPaused,
    isReady,
    togglePause,
    handleClick,
    handleDragStart,
    handleDrop,
    newGame
  } = useSudoku();
  const { dndSensors, boardRef, containerRef } = useSudokuControls();

  const isDisabled = isPaused || game.status !== 'playing';

  /**
   * Start new game on mount
   */
  useEffect(newGame, [newGame]);

  const { activeMenu } = useMenuRouter();

  // Disable game on menu active
  useEffect(() => {
    togglePause(!!activeMenu);
  }, [activeMenu, togglePause]);

  return (
    <div className={`sudoku`} inert={isDisabled} style={{ opacity: isDisabled ? '40%' : '' }}>
      <DndContext sensors={dndSensors} onDragStart={handleDragStart} onDragEnd={handleDrop}>
        <DragOverlay dropAnimation={null}>
          {game.dragValue ? (
            <div className='sudoku__cell sudoku__cell--dragging'>{game.dragValue}</div>
          ) : null}
        </DragOverlay>

        <div ref={containerRef} className='sudoku__game'>
          <SudokuStats score={game.score} lives={game.lives} />

          {/* Game Board */}
          <Dynascale defaultScale={0} margin={0}>
            <SudokuGrid
              ref={boardRef}
              game={game}
              isReady={isReady}
              handleClick={handleClick}
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
