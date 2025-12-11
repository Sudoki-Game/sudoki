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
import Image from 'next/image';
import HeartIcon from '../../public/game/heart.svg';
import EmptyHeartIcon from '../../public/game/heart-empty.svg';
import { MAX_LIVES } from '@/util/constants';
import useSudokuControls from '@/hooks/useSudokuControls';
import SudokuControls from './SudokuControls';
import { useEffect } from 'react';
import { useMenuRouter } from '@/context/MenuRouterContext';

/**
 * Main Sudoku UI component
 * @returns
 */
const Sudoku = () => {
  const { game, handleDragStart, handleDrop, newGame } = useSudoku();
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
          <div className='sudoku__stats'>
            <div className='sudoku__stat-container'>
              <span className='sudoku__stat'>Score</span>
              <span className='sudoku__stat sudoku__stat--numerical'>{game.score}</span>
            </div>

            <div className='sudoku__lives-container'>
              {Array.from({ length: MAX_LIVES }).map((_, i) =>
                i < game.lives ? (
                  <Image key={`heart-${i}`} src={HeartIcon} alt={'Heart'} height={24} />
                ) : (
                  <Image key={`heart-${i}`} src={EmptyHeartIcon} alt={'Empty Heart'} height={24} />
                )
              )}
            </div>
          </div>

          {/* Game Board */}
          <Dynascale defaultScale={0} margin={0}>
            <SudokuGrid ref={boardRef} showSolution={false} />
          </Dynascale>

          <SudokuControls />
        </div>
      </DndContext>
    </div>
  );
};

export default Sudoku;
