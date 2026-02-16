/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import { useSudokuGame } from '@/game/context/SudokuGameContext';
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  type SensorDescriptor,
  type SensorOptions,
} from '@dnd-kit/core';
import { useEffect, useRef } from 'react';
import { playSound } from '../lib/sound';

interface SudokuControls {
  /**
   * Configured DnD Kit sensors used to enable pointer and keyboard
   * drag-and-drop interactions within the Sudoku board.
   */
  dndSensors: SensorDescriptor<SensorOptions>[];

  /**
   * Ref to the root board container. Used to detect clicks outside
   * the Sudoku grid and to scope keyboard interactions.
   */
  boardRef: React.RefObject<HTMLDivElement | null>;

  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Provides UI interaction controls for the Sudoku board, including:
 *
 * - DnD Kit sensor configuration for pointer and keyboard movement.
 * - Keyboard input handling for entering or deleting values.
 * - Automatic deselection when clicking outside the grid.
 *
 * This hook centralizes all board-level interaction effects to keep
 * Sudoku view components clean and declarative.
 */
const useSudokuGameControls = (): SudokuControls => {
  const { game, updateCell, dispatch, isPaused } = useSudokuGame();
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Drag-and-drop sensor configuration.
   */
  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 150,
      },
    }),
    useSensor(KeyboardSensor),
  );

  /**
   * Handle keyboard input for editing Sudoku cells and moving selection.
   */
  useEffect(() => {
    if (game.status !== 'playing' || !boardRef.current) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Block all other inputs when paused
      if (isPaused) return;

      const { row, col } = game.selected;

      const isArrow =
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight';

      // Handle arrow-key navigation
      if (isArrow) {
        e.preventDefault(); // prevent scrolling

        const newRow = (() => {
          if (row === null) return 0;
          if (e.key === 'ArrowUp') return Math.max(row - 1, 0);
          if (e.key === 'ArrowDown') return Math.min(row + 1, 8);
          return row;
        })();

        const newCol = (() => {
          if (col === null) return 0;
          if (e.key === 'ArrowLeft') return Math.max(col - 1, 0);
          if (e.key === 'ArrowRight') return Math.min(col + 1, 8);
          return col;
        })();

        // Select sound
        playSound('/game/audio/metronome.mp3', { pitch: 1.8 });

        dispatch({ type: 'SELECT_CELL', row: newRow, col: newCol });
        return;
      }

      // Handle number input + deletion
      if (row !== null && col !== null) {
        const isNumber = /^[1-9]$/.test(e.key);
        const isDeleteOrBackspace =
          e.key === '0' || e.key === 'Delete' || e.key === 'Backspace';

        if (isNumber) {
          updateCell(row, col, Number(e.key));
          // Play drop sound
          playSound('/game/audio/metronome.mp3', { pitch: 1.4 });
        } else if (isDeleteOrBackspace) {
          updateCell(row, col, null);
          // Play delete sound
          playSound('/game/audio/metronome.mp3', { pitch: 0.9 });
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [boardRef, game.selected, game.status, updateCell, dispatch, isPaused]);

  /**
   * Deselect the active cell when clicking outside the board area.
   */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isPaused || game.status !== 'playing') return;

      // Reset selection if clicked outside of the container or the container itself
      if (
        !containerRef.current?.contains(e.target as Node) ||
        containerRef.current === e.target
      ) {
        if (
          game.selected.row !== null ||
          game.selected.row !== undefined ||
          game.selected.col !== null ||
          game.selected.col !== undefined
        ) {
          dispatch({ type: 'RESET_SELECTION' });
        }
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [containerRef, dispatch, game.selected, game.status, isPaused]);

  return { dndSensors, boardRef, containerRef };
};

export default useSudokuGameControls;
