/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */
'use client';

import Draggable from './Draggable';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import SudokuGrid from './SudokuGrid';
import { useSudoku } from '@/context/SudokuContext';
import './Sudoku.css';
import { Dynascale } from 'dynascale';
import Image from 'next/image';
import HeartIcon from '../../public/game/heart.svg';
import EmptyHeartIcon from '../../public/game/heart-empty.svg';
import { MAX_LIVES } from '@/util/constants';

/**
 * Main Sudoku UI component
 * @returns
 */
const Sudoku = () => {
  const {
    game,
    sensors,
    containerRef,
    boardRef,
    isReady,
    addHint,
    handleDragStart,
    handleDrop,
    newGame,
    dispatch
  } = useSudoku();
  const isPlaying = game.status === 'playing';

  return (
    <div ref={containerRef} className={`sudoku ${isPlaying ? '' : 'sudoku--game-over'}`}>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDrop}>
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
          {isReady && (
            <Dynascale defaultScale={0} margin={0}>
              <SudokuGrid ref={boardRef} showSolution={false} />
            </Dynascale>
          )}

          {/* Draggable numbers */}
          <div className={`sudoku__controls ${!isPlaying ? 'sudoku__controls--game-over' : ''}`}>
            <div className='sudoku__controls-numlist'>
              {isReady &&
                Array.from({ length: 9 }).map((_, i) => (
                  <Draggable
                    key={i}
                    id={`draggable-${i + 1}`}
                    isDisabled={!isPlaying}
                    className={`sudoku__cell ${!isPlaying ? 'sudoku__cell--disabled' : ''}`}
                    data={{ cell: { value: i + 1 } }}
                    tabIndex={isPlaying ? 0 : -1}
                    data-testid={`draggable-${i + 1}`}
                  >
                    {i + 1}
                  </Draggable>
                ))}
            </div>

            {isReady && (
              <button
                disabled={!isPlaying}
                className='button button--lg button--warning'
                onClick={addHint}
              >
                HTNT
              </button>
            )}
          </div>
        </div>
      </DndContext>

      {/* Lose and Win screens */}
      {game.status === 'lose' ? (
        <div data-testid='game-over-lose' className='sudoku__game-over'>
          <div className='sudoku__game-over-banner'>
            <h1>Game Over</h1>
            <p>Click &apos;Show solution&apos; below to see the correct number combination</p>
          </div>

          <div>
            <p className='sudoku__stat'>
              {'Your Score '}
              <span>{game.score}</span>
            </p>
          </div>

          {/* Solution View */}
          {game.showSolution ? (
            <Dynascale margin={0.1} defaultScale={1}>
              <SudokuGrid showSolution={true} />
            </Dynascale>
          ) : (
            <button
              className='button'
              onClick={() => dispatch({ type: 'SHOW_SOLUTION', show: true })}
            >
              Show Solution
            </button>
          )}

          <button className='button button--active' onClick={newGame}>
            Play Again
          </button>
        </div>
      ) : game.status === 'win' ? (
        <div data-testid='game-over-win' className='sudoku__game-over'>
          <div className='sudoku__game-over-banner'>
            <h1>Sudoku Complete</h1>
          </div>

          <div>
            <p className='sudoku__stat'>
              {'Your Score '}
              <span>{game.score}</span>
            </p>

            <p className='sudoku__stat'>
              {'Lives Remaining '}
              <span>{game.lives}</span>
            </p>
          </div>

          <button className='button button--active' onClick={newGame}>
            Play Again
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Sudoku;
