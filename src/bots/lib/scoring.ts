import { clamp } from '@/bots/lib/random';
import type { BotProfile, BotState } from '@/bots/types';
import {
  DIFFICULTY_EMPTY_CELLS,
  SCORE_PER_EMPTY_CELL,
} from '@/game/util/constants';

const MIN_TARGET_PERCENTILE = 5;
const MAX_TARGET_PERCENTILE = 70;

interface ResolveScoreInput {
  profile: BotProfile;
  state: BotState;
  recentHumanScores: number[];
  random: () => number;
}

const BOT_GRID_DIFFICULTY = 'medium';

function quantile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) {
    return 0;
  }

  if (sorted.length === 1) {
    return sorted[0];
  }

  const p = clamp(percentile, 0, 100) / 100;
  const index = p * (sorted.length - 1);
  const low = Math.floor(index);
  const high = Math.ceil(index);

  if (low === high) {
    return sorted[low];
  }

  const lowValue = sorted[low];
  const highValue = sorted[high];
  const factor = index - low;
  return lowValue + (highValue - lowValue) * factor;
}

function fallbackScore(percentile: number): number {
  const maxScore = DIFFICULTY_EMPTY_CELLS[BOT_GRID_DIFFICULTY] * SCORE_PER_EMPTY_CELL;
  return Math.round((maxScore * clamp(percentile, 0, 100)) / 100);
}

/**
 * Resolves a bot's target percentile for the current run state
 */
export function resolveTargetPercentile(
  profile: BotProfile,
  state: BotState,
  random: () => number,
): number {
  const stateShift = profile.difficultyShiftByState[state];
  const noise = (random() - 0.5) * 8;

  return clamp(
    profile.difficultyPct + stateShift + noise,
    MIN_TARGET_PERCENTILE,
    MAX_TARGET_PERCENTILE,
  );
}

/**
 * Resolves a bot score against recent medium-grid human samples
 *
 * Falls back to a bounded synthetic score when sample size is too small
 */
export function resolveBotScore(input: ResolveScoreInput): number {
  const { profile, state, recentHumanScores, random } = input;
  const targetPercentile = resolveTargetPercentile(profile, state, random);

  if (recentHumanScores.length < 8) {
    return fallbackScore(targetPercentile);
  }

  const sortedScores = [...recentHumanScores].sort((a, b) => a - b);
  const score = quantile(sortedScores, targetPercentile);
  const boundedFallback = fallbackScore(targetPercentile);

  return Math.max(0, Math.round(Math.min(score, boundedFallback)));
}
