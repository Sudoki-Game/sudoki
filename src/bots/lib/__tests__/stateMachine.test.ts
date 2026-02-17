import { shouldPlayToday, transitionBotState } from '@/bots/lib/stateMachine';
import type { BotProfile } from '@/bots/types';

const baseProfile: BotProfile = {
  uid: 'bot-test',
  displayName: 'Bot Test',
  persona: 'regular',
  difficultyPct: 35,
  budgetMin: 10,
  budgetMax: 20,
  streakCap: 6,
  weekdayWeights: [1, 1, 1, 1, 1, 1, 1],
  playMultipliers: { active: 1.2, steady: 1, drifting: 0.6 },
  difficultyShiftByState: { active: 5, steady: 0, drifting: -5 },
  stateTransitions: {
    active: { active: 1, steady: 0, drifting: 0 },
    steady: { active: 0, steady: 1, drifting: 0 },
    drifting: { active: 0, steady: 0, drifting: 1 },
  },
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('bots/stateMachine', () => {
  it('transitions according to weights', () => {
    const nextState = transitionBotState(baseProfile, 'active', () => 0.6);
    expect(nextState).toBe('active');
  });

  it('does not play with no remaining budget', () => {
    const shouldPlay = shouldPlayToday({
      profile: baseProfile,
      currentState: 'steady',
      currentStreak: 0,
      remainingBudget: 0,
      daysRemainingInMonth: 10,
      weekdayIndex: 2,
      random: () => 0,
    });

    expect(shouldPlay).toBe(false);
  });

  it('reduces play chance when streak exceeds cap', () => {
    const playsWithoutPressure = shouldPlayToday({
      profile: baseProfile,
      currentState: 'steady',
      currentStreak: 1,
      remainingBudget: 8,
      daysRemainingInMonth: 8,
      weekdayIndex: 1,
      random: () => 0.5,
    });

    const playsWithPressure = shouldPlayToday({
      profile: baseProfile,
      currentState: 'steady',
      currentStreak: 12,
      remainingBudget: 8,
      daysRemainingInMonth: 8,
      weekdayIndex: 1,
      random: () => 0.5,
    });

    expect(playsWithoutPressure).toBe(true);
    expect(playsWithPressure).toBe(false);
  });
});
