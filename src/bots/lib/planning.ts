import { rollMonthlyBudget } from '@/bots/lib/budget';
import { createSeededRandom } from '@/bots/lib/random';
import { shouldPlayToday, transitionBotState } from '@/bots/lib/stateMachine';
import type { BotProfile, BotState } from '@/bots/types';

export interface BotMonthPreview {
  monthKey: string;
  budgetAllocated: number;
  scheduledDates: string[];
}

function parseMonthKey(monthKey: string): { year: number; monthIndex: number } {
  const parts = monthKey.split('-');
  if (parts.length !== 2) {
    throw new Error('Invalid month key');
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error('Invalid month key');
  }

  if (month < 1 || month > 12) {
    throw new Error('Invalid month key');
  }

  return {
    year,
    monthIndex: month - 1,
  };
}

export function previewBotMonthSchedule(
  profile: BotProfile,
  monthKey: string,
): BotMonthPreview {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const budgetRandom = createSeededRandom(`${profile.uid}:${monthKey}:budget`);
  const budgetAllocated = rollMonthlyBudget(
    profile.budgetMin,
    profile.budgetMax,
    budgetRandom,
  );

  const scheduledDates: string[] = [];
  let gamesPlayed = 0;
  let currentStreak = 0;
  let currentState: BotState = 'steady';

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, monthIndex, day));
    const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
    const dayRandom = createSeededRandom(`${profile.uid}:${dateKey}`);

    currentState = transitionBotState(profile, currentState, dayRandom);

    const remainingBudget = Math.max(0, budgetAllocated - gamesPlayed);
    const daysRemaining = daysInMonth - day + 1;

    const willPlay = shouldPlayToday({
      profile,
      currentState,
      currentStreak,
      remainingBudget,
      daysRemainingInMonth: daysRemaining,
      weekdayIndex: date.getUTCDay(),
      random: dayRandom,
    });

    if (!willPlay || remainingBudget <= 0) {
      currentStreak = 0;
      continue;
    }

    scheduledDates.push(dateKey);
    gamesPlayed += 1;
    currentStreak += 1;
  }

  return {
    monthKey,
    budgetAllocated,
    scheduledDates,
  };
}
