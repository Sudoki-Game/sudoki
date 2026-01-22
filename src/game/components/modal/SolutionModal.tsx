import { useModalRouter } from '@/game/context/ModalRouterContext';
import Modal from './Modal';
import { Dynascale } from 'dynascale';
import SudokuGrid from '../SudokuGrid';
import styles from './SolutionModal.module.css';
import modalStyles from './Modal.module.css';
import Button from '../../../ui/components/Button';
import { useState, useEffect } from 'react';
import type { GameState, Board, ClientMatch } from '@/game/types';
import { auth } from '@/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { getTodaysMatch as getTodaysMatchLocal } from '@/match/lib/client';
import { getTodaysMatch as getTodaysMatchServer } from '@/app/actions/match';

/**
 * Create a display-only game state from match data
 */
function createGameStateFromMatch(match: ClientMatch): GameState {
  const board: Board = JSON.parse(match.board);
  const originalBoard: Board = JSON.parse(match.originalBoard);
  const solution: Board = JSON.parse(match.solution);
  const autoSolvesArray: string[] = JSON.parse(match.autoSolves);
  const autoSolves = new Set<string>(autoSolvesArray);

  return {
    board,
    originalBoard,
    solution,
    autoSolves,
    score: match.score,
    lives: match.livesRemaining,
    status: match.isWon ? 'win' : 'lose',
    selected: { row: null, col: null },
    conflicts: new Map<string, number>(),
    highlights: new Set<string>(),
    dragValue: null,
    showSolution: true,
    difficulty: 'medium',
  };
}

const SolutionModal = () => {
  const { goBack } = useModalRouter();
  const [displayGame, setDisplayGame] = useState<GameState | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Fetch today's match data directly from server or localStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let match: ClientMatch | null = null;

      if (user) {
        // Logged-in user: get from server
        const serverMatch = await getTodaysMatchServer(user.uid);
        if (serverMatch) {
          match = {
            id: serverMatch.id,
            isWon: serverMatch.isWon,
            score: serverMatch.score,
            streakBonus: serverMatch.streakBonus,
            autoSolvesCount: serverMatch.autoSolvesCount,
            autoSolves: serverMatch.autoSolves,
            livesRemaining: serverMatch.livesRemaining,
            board: serverMatch.board,
            originalBoard: serverMatch.originalBoard,
            solution: serverMatch.solution,
            timestamp: serverMatch.timestamp,
          };
        }
      } else {
        // Anonymous user: get from localStorage
        match = await getTodaysMatchLocal();
      }

      if (match) {
        setDisplayGame(createGameStateFromMatch(match));
      }
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  if (!displayGame) {
    return null;
  }

  return (
    <Modal className={styles.solutionModal}>
      <div className={modalStyles.content}>
        <h2 className={modalStyles.title}>Solution</h2>

        <Dynascale defaultScale={0} margin={0}>
          <SudokuGrid
            game={displayGame}
            showSolution={true}
            isReady={isReady}
          />
        </Dynascale>

        <section className={styles.key}>
          <div className={styles.keyPair}>
            <span className={`${styles.keyColor} ${styles.keyColorOk}`}></span>
            <span>Solved Cell</span>
          </div>

          <div className={styles.keyPair}>
            <span
              className={`${styles.keyColor} ${styles.keyColorHint}`}
            ></span>
            <span>Auto Solve</span>
          </div>

          <div className={styles.keyPair}>
            <span className={styles.keyColor}></span>
            <span>Solution</span>
          </div>
        </section>

        <Button fill size='lg' type='button' onClick={goBack}>
          Go Back
        </Button>
      </div>
    </Modal>
  );
};

export default SolutionModal;
