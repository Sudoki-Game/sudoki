import type {
  BotDailyRecord,
  BotMonthlyState,
  BotProfile,
  BotSystemConfig,
  BotRunSummary,
} from '@/bots/types';
import { serverDb } from '@/firebase/server';
import type { ServerMatch } from '@/match/types';
import { USERS_COLLECTION } from '@/user/lib/server';
import { createInitialServerUserData } from '@/user/types';

export const BOT_MONTHLY_COLLECTION = 'botMonthly';
export const BOT_DAILY_COLLECTION = 'botDaily';
export const BOT_RUNS_COLLECTION = 'botRuns';
export const BOT_CONFIG_COLLECTION = 'botConfig';
export const BOT_CONFIG_DOC_ID = 'system';

interface BotUserDoc {
  uid: string;
  displayName: string;
  isBot?: boolean;
  botProfile?: Partial<BotProfile>;
}

const DEFAULT_WEEKDAY_WEIGHTS = [1, 1, 1, 1, 1, 1, 1];
const DEFAULT_PLAY_MULTIPLIERS = { active: 1.2, steady: 1, drifting: 0.7 };
const DEFAULT_DIFFICULTY_SHIFT = { active: 4, steady: 0, drifting: -5 };
const DEFAULT_TRANSITIONS = {
  active: { active: 0.72, steady: 0.25, drifting: 0.03 },
  steady: { active: 0.14, steady: 0.72, drifting: 0.14 },
  drifting: { active: 0.06, steady: 0.26, drifting: 0.68 },
};

function toBotProfile(doc: BotUserDoc): BotProfile {
  const profile = doc.botProfile ?? {};
  const now = Date.now();

  return {
    uid: doc.uid,
    displayName: doc.displayName,
    persona: profile.persona ?? 'regular',
    difficultyPct: profile.difficultyPct ?? 35,
    budgetMin: profile.budgetMin ?? 12,
    budgetMax: profile.budgetMax ?? 20,
    streakCap: profile.streakCap ?? 7,
    weekdayWeights: profile.weekdayWeights ?? DEFAULT_WEEKDAY_WEIGHTS,
    playMultipliers: profile.playMultipliers ?? DEFAULT_PLAY_MULTIPLIERS,
    difficultyShiftByState:
      profile.difficultyShiftByState ?? DEFAULT_DIFFICULTY_SHIFT,
    stateTransitions: profile.stateTransitions ?? DEFAULT_TRANSITIONS,
    isActive: profile.isActive ?? true,
    createdAt: profile.createdAt ?? now,
    updatedAt: profile.updatedAt ?? now,
  };
}

/**
 * Reads bot system config flags
 */
export async function getBotSystemConfig(): Promise<BotSystemConfig> {
  const doc = await serverDb
    .collection(BOT_CONFIG_COLLECTION)
    .doc(BOT_CONFIG_DOC_ID)
    .get();

  if (!doc.exists) {
    return {
      enabled: false,
      updatedAt: 0,
    };
  }

  const data = doc.data() as Partial<BotSystemConfig>;
  return {
    enabled: data.enabled !== false,
    updatedAt: data.updatedAt ?? 0,
  };
}

/**
 * Updates the global bot system enabled flag
 */
