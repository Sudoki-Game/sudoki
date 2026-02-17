import type { BotProfile, BotState } from '@/bots/types';
import { clamp, pickByWeights } from '@/bots/lib/random';

interface ResolvePlayInput {
  profile: BotProfile;
  currentState: BotState;
  currentStreak: number;
  remainingBudget: number;
  daysRemainingInMonth: number;
  weekdayIndex: number;
  random: () => number;
}

/**
 * Chooses next bot lifecycle state from weighted transition probabilities
 */
export function transitionBotState(
  profile: BotProfile,
  currentState: BotState,
  random: () => number,
): BotState {
  const transitionWeights = profile.stateTransitions[currentState];
  return pickByWeights(transitionWeights, random);
}

/**
 * Determines whether a bot should play on the current day
 *
 * Decision factors include budget pressure, state multiplier, weekday weight,
 * and streak-cap pressure
 */
export function shouldPlayToday(input: ResolvePlayInput): boolean {
  const {
    profile,
    currentState,
    currentStreak,
    remainingBudget,
    daysRemainingInMonth,
    weekdayIndex,
    random,
  } = input;

  if (remainingBudget <= 0) {
    return false;
  }

  const baseChance = clamp(
    remainingBudget / Math.max(1, daysRemainingInMonth),
    0.08,
    0.95,
  );

  const stateMultiplier = profile.playMultipliers[currentState];
  const weekdayWeight = profile.weekdayWeights[weekdayIndex] ?? 1;
  const streakPressure =
    currentStreak >= profile.streakCap
      ? clamp(1 - (currentStreak - profile.streakCap + 1) * 0.25, 0.2, 1)
      : 1;

  const finalChance = clamp(
    baseChance * stateMultiplier * weekdayWeight * streakPressure,
    0.03,
    0.97,
  );

  return random() < finalChance;
}
