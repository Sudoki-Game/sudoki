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
  const { openModal, closeModal, activeModal } = useModalRouter();

  // The board is interactive only during an active, unpaused game.
  // Anything that opens a modal will pause gameplay via togglePause below.
  const isDisabled = isPaused || game.status !== 'playing';

  // Show how-to-play modal for first-time users
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('sudoki_tutorial_seen');
    if (!hasSeenTutorial && isReady && !hasPlayedToday) {
      openModal('how-to-play');
    }
  }, [isReady, hasPlayedToday, openModal]);

  // Any active modal pauses the board. This includes settings/gameover/tutorial.
  // Pause is centralized here so gameplay components only need to read isPaused.
  useEffect(() => {
    togglePause(!!activeModal);
  }, [activeModal, togglePause]);

  // Auth transitions can leave a stale gameover modal in router state
  // (e.g., user had a completed match while logged in, then logs out).
  // If we are ready and the current user has NOT played today, force-close it
  // so togglePause(false) can re-enable interaction for the fresh game.
  useEffect(() => {
    if (isReady && !hasPlayedToday && activeModal === 'gameover') {
      closeModal();
    }
  }, [isReady, hasPlayedToday, activeModal, closeModal]);

  // Win/Lost modals - only show after save is complete (gameOverReady)
  useEffect(() => {
    if (gameOverReady) {
      openModal('gameover');
      clearGameOverReady(); // Clear the flag so it doesn't re-trigger
    }
  }, [gameOverReady, openModal, clearGameOverReady]);

  // On initial load, show today's result when the user already played.
  // Guarding on idle avoids interrupting a currently active game.
  useEffect(() => {
    if (isReady && hasPlayedToday && todaysMatch && game.status === 'idle') {
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
