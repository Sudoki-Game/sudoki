'use server';

import { previewBotMonthSchedule } from '@/bots/lib/planning';
import { assertBotOwner } from '@/bots/lib/owner';
import {
  clearBotRunForDate,
  deleteBotOperationalData,
  deleteBotProfile,
  getAllBotProfiles,
  getBotMonthlyState,
  getBotRunStatus,
  getBotSystemConfig,
  setBotSystemEnabled,
  upsertBotProfile,
  updateBotProfile,
} from '@/bots/lib/repository';
import type { BotProfile } from '@/bots/types';
import { getDateKey } from '@/bots/lib/budget';
import { runDailyBots } from '@/bots/lib/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isDisplayNameTaken } from '@/user/lib/server';

/**
 * Bot entry projected for the owner admin page
 */
export interface BotAdminEntry {
  profile: BotProfile;
  monthBudgetAllocated: number | null;
  monthGamesPlayed: number | null;
  monthRemaining: number | null;
  scheduledDates: string[];
}

/**
 * Complete payload used to render the owner bot admin page
 */
export interface BotAdminData {
  monthKey: string;
  systemEnabled: boolean;
  todayDateKey: string;
  todayRunStatus: 'not-run' | 'running' | 'completed';
  entries: BotAdminEntry[];
}

function getDefaultMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function sanitizeMonthKey(monthKey?: string): string {
  if (!monthKey) {
    return getDefaultMonthKey();
  }

  if (/^\d{4}-\d{2}$/.test(monthKey)) {
    return monthKey;
  }

  return getDefaultMonthKey();
}

function buildBotsRedirect(
  monthKey: string,
  kind: 'success' | 'error',
  notice: string,
): string {
  const params = new URLSearchParams();
  params.set('month', monthKey);
  params.set('kind', kind);
  params.set('notice', notice);
  return `/bots?${params.toString()}`;
}

/**
 * Retrieves owner-facing bot admin data for the selected month
 */
export async function getBotsAdminData(
  monthKey?: string,
): Promise<BotAdminData> {
  await assertBotOwner();

  const safeMonthKey = sanitizeMonthKey(monthKey);
  const todayDateKey = getDateKey(new Date());
  const [profiles, systemConfig, todayRunStatus] = await Promise.all([
    getAllBotProfiles(),
    getBotSystemConfig(),
    getBotRunStatus(todayDateKey),
  ]);

  const entries = await Promise.all(
    profiles.map(async (profile) => {
      const monthly = await getBotMonthlyState(profile.uid, safeMonthKey);
      const preview = previewBotMonthSchedule(profile, safeMonthKey);

      return {
        profile,
        monthBudgetAllocated: monthly?.budgetAllocated ?? null,
        monthGamesPlayed: monthly?.gamesPlayed ?? null,
        monthRemaining:
          monthly === null
            ? null
            : Math.max(0, monthly.budgetAllocated - monthly.gamesPlayed),
        scheduledDates: preview.scheduledDates,
      };
    }),
  );

  return {
    monthKey: safeMonthKey,
    systemEnabled: systemConfig.enabled,
    todayDateKey,
    todayRunStatus,
    entries,
  };
}

/**
 * Runs today's bot job if it has not been processed yet
 */
export async function runTodaysBotJobAction(formData: FormData): Promise<void> {
  await assertBotOwner();

  const monthInput = String(formData.get('monthKey') ?? '').trim();
  const monthKey = sanitizeMonthKey(monthInput || undefined);
  const todayDateKey = getDateKey(new Date());
  const status = await getBotRunStatus(todayDateKey);

  if (status !== 'not-run') {
    redirect(buildBotsRedirect(monthKey, 'error', `Today's job is already ${status}`));
  }

  const result = await runDailyBots();
  if (!result.ran || !result.lockAcquired) {
    redirect(buildBotsRedirect(monthKey, 'error', "Today's job could not be started"));
  }

  redirect(
    buildBotsRedirect(
      monthKey,
      'success',
      `Today's job ran successfully (${result.summary.played} played)`,
    ),
  );
}

/**
 * Removes today's run marker and daily bot records so it can be rerun
 */
export async function clearTodaysBotJobAction(formData: FormData): Promise<void> {
  await assertBotOwner();

  const monthInput = String(formData.get('monthKey') ?? '').trim();
  const monthKey = sanitizeMonthKey(monthInput || undefined);
  const todayDateKey = getDateKey(new Date());

  await clearBotRunForDate(todayDateKey);

  redirect(
    buildBotsRedirect(
      monthKey,
      'success',
      "Today's job marker was cleared. You can run it again.",
    ),
  );
}

/**
 * Applies editable bot profile fields from the owner panel form
 */
export async function updateBotProfileAction(formData: FormData): Promise<void> {
  await assertBotOwner();

  const botId = String(formData.get('botId') ?? '').trim();
  if (!botId) {
    throw new Error('Missing bot id');
  }

  const displayName = String(formData.get('displayName') ?? '').trim();
  const difficultyPct = Number(formData.get('difficultyPct'));
  const budgetMin = Number(formData.get('budgetMin'));
  const budgetMax = Number(formData.get('budgetMax'));
  const streakCap = Number(formData.get('streakCap'));
  const isActive = formData.get('isActive') === 'on';

  if (!displayName) {
    throw new Error('Display name is required');
  }

  const clampedDifficulty = Math.max(0, Math.min(100, Math.round(difficultyPct)));
  const safeBudgetMin = Math.max(0, Math.round(budgetMin));
  const safeBudgetMax = Math.max(safeBudgetMin, Math.round(budgetMax));
  const safeStreakCap = Math.max(1, Math.round(streakCap));

  await updateBotProfile(botId, {
    displayName,
    difficultyPct: clampedDifficulty,
    budgetMin: safeBudgetMin,
    budgetMax: safeBudgetMax,
    streakCap: safeStreakCap,
    isActive,
  });

  revalidatePath('/bots');
}

