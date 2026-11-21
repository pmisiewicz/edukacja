import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import { format12, formatBoth, generateClockTasks, handAngles, PRECISION_STEP } from './clock/generator';
import { generateMathTasks } from './math/generator';
import { formatTemperature, generateThermometerTasks } from './thermometer/generator';

describe('clock generator', () => {
  for (const precision of Object.keys(PRECISION_STEP) as (keyof typeof PRECISION_STEP)[]) {
    it(`respects precision "${precision}"`, () => {
      const tasks = generateClockTasks(createRng(42), 20, precision);
      expect(tasks).toHaveLength(20);
      for (const t of tasks) {
        expect(t.minute % PRECISION_STEP[precision]).toBe(0);
        expect(t.hour).toBeGreaterThanOrEqual(0);
        expect(t.hour).toBeLessThan(24);
      }
    });
  }

  it('does not repeat times when enough exist', () => {
    const tasks = generateClockTasks(createRng(7), 20, 'quarter');
    expect(new Set(tasks.map(format12)).size).toBe(20);
  });

  it('formats and computes angles', () => {
    expect(format12({ hour: 15, minute: 5 })).toBe('3:05');
    expect(format12({ hour: 0, minute: 30 })).toBe('12:30');
    expect(formatBoth({ hour: 3, minute: 15 })).toBe('3:15 lub 15:15');
    expect(formatBoth({ hour: 12, minute: 0 })).toBe('0:00 lub 12:00');
    expect(handAngles({ hour: 3, minute: 30 })).toEqual({ hour: 105, minute: 180 });
  });
});

describe('thermometer generator', () => {
  it('stays within range and step, non-negative by default', () => {
    for (const step of [1, 2, 5, 10]) {
      const tasks = generateThermometerTasks(createRng(step), 12, step, 'plus');
      for (const { temperature } of tasks) {
        expect(temperature % step).toBe(0);
        expect(temperature).toBeGreaterThanOrEqual(0);
        expect(temperature).toBeLessThanOrEqual(50);
      }
    }
  });

  it('allows negatives down to -30 when enabled', () => {
    const temps = generateThermometerTasks(createRng(3), 12, 1, 'both').map((t) => t.temperature);
    expect(Math.min(...temps)).toBeGreaterThanOrEqual(-30);
    expect(temps.some((t) => t < 0)).toBe(true);
  });

  it('only-negative mode stays below zero for every step', () => {
    for (const step of [1, 2, 5, 10]) {
      for (const t of generateThermometerTasks(createRng(step), 12, step, 'minus')) {
        expect(t.temperature).toBeLessThan(0);
        expect(t.temperature).toBeGreaterThanOrEqual(-30);
        expect(Math.abs(t.temperature % step)).toBe(0);
      }
    }
  });

  it('formats with typographic minus', () => {
    expect(formatTemperature(-5)).toBe('−5 °C');
    expect(formatTemperature(23)).toBe('23 °C');
  });
});

describe('math generator', () => {
  const L = (a: [number, number], b: [number, number], r: [number, number]) => ({
    a: { min: a[0], max: a[1] },
    b: { min: b[0], max: b[1] },
    result: { min: r[0], max: r[1] },
  });
  const cases = [
    L([1, 20], [1, 10], [0, 20]),
    L([0, 100], [0, 100], [0, 10]),
    L([1, 5], [1, 3], [0, 100]),
    L([10, 20], [5, 9], [12, 18]),
    L([50, 99], [10, 40], [30, 60]),
    L([1, 1], [1, 1], [0, 2]),
  ];
  const within = (v: number, r: { min: number; max: number }) => v >= r.min && v <= r.max;

  for (const limits of cases) {
    it(`respects ranges ${JSON.stringify(limits)}`, () => {
      for (const mode of ['add', 'sub', 'mixed'] as const) {
        for (const seed of [1, 2, 3]) {
          for (const t of generateMathTasks(createRng(seed), 60, mode, limits)) {
            expect(t.result).toBe(t.op === '+' ? t.a + t.b : t.a - t.b);
            expect(within(t.a, limits.a)).toBe(true);
            expect(within(t.b, limits.b)).toBe(true);
            expect(within(t.result, limits.result)).toBe(true);
          }
        }
      }
    });
  }

  it('honours operator mode', () => {
    const limits = L([1, 20], [1, 10], [0, 20]);
    expect(generateMathTasks(createRng(1), 30, 'add', limits).every((t) => t.op === '+')).toBe(true);
    expect(generateMathTasks(createRng(1), 30, 'sub', limits).every((t) => t.op === '-')).toBe(true);
  });

  it('returns nothing for impossible ranges', () => {
    expect(generateMathTasks(createRng(1), 10, 'mixed', L([10, 5], [1, 10], [0, 20]))).toEqual([]);
    expect(generateMathTasks(createRng(1), 10, 'add', L([1, 5], [1, 5], [50, 60]))).toEqual([]);
  });

  it('mixed mode falls back to the feasible operator', () => {
    // A + B >= 10 > 8, so only subtraction fits.
    const tasks = generateMathTasks(createRng(1), 20, 'mixed', L([5, 9], [5, 9], [0, 4]));
    expect(tasks).toHaveLength(20);
    expect(tasks.every((t) => t.op === '-')).toBe(true);
  });
});
