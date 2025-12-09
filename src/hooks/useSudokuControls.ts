/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

import { useSudoku } from '@/context/SudokuContext';
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  SensorDescriptor,
  SensorOptions
} from '@dnd-kit/core';
import { useEffect, useRef } from 'react';

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
 *
 * @returns An object containing configured drag-and-drop sensors and
 * a reference to the board container element.
 */
const useSudokuControls = (): SudokuControls => {
  const { game, updateCell, dispatch } = useSudoku();
  const boardRef = useRef<HTMLDivElement>(null);

  /**
   * Drag-and-drop sensor configuration.
   */
  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 150
      }
    }),
    useSensor(KeyboardSensor)
  );

  /**
   * Handle keyboard input for editing Sudoku cells.
   */
  useEffect(() => {
    if (game.status !== 'playing' || !boardRef.current) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (game.selected.row !== null && game.selected.col !== null) {
        const isNumber = /^[1-9]$/.test(e.key);
        const isDeleteOrBackspace = e.key === '0' || e.key === 'Delete' || e.key === 'Backspace';

        if (isNumber) {
          updateCell(game.selected.row, game.selected.col, Number(e.key));
        } else if (isDeleteOrBackspace) {
          updateCell(game.selected.row, game.selected.col, null);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [boardRef, game.selected, game.showSolution, game.status, updateCell]);

  /**
   * Deselect the active cell when clicking outside the board area.
   */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boardRef.current?.contains(e.target as Node)) {
        dispatch({ type: 'RESET_SELECTION' });
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [boardRef, dispatch]);

  return { dndSensors, boardRef };
};

export default useSudokuControls;