function getPersonaDefaults(persona: BotProfile['persona']): {
  weekdayWeights: number[];
  playMultipliers: BotProfile['playMultipliers'];
  difficultyShiftByState: BotProfile['difficultyShiftByState'];
  stateTransitions: BotProfile['stateTransitions'];
} {
  if (persona === 'casual') {
    return {
      weekdayWeights: [0.85, 0.95, 1, 1, 1.1, 1.15, 1],
      playMultipliers: { active: 1.2, steady: 1, drifting: 0.65 },
      difficultyShiftByState: { active: 4, steady: 0, drifting: -5 },
      stateTransitions: {
        active: { active: 0.72, steady: 0.25, drifting: 0.03 },
        steady: { active: 0.14, steady: 0.72, drifting: 0.14 },
        drifting: { active: 0.06, steady: 0.26, drifting: 0.68 },
      },
    };
  }

  if (persona === 'regular') {
    return {
      weekdayWeights: [0.9, 1, 1.05, 1.05, 1.1, 0.95, 0.95],
      playMultipliers: { active: 1.25, steady: 1, drifting: 0.7 },
      difficultyShiftByState: { active: 6, steady: 0, drifting: -6 },
      stateTransitions: {
        active: { active: 0.7, steady: 0.25, drifting: 0.05 },
        steady: { active: 0.16, steady: 0.69, drifting: 0.15 },
        drifting: { active: 0.08, steady: 0.26, drifting: 0.66 },
      },
    };
  }

  return {
    weekdayWeights: [1, 1, 1.05, 1.1, 1.1, 0.9, 0.85],
    playMultipliers: { active: 1.3, steady: 1, drifting: 0.72 },
    difficultyShiftByState: { active: 7, steady: 0, drifting: -7 },
    stateTransitions: {
      active: { active: 0.73, steady: 0.24, drifting: 0.03 },
      steady: { active: 0.17, steady: 0.7, drifting: 0.13 },
      drifting: { active: 0.1, steady: 0.26, drifting: 0.64 },
    },
  };
}

/**
 * Toggles the global bot system enabled state
 */
export async function setBotSystemEnabledAction(formData: FormData): Promise<void> {
  await assertBotOwner();
  const enabled = formData.get('systemEnabled') === 'on';
  await setBotSystemEnabled(enabled);
  revalidatePath('/bots');
}

/**
 * Creates a new bot user with persona-derived defaults
 */
export async function createBotAction(formData: FormData): Promise<void> {
  await assertBotOwner();

  const displayName = String(formData.get('displayName') ?? '').trim();
  const personaInput = String(formData.get('persona') ?? '').trim();
  const difficultyPct = Number(formData.get('difficultyPct'));
  const budgetMin = Number(formData.get('budgetMin'));
  const budgetMax = Number(formData.get('budgetMax'));
  const streakCap = Number(formData.get('streakCap'));

  const persona =
    personaInput === 'casual' ||
    personaInput === 'regular' ||
    personaInput === 'committed-light'
      ? personaInput
      : null;

  if (!displayName) {
    throw new Error('Display name is required');
  }

  if (!persona) {
    throw new Error('Invalid persona');
  }

  const displayNameTaken = await isDisplayNameTaken(displayName);
  if (displayNameTaken) {
    throw new Error('Display name is already taken');
  }

  const now = Date.now();
  const uid = `bot_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const clampedDifficulty = Math.max(0, Math.min(100, Math.round(difficultyPct)));
  const safeBudgetMin = Math.max(0, Math.round(budgetMin));
  const safeBudgetMax = Math.max(safeBudgetMin, Math.round(budgetMax));
  const safeStreakCap = Math.max(1, Math.round(streakCap));

  const defaults = getPersonaDefaults(persona);

  await upsertBotProfile({
    uid,
    displayName,
    persona,
    difficultyPct: clampedDifficulty,
    budgetMin: safeBudgetMin,
    budgetMax: safeBudgetMax,
    streakCap: safeStreakCap,
    weekdayWeights: defaults.weekdayWeights,
    playMultipliers: defaults.playMultipliers,
    difficultyShiftByState: defaults.difficultyShiftByState,
    stateTransitions: defaults.stateTransitions,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath('/bots');
}

/**
 * Deletes a bot and its operational records, then redirects with status notice
 */
export async function deleteBotAction(formData: FormData): Promise<void> {
  await assertBotOwner();

  const monthInput = String(formData.get('monthKey') ?? '').trim();
  const monthKey = sanitizeMonthKey(monthInput || undefined);
  const botId = String(formData.get('botId') ?? '').trim();
  const confirmDelete = String(formData.get('confirmDelete') ?? '').trim();

  if (!botId) {
    redirect(buildBotsRedirect(monthKey, 'error', 'Missing bot id'));
  }

  if (confirmDelete.toUpperCase() !== 'DELETE') {
    redirect(buildBotsRedirect(monthKey, 'error', 'Type DELETE to confirm removal'));
  }

  try {
    await deleteBotOperationalData(botId);
    await deleteBotProfile(botId);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to remove bot';
    redirect(buildBotsRedirect(monthKey, 'error', message));
  }

  redirect(buildBotsRedirect(monthKey, 'success', 'Bot removed'));
}
