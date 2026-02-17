import { clamp } from '@/bots/lib/random';

export function getMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysRemainingInMonth(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const today = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Math.max(1, lastDay - today + 1);
}

export function rollMonthlyBudget(
  min: number,
  max: number,
  random: () => number,
): number {
  const safeMin = Math.max(0, Math.floor(min));
  const safeMax = Math.max(safeMin, Math.floor(max));
  const span = safeMax - safeMin + 1;
  return safeMin + Math.floor(random() * span);
}

export function calculateBasePlayChance(
  remainingBudget: number,
  daysRemaining: number,
): number {
  if (remainingBudget <= 0) {
    return 0;
  }

  const raw = remainingBudget / Math.max(1, daysRemaining);
  return clamp(raw, 0.08, 0.95);
}