export async function setBotSystemEnabled(enabled: boolean): Promise<void> {
  await serverDb.collection(BOT_CONFIG_COLLECTION).doc(BOT_CONFIG_DOC_ID).set(
    {
      enabled,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

/**
 * Returns active bot profiles only
 */
export async function getBotProfiles(): Promise<BotProfile[]> {
  const snapshot = await serverDb
    .collection(USERS_COLLECTION)
    .where('isBot', '==', true)
    .get();

  return snapshot.docs
    .map((doc) => toBotProfile(doc.data() as BotUserDoc))
    .filter((profile) => profile.isActive);
}

/**
 * Returns all bot profiles, including inactive entries
 */
export async function getAllBotProfiles(): Promise<BotProfile[]> {
  const snapshot = await serverDb
    .collection(USERS_COLLECTION)
    .where('isBot', '==', true)
    .get();

  return snapshot.docs
    .map((doc) => toBotProfile(doc.data() as BotUserDoc))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Creates or updates a bot profile inside the corresponding user document
 */
export async function upsertBotProfile(profile: BotProfile): Promise<void> {
  const userRef = serverDb.collection(USERS_COLLECTION).doc(profile.uid);
  const existing = await userRef.get();

  if (!existing.exists) {
    const base = createInitialServerUserData(profile.uid, null, profile.displayName);
    await userRef.set({
      ...base,
      isBot: true,
      botProfile: profile,
    });
    return;
  }

  await userRef.set(
    {
      displayName: profile.displayName,
      isBot: true,
      botProfile: {
        ...profile,
        updatedAt: Date.now(),
      },
    },
    { merge: true },
  );
}

/**
 * Applies partial updates to a bot profile document payload
 */
export async function updateBotProfile(
  botId: string,
  updates: Partial<BotProfile>,
): Promise<void> {
  await serverDb.collection(USERS_COLLECTION).doc(botId).set(
    {
      ...(typeof updates.displayName === 'string'
        ? { displayName: updates.displayName }
        : {}),
      isBot: true,
      botProfile: {
        ...updates,
        updatedAt: Date.now(),
      },
    },
    { merge: true },
  );
}

/**
 * Permanently deletes the bot user document
 */
export async function deleteBotProfile(botId: string): Promise<void> {
  await serverDb.collection(USERS_COLLECTION).doc(botId).delete();
}

/**
 * Deletes bot-specific daily/monthly operational records
 */
export async function deleteBotOperationalData(botId: string): Promise<void> {
  const [dailySnapshot, monthlySnapshot] = await Promise.all([
    serverDb.collection(BOT_DAILY_COLLECTION).where('botId', '==', botId).get(),
    serverDb
      .collection(BOT_MONTHLY_COLLECTION)
      .where('botId', '==', botId)
      .get(),
  ]);

  const docs = [...dailySnapshot.docs, ...monthlySnapshot.docs];
  if (docs.length === 0) {
    return;
  }

  const batch = serverDb.batch();
  for (const doc of docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();
}

/**
 * Retrieves monthly state for a bot if it exists
 */
export async function getBotMonthlyState(
  botId: string,
  monthKey: string,
): Promise<BotMonthlyState | null> {
  const docId = `${botId}_${monthKey}`;
  const snapshot = await serverDb.collection(BOT_MONTHLY_COLLECTION).doc(docId).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as BotMonthlyState;
}

/**
 * Upserts monthly state for a bot and month key
 */
export async function setBotMonthlyState(state: BotMonthlyState): Promise<void> {
  const docId = `${state.botId}_${state.monthKey}`;
  await serverDb.collection(BOT_MONTHLY_COLLECTION).doc(docId).set(state, {
    merge: true,
  });
}

/**
 * Creates a day marker if one does not already exist
 *
 * Returns `true` when created and `false` when the marker already exists
 */
export async function createDailyRecord(
  record: BotDailyRecord,
): Promise<boolean> {
  const docId = `${record.botId}_${record.dateKey}`;
  const docRef = serverDb.collection(BOT_DAILY_COLLECTION).doc(docId);

  try {
    await docRef.create(record);
    return true;
  } catch {
    return false;
  }
}

/**
 * Upserts a daily record for a bot and date pair
 */
export async function upsertDailyRecord(record: BotDailyRecord): Promise<void> {
  const docId = `${record.botId}_${record.dateKey}`;
  await serverDb.collection(BOT_DAILY_COLLECTION).doc(docId).set(record, {
    merge: true,
  });
}

/**
 * Acquires a per-day run lock to prevent duplicate runner execution
 */
export async function acquireRunLock(dateKey: string): Promise<boolean> {
  const docRef = serverDb.collection(BOT_RUNS_COLLECTION).doc(dateKey);

  try {
    await docRef.create({
      dateKey,
      status: 'running',
      startedAt: Date.now(),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Marks a run lock as completed and persists summary counters
 */
export async function finalizeRunLock(
  dateKey: string,
  summary: BotRunSummary,
): Promise<void> {
  await serverDb.collection(BOT_RUNS_COLLECTION).doc(dateKey).set(
    {
      status: 'completed',
      finishedAt: Date.now(),
      summary,
    },
    { merge: true },
  );
}

/**
 * Returns recent human scores for the medium grid only
 *
 * Bot-originated matches are excluded
 */
export async function getRecentHumanScores(
  lookbackStartTimestamp: number,
): Promise<number[]> {
  const snapshot = await serverDb
    .collection('matches')
    .where('timestamp', '>=', lookbackStartTimestamp)
    .limit(1000)
    .get();

  const scores: number[] = [];

  for (const doc of snapshot.docs) {
    const match = doc.data() as ServerMatch;
    if (match.difficulty !== 'medium') {
      continue;
    }

    if (match.userPlayed.startsWith('bot_')) {
      continue;
    }

    scores.push(match.score);
  }

  return scores;
}
