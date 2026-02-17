import {
  calculateBasePlayChance,
  getDateKey,
  getDaysRemainingInMonth,
  getMonthKey,
  rollMonthlyBudget,
} from '@/bots/lib/budget';

describe('bots/budget', () => {
  it('creates stable month and date keys', () => {
    const date = new Date('2026-02-17T12:00:00.000Z');
    expect(getMonthKey(date)).toBe('2026-02');
    expect(getDateKey(date)).toBe('2026-02-17');
  });

  it('calculates remaining days in UTC month', () => {
    const date = new Date('2026-02-17T08:00:00.000Z');
    expect(getDaysRemainingInMonth(date)).toBe(12);
  });

  it('rolls budget within bounds', () => {
    const budgetLow = rollMonthlyBudget(10, 20, () => 0);
    const budgetHigh = rollMonthlyBudget(10, 20, () => 0.999999);

    expect(budgetLow).toBe(10);
    expect(budgetHigh).toBe(20);
  });

  it('clamps base play chance for edge cases', () => {
    expect(calculateBasePlayChance(0, 10)).toBe(0);
    expect(calculateBasePlayChance(1, 200)).toBe(0.08);
    expect(calculateBasePlayChance(100, 1)).toBe(0.95);
  });
});
