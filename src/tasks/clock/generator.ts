import { pickDistinct, type Rng } from '../../core/rng';

export type ClockPrecision = 'hour' | 'half' | 'quarter' | 'five' | 'one';

export const PRECISION_STEP: Record<ClockPrecision, number> = {
  hour: 60,
  half: 30,
  quarter: 15,
  five: 5,
  one: 1,
};

export interface ClockTask {
  /** 0–23. The dial shows hour % 12; the 24h variant is used where enabled. */
  hour: number;
  minute: number;
}

export function generateClockTasks(rng: Rng, count: number, precision: ClockPrecision): ClockTask[] {
  const step = PRECISION_STEP[precision] ?? 15;
  const pool: { h: number; m: number }[] = [];
  for (let h = 1; h <= 12; h++) for (let m = 0; m < 60; m += step) pool.push({ h, m });
  return pickDistinct(rng, pool, count).map(({ h, m }) => {
    const pm = rng() < 0.5;
    return { hour: (h % 12) + (pm ? 12 : 0), minute: m };
  });
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 12-hour clock reading, e.g. 3:15 (12:15 for noon/midnight hour). */
export function format12(t: ClockTask): string {
  return `${t.hour % 12 || 12}:${pad(t.minute)}`;
}

/** 24-hour clock reading, e.g. 15:15 or 0:15. */
export function format24(t: ClockTask): string {
  return `${t.hour}:${pad(t.minute)}`;
}

/** Both readings a dial can mean: morning and afternoon, e.g. "3:15 i 15:15". */
export function formatBoth(t: ClockTask): string {
  const h = t.hour % 12;
  return `${h}:${pad(t.minute)} lub ${h + 12}:${pad(t.minute)}`;
}

/** Hand angles in degrees, clockwise from 12 o'clock. */
export function handAngles(t: ClockTask): { hour: number; minute: number } {
  return { hour: ((t.hour % 12) + t.minute / 60) * 30, minute: t.minute * 6 };
}
