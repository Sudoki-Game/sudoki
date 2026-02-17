import { resolveBotScore, resolveTargetPercentile } from '@/bots/lib/scoring';
import type { BotProfile } from '@/bots/types';

const profile: BotProfile = {
  uid: 'bot-score-test',
  displayName: 'Score Bot',
  persona: 'regular',
  difficultyPct: 40,
  budgetMin: 10,
  budgetMax: 20,
  streakCap: 7,
  weekdayWeights: [1, 1, 1, 1, 1, 1, 1],
  playMultipliers: { active: 1.2, steady: 1, drifting: 0.7 },
  difficultyShiftByState: { active: 6, steady: 0, drifting: -6 },
  stateTransitions: {
    active: { active: 0.7, steady: 0.25, drifting: 0.05 },
    steady: { active: 0.15, steady: 0.7, drifting: 0.15 },
    drifting: { active: 0.1, steady: 0.25, drifting: 0.65 },
  },
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('bots/scoring', () => {
  it('keeps percentile in low-mid range', () => {
    const low = resolveTargetPercentile(
      { ...profile, difficultyPct: -20 },
      'drifting',
      () => 0,
    );
    const high = resolveTargetPercentile(
      { ...profile, difficultyPct: 95 },
      'active',
      () => 1,
    );

    expect(low).toBeGreaterThanOrEqual(5);
    expect(high).toBeLessThanOrEqual(70);
  });

  it('uses fallback when human samples are small', () => {
    const score = resolveBotScore({
      profile,
      state: 'steady',
      recentHumanScores: [100, 120],
      random: () => 0.5,
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(700);
  });

  it('returns bounded score from larger human sample', () => {
    const score = resolveBotScore({
      profile,
      state: 'active',
      recentHumanScores: [
        80, 110, 140, 170, 200, 230, 260, 290, 320, 350, 380, 410,
      ],
      random: () => 0.5,
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(900);
  });
});
