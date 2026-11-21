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
      const tasks = generateThermometerTasks(createRng(step), 12, step, false);
      for (const { temperature } of tasks) {
        expect(temperature % step).toBe(0);
        expect(temperature).toBeGreaterThanOrEqual(0);
        expect(temperature).toBeLessThanOrEqual(50);
      }
    }
  });

  it('allows negatives down to -30 when enabled', () => {
    const temps = generateThermometerTasks(createRng(3), 12, 1, true).map((t) => t.temperature);
    expect(Math.min(...temps)).toBeGreaterThanOrEqual(-30);
    expect(temps.some((t) => t < 0)).toBe(true);
  });

  it('formats with typographic minus', () => {
    expect(formatTemperature(-5)).toBe('−5 °C');
    expect(formatTemperature(23)).toBe('23 °C');
  });
});

describe('math generator', () => {
  const cases = [
    { maxResult: 20, maxA: 20, maxB: 10 },
    { maxResult: 10, maxA: 100, maxB: 100 },
    { maxResult: 100, maxA: 5, maxB: 3 },
    { maxResult: 1, maxA: 1, maxB: 1 },
  ];
  for (const limits of cases) {
    it(`respects limits ${JSON.stringify(limits)}`, () => {
      for (const seed of [1, 2, 3]) {
        for (const t of generateMathTasks(createRng(seed), 60, 'mixed', limits)) {
          expect(t.result).toBe(t.op === '+' ? t.a + t.b : t.a - t.b);
          expect(t.result).toBeGreaterThanOrEqual(0);
          expect(t.result).toBeLessThanOrEqual(limits.maxResult);
          expect(t.a).toBeLessThanOrEqual(limits.maxA);
          expect(t.b).toBeLessThanOrEqual(limits.maxB);
          expect(t.a).toBeGreaterThanOrEqual(0);
          expect(t.b).toBeGreaterThanOrEqual(0);
        }
      }
    });
  }

  it('honours operator mode', () => {
    const limits = { maxResult: 20, maxA: 20, maxB: 10 };
    expect(generateMathTasks(createRng(1), 30, 'add', limits).every((t) => t.op === '+')).toBe(true);
    expect(generateMathTasks(createRng(1), 30, 'sub', limits).every((t) => t.op === '-')).toBe(true);
  });
});
