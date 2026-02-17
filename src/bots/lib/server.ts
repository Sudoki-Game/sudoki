import type {
  BotDailyRecord,
  BotMonthlyState,
  BotProfile,
  BotRunResult,
  BotRunSummary,
} from '@/bots/types';
import {
  getDateKey,
  getDaysRemainingInMonth,
  getMonthKey,
  rollMonthlyBudget,
} from '@/bots/lib/budget';
import { createSeededRandom } from '@/bots/lib/random';
import {
  acquireRunLock,
  createDailyRecord,
  finalizeRunLock,
  getBotSystemConfig,
  getBotMonthlyState,
  getBotProfiles,
  getRecentHumanScores,
  setBotMonthlyState,
  upsertDailyRecord,
} from '@/bots/lib/repository';
import { resolveBotScore } from '@/bots/lib/scoring';
import { shouldPlayToday, transitionBotState } from '@/bots/lib/stateMachine';
import {
  DIFFICULTY_EMPTY_CELLS,
  SCORE_PER_EMPTY_CELL,
  STREAK_BONUS_AMOUNT,
  type DifficultyLevel,
} from '@/game/util/constants';
import { saveMatch } from '@/match/lib/server';
import type { ServerMatch } from '@/match/types';

const SOLVED_BOARD = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const SERIALIZED_SOLVED_BOARD = JSON.stringify(SOLVED_BOARD);
const BOT_DIFFICULTY: DifficultyLevel = 'medium';

/**
 * Optional input overrides for invoking the daily bot runner
 */
interface RunDailyBotsOptions {
  now?: Date;
}

function createInitialMonthlyState(
  profile: BotProfile,
  monthKey: string,
  now: Date,
): BotMonthlyState {
  const random = createSeededRandom(`${profile.uid}:${monthKey}:budget`);

  return {
    botId: profile.uid,
    monthKey,
    budgetAllocated: rollMonthlyBudget(profile.budgetMin, profile.budgetMax, random),
    gamesPlayed: 0,
    currentStreak: 0,
    maxStreakObserved: 0,
    lastPlayedDate: null,
    currentState: 'steady',
    updatedAt: now.getTime(),
  };
}

function resolveMatchTimestamp(date: Date, random: () => number): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hour = 8 + Math.floor(random() * 12);
  const minute = Math.floor(random() * 60);
  const second = Math.floor(random() * 60);

  return Date.UTC(year, month, day, hour, minute, second);
}

function buildWonMatch(
  botId: string,
  dateKey: string,
  timestamp: number,
  difficulty: DifficultyLevel,
  score: number,
  streakBonus: number,
): ServerMatch {
  return {
    id: `bot_${botId}_${dateKey}`,
    userPlayed: botId,
    isWon: true,
    difficulty,
    score,
    streakBonus,
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 3,
    board: SERIALIZED_SOLVED_BOARD,
    originalBoard: SERIALIZED_SOLVED_BOARD,
    solution: SERIALIZED_SOLVED_BOARD,
    timestamp,
  };
}

function isConsecutiveDay(
  previousDateKey: string | null,
  currentDateKey: string,
): boolean {
  if (!previousDateKey) {
    return false;
  }

  const previous = new Date(`${previousDateKey}T00:00:00.000Z`);
  const current = new Date(`${currentDateKey}T00:00:00.000Z`);

  const diff = current.getTime() - previous.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  return diff === dayMs;
}

function createEmptySummary(dateKey: string): BotRunSummary {
  return {
    dateKey,
    considered: 0,
    played: 0,
    skippedNoBudget: 0,
    skippedProbability: 0,
    skippedExistingDailyRecord: 0,
    failedSaves: 0,
  };
}

/**
 * Executes one daily bot simulation pass
 *
 * The run is guarded by a date-based lock, respects bot system enabled state,
 * enforces monthly budgets/streak rules, and writes simulated matches as
 * medium-grid wins
 */
