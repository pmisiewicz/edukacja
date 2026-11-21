import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import { daysInMonth, generateCalendarTasks, weekday } from './calendar';
import { endTime, formatDuration, generateElapsedTasks } from './elapsed';
import { COINS_GR, COINS_ZL, formatMoney, generateMoneyTasks, NOTES } from './money';
import { formatLength, generateRulerTasks } from './ruler';
import { formatMass, generateScaleTasks, SCALES } from './scale';
import { parseCustom } from './writing/letters';
import { PATTERNS } from './writing/patterns';
import { modules } from '.';

describe('ruler', () => {
  it('keeps segments on the 15 cm ruler', () => {
    for (const [mm, offset] of [
      [false, false],
      [true, false],
      [true, true],
      [false, true],
    ]) {
      for (const t of generateRulerTasks(createRng(5), 50, mm, offset)) {
        expect(t.start).toBeGreaterThanOrEqual(0);
        expect(t.start + t.length).toBeLessThanOrEqual(150);
        if (!mm) expect(t.length % 10).toBe(0);
        if (!offset) expect(t.start).toBe(0);
      }
    }
  });

  it('formats lengths', () => {
    expect(formatLength(70)).toBe('7 cm');
    expect(formatLength(74)).toBe('7 cm 4 mm');
  });
});

describe('money', () => {
  const all = [...COINS_GR, ...COINS_ZL, ...NOTES];
  it('items add up to the total and use real denominations', () => {
    for (const max of [10, 20, 100, 500]) {
      for (const grosze of [false, true]) {
        for (const t of generateMoneyTasks(createRng(max), 30, max, grosze)) {
          expect(t.items.reduce((a, b) => a + b, 0)).toBe(t.total);
          expect(t.items.every((d) => all.includes(d))).toBe(true);
          expect(t.total).toBeLessThanOrEqual(max * 100);
          expect(t.total).toBeGreaterThan(0);
          expect(t.items.every((d) => d <= max * 100)).toBe(true);
          if (!grosze) expect(t.total % 100).toBe(0);
        }
      }
    }
  });

  it('formats amounts', () => {
    expect(formatMoney(1250)).toBe('12 zł 50 gr');
    expect(formatMoney(1200)).toBe('12 zł');
    expect(formatMoney(5)).toBe('5 gr');
  });
});

describe('scale', () => {
  it('values are positive multiples of the precision below max', () => {
    for (const kind of ['g1000', 'kg5'] as const) {
      for (const precision of ['major', 'mid', 'minor'] as const) {
        for (const t of generateScaleTasks(createRng(2), 12, kind, precision)) {
          expect(t.grams % SCALES[kind][precision]).toBe(0);
          expect(t.grams).toBeGreaterThan(0);
          expect(t.grams).toBeLessThan(SCALES[kind].max);
        }
      }
    }
  });

  it('formats masses', () => {
    expect(formatMass(750, 'g1000')).toBe('750 g');
    expect(formatMass(2300, 'kg5')).toBe('2 kg 300 g');
    expect(formatMass(3000, 'kg5')).toBe('3 kg');
    expect(formatMass(500, 'kg5')).toBe('500 g');
  });
});

describe('elapsed time', () => {
  it('respects step and maximum interval', () => {
    for (const t of generateElapsedTasks(createRng(9), 40, 15, 3)) {
      expect(t.minutes % 15).toBe(0);
      expect(t.start.minute % 15).toBe(0);
      expect(t.minutes).toBeGreaterThan(0);
      expect(t.minutes).toBeLessThanOrEqual(180);
    }
  });

  it('computes end time and formats durations', () => {
    expect(endTime({ start: { hour: 11, minute: 45 }, minutes: 30 })).toEqual({ hour: 12, minute: 15 });
    expect(formatDuration(75)).toBe('1 godz. 15 min');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(120)).toBe('2 godz.');
  });
});

describe('calendar', () => {
  it('weekday and month length match known dates', () => {
    expect(weekday(2026, 10, 21)).toBe(5); // 21 Nov 2026 = Saturday
    expect(daysInMonth(2028, 1)).toBe(29);
    expect(daysInMonth(2026, 1)).toBe(28);
  });

  it('generates distinct months with the requested number of questions', () => {
    const tasks = generateCalendarTasks(createRng(1), 2, 6);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].month).not.toBe(tasks[1].month);
    for (const t of tasks) {
      expect(t.questions).toHaveLength(6);
      expect(new Set(t.questions.map((q) => q.q)).size).toBe(6);
      for (const q of t.questions) expect(q.a.length).toBeGreaterThan(0);
    }
  });
});

describe('writing', () => {
  it('parses custom letters and words', () => {
    expect(parseCustom(' a, ą;mama  Ola ')).toEqual(['a', 'ą', 'mama', 'Ola']);
    expect(parseCustom('')).toEqual([]);
  });

  it('every pattern unit ends where the next one starts', () => {
    for (const p of PATTERNS) {
      const path = p.draw(0).trim().split(/[\sA-Z]+/).filter(Boolean).map(Number);
      const [nx, ny] = p.start(p.unit);
      // Last coordinate pair of the unit (H/V commands give only one number, so compare what is there).
      const last = path.slice(-2);
      if (!/[HV][^A-Z]*$/.test(p.draw(0))) expect([last[0], last[1]]).toEqual([nx, ny]);
    }
  });
});

describe('all modules', () => {
  it('generate and render every count without throwing', () => {
    for (const m of modules) {
      const options = Object.fromEntries(m.options.map((d) => [d.key, d.default]));
      for (const count of m.counts) {
        const tasks = m.generate(createRng(count), count, options);
        expect(tasks.length).toBe(count);
        const ctx = { color: true, options, cellAspect: 4 };
        for (const t of tasks) {
          expect(m.renderTask(t, ctx)).toContain('<');
          expect(m.renderAnswer(t, ctx)).toContain('<');
        }
      }
    }
  });
});
