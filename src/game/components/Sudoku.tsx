'use client';

import { DndContext, DragOverlay } from '@dnd-kit/core';
import SudokuGrid from './SudokuGrid';
import { useSudokuGame } from '@/game/context/SudokuGameContext';
import { Dynascale } from 'dynascale';
import useSudokuControls from '@/game/hooks/useSudokuControls';
import SudokuControls from './SudokuControls';
import { useEffect } from 'react';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import SudokuStats from './SudokuStats';
import styles from './Sudoku.module.css';
import SudokuCellStyles from './SudokuCell.module.css';

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
    hasPlayedToday,
    todaysMatch,
    gameOverReady,
    clearGameOverReady,
  } = useSudokuGame();
  const { dndSensors, boardRef, containerRef } = useSudokuControls();
  const { openModal } = useModalRouter();

  const isDisabled = isPaused || game.status !== 'playing';

  const { activeModal } = useModalRouter();

  // Show how-to-play modal for first-time users
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('sudoki_tutorial_seen');
    if (!hasSeenTutorial && isReady && !hasPlayedToday) {
      openModal('how-to-play');
    }
  }, [isReady, hasPlayedToday, openModal]);

  // Disable game on menu active
  useEffect(() => {
    togglePause(!!activeModal);
  }, [activeModal, togglePause]);

  // Win/Lost modals - only show after save is complete (gameOverReady)
  useEffect(() => {
    if (gameOverReady) {
      openModal('gameover');
      clearGameOverReady(); // Clear the flag so it doesn't re-trigger
    }
  }, [gameOverReady, openModal, clearGameOverReady]);

  // Show game over modal if user has already played today (on page load)
  useEffect(() => {
    console.log('[Sudoku] Checking hasPlayedToday:', {
      hasPlayedToday,
      todaysMatch: !!todaysMatch,
      status: game.status,
      isReady,
    });
    if (isReady && hasPlayedToday && todaysMatch && game.status === 'idle') {
      console.log('[Sudoku] Opening gameover modal for previous match');
      openModal('gameover');
    }
  }, [isReady, hasPlayedToday, todaysMatch, game.status, openModal]);

  return (
    <div
      className={styles.root}
      inert={isDisabled}
      style={{ opacity: isDisabled ? '40%' : '' }}
    >
      <DndContext
        sensors={dndSensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDrop}
      >
        <DragOverlay dropAnimation={null}>
          {game.dragValue ? (
            <div
              className={`${SudokuCellStyles.cell} ${SudokuCellStyles.cellDragging}`}
            >
              {game.dragValue}
            </div>
          ) : null}
        </DragOverlay>

        <div ref={containerRef} className={styles.game}>
          <SudokuStats score={game.score} lives={game.lives} />

          {/* Game Board */}
          <Dynascale margin={0}>
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