export async function runDailyBots(
  options: RunDailyBotsOptions = {},
): Promise<BotRunResult> {
  const now = options.now ?? new Date();
  const dateKey = getDateKey(now);
  const monthKey = getMonthKey(now);
  const weekdayIndex = now.getUTCDay();
  const summary = createEmptySummary(dateKey);

  const systemConfig = await getBotSystemConfig();
  if (!systemConfig.enabled) {
    return {
      ran: false,
      lockAcquired: false,
      summary,
    };
  }

  const lockAcquired = await acquireRunLock(dateKey);
  if (!lockAcquired) {
    return {
      ran: false,
      lockAcquired: false,
      summary,
    };
  }

  try {
    const profiles = await getBotProfiles();

    for (const profile of profiles) {
      summary.considered += 1;

      let monthly = await getBotMonthlyState(profile.uid, monthKey);
      if (!monthly) {
        monthly = createInitialMonthlyState(profile, monthKey, now);
        await setBotMonthlyState(monthly);
      }

      const remainingBudget = Math.max(0, monthly.budgetAllocated - monthly.gamesPlayed);
      if (remainingBudget <= 0) {
        summary.skippedNoBudget += 1;
        continue;
      }

      const random = createSeededRandom(`${profile.uid}:${dateKey}`);
      const nextState = transitionBotState(profile, monthly.currentState, random);
      const shouldPlay = shouldPlayToday({
        profile,
        currentState: nextState,
        currentStreak: monthly.currentStreak,
        remainingBudget,
        daysRemainingInMonth: getDaysRemainingInMonth(now),
        weekdayIndex,
        random,
      });

      if (!shouldPlay) {
        summary.skippedProbability += 1;
        monthly.currentState = nextState;
        monthly.updatedAt = Date.now();
        await setBotMonthlyState(monthly);
        continue;
      }

      const createdMarker = await createDailyRecord({
        botId: profile.uid,
        dateKey,
        monthKey,
        played: false,
        matchId: null,
        score: null,
        difficulty: null,
        error: null,
        createdAt: Date.now(),
      });

      if (!createdMarker) {
        summary.skippedExistingDailyRecord += 1;
        continue;
      }

      const lookbackStart = Date.now() - 1000 * 60 * 60 * 24 * 45;
      const recentHumanScores = await getRecentHumanScores(lookbackStart);

      const score = resolveBotScore({
        profile,
        state: nextState,
        recentHumanScores,
        random,
      });

      const streakBonus =
        isConsecutiveDay(monthly.lastPlayedDate, dateKey) &&
        monthly.currentStreak < profile.streakCap
          ? STREAK_BONUS_AMOUNT
          : 0;

      const timestamp = resolveMatchTimestamp(now, random);
      const cappedScore = Math.min(
        score,
        DIFFICULTY_EMPTY_CELLS[BOT_DIFFICULTY] * SCORE_PER_EMPTY_CELL,
      );

      const match = buildWonMatch(
        profile.uid,
        dateKey,
        timestamp,
        BOT_DIFFICULTY,
        cappedScore,
        streakBonus,
      );

      const saveResult = await saveMatch(profile.uid, match);
      if (!saveResult.success) {
        await upsertDailyRecord({
          botId: profile.uid,
          dateKey,
          monthKey,
          played: false,
          matchId: match.id,
          score: null,
          difficulty: BOT_DIFFICULTY,
          error: saveResult.error ?? 'Unknown save error',
          createdAt: Date.now(),
        });

        summary.failedSaves += 1;
        continue;
      }

      const newCurrentStreak = streakBonus > 0 ? monthly.currentStreak + 1 : 1;

      const updatedMonthly: BotMonthlyState = {
        ...monthly,
        gamesPlayed: monthly.gamesPlayed + 1,
        currentStreak: newCurrentStreak,
        maxStreakObserved: Math.max(monthly.maxStreakObserved, newCurrentStreak),
        lastPlayedDate: dateKey,
        currentState: nextState,
        updatedAt: Date.now(),
      };

      await setBotMonthlyState(updatedMonthly);

      const completedRecord: BotDailyRecord = {
        botId: profile.uid,
        dateKey,
        monthKey,
        played: true,
        matchId: match.id,
        score: match.score,
        difficulty: match.difficulty,
        error: null,
        createdAt: Date.now(),
      };

      await upsertDailyRecord(completedRecord);

      summary.played += 1;
    }
  } finally {
    await finalizeRunLock(dateKey, summary);
  }

  return {
    ran: true,
    lockAcquired: true,
    summary,
  };
}
