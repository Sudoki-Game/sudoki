import { useModalRouter } from '@/game/context/ModalRouterContext';
import Image from 'next/image';
import styles from './GameOverModal.module.css';
import modalStyles from './Modal.module.css';
import { useRouter } from 'next/navigation';
import Button from '@/ui/components/Button';
import Modal from './Modal';
import { auth } from '@/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getTodaysMatch as getTodaysMatchLocal } from '@/match/lib/client';
import { getUserData as getUserDataLocal } from '@/user/lib/client';
import { getTodaysMatch as getTodaysMatchServer } from '@/match/lib/actionGateway';
import { getUserStats as getUserStatsServer } from '@/user/lib/actionGateway';
import { useSudokuGame } from '@/game/context/SudokuGameContext';
import type { BaseUserStats } from '@/user/types';
import type { ClientMatch } from '@/match/types';
import { MAX_LIVES } from '@/game/util/constants';

interface GameOverModalProps {
  onClose: () => void;
}

const GameOverModal = ({ onClose }: GameOverModalProps) => {
  const { openModal } = useModalRouter();
  const router = useRouter();
  const { todaysMatch: contextMatch, isDuplicatePlay } = useSudokuGame();
  const [userStats, setUserStats] = useState<BaseUserStats | null>(null);
  const [fetchedMatch, setFetchedMatch] = useState<ClientMatch | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const hasFetchedRef = useRef(false);

  // Use context match if available (both for just-completed AND for viewing previous match on page load)
  // Only fetch from server if context doesn't have the match data
  const match = useMemo(() => {
    if (contextMatch) {
      return contextMatch;
    }
    return fetchedMatch;
  }, [contextMatch, fetchedMatch]);

  // Load match data and user stats
  useEffect(() => {
    // If we have context match, just fetch user stats directly
    if (contextMatch) {
      const fetchStats = async () => {
        const user = auth.currentUser;
        setIsLoggedIn(!!user);
        const stats = user
          ? await getUserStatsServer(user.uid)
          : await getUserDataLocal();
        setUserStats(stats);
        setIsReady(true);
      };
      fetchStats();
      return;
    }

    // No context match - fetch everything from server/localStorage
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let stats: BaseUserStats;
      let todaysMatch: ClientMatch | null = null;

      if (user) {
        setIsLoggedIn(true);
        // Use server data for logged-in users
        stats = await getUserStatsServer(user.uid);
        const serverMatch = await getTodaysMatchServer(user.uid);
        if (serverMatch) {
          todaysMatch = {
            id: serverMatch.id,
            isWon: serverMatch.isWon,
            difficulty: serverMatch.difficulty,
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
        setIsLoggedIn(false);
        // Use localStorage for anonymous users
        stats = await getUserDataLocal();
        todaysMatch = await getTodaysMatchLocal();
      }

      setUserStats(stats);
      setFetchedMatch(todaysMatch);
      setIsReady(true);
    });

    return () => unsubscribe();
  }, [contextMatch]);

  // Don't render until data is ready or if no match exists
  if (!isReady || !match) return null;

  const isWin = match.isWon;

  return (
    <Modal className={styles.gameoverModal} onClose={onClose}>
      <div className={modalStyles.content}>
        {/* Streak day - minimum of 1 since user played today */}
        <h2 className={modalStyles.title}>
          Day {Math.max(1, userStats?.dailyStreak ?? 1)}
        </h2>

        {isDuplicatePlay && (
          <div className={styles.duplicateNotice}>
            <p>
              This puzzle was already completed on another device. Showing the
              result from your first completion.
            </p>
          </div>
        )}

        {isWin ? (
          <Image
            className={styles.stateImage}
            src={'/game/you-win-text.png'}
            alt={'You Win!'}
            priority
            fetchPriority='high'
            loading={'eager'}
            height={84}
            width={328}
          />
        ) : (
          <Image
            className={styles.stateImage}
            src={'/game/game-over-text.png'}
            alt={'Game Over!'}
            priority
            fetchPriority='high'
            loading={'eager'}
            height={70}
            width={352}
          />
        )}

        <div className={styles.livesContainer}>
          {Array.from({ length: MAX_LIVES }).map((_, i) =>
            i < match.livesRemaining ? (
              <Image
                key={`heart-${i}`}
                src={'/game/heart.svg'}
                alt={'Heart'}
                height={48}
                width={48}
              />
            ) : (
              <Image
                key={`heart-${i}`}
                src={'/game/heart-empty.svg'}
                alt={'Empty Heart'}
                height={48}
                width={48}
              />
            ),
          )}
        </div>

        <section className={styles.statContainer}>
          <span className={styles.stat}>Your Score</span>
          <span className={styles.statNumerical}>{match.score}</span>

          <span className={styles.stat}>Streak Bonus</span>
          <span className={styles.statNumerical}>+{match.streakBonus}</span>

          <hr />

          <span className={styles.stat}>Personal Best</span>
          <span className={styles.statNumerical}>
            {userStats?.personalBestScore ?? 0}
          </span>

          <hr />

          <span className={styles.stat}>Total Score</span>
          <span className={styles.statNumerical}>
            {userStats?.combinedScore ?? 0}
            <span className={styles.statIncrement}>
              (+{match.score + match.streakBonus})
            </span>
          </span>
        </section>

        {!isLoggedIn ? (
          <div className={styles.registerCTA}>
            <p>Want to see your score on the leaderboard?</p>
            <Button
              onClick={() => router.push('/login')}
              fill
              size={'lg'}
              variant={'ok'}
              type='button'
            >
              Create an Account
            </Button>
          </div>
        ) : (
          <Button
            fill
            size='lg'
            variant={'ok'}
            type='button'
            onClick={() => openModal('leaderboard')}
          >
            Leaderboard
          </Button>
        )}

        <Button
          disabled={isWin}
          fill
          size='lg'
          type='button'
          onClick={() => openModal('solution')}
        >
          View Solution
        </Button>
      </div>
    </Modal>
  );
};

export default GameOverModal;
