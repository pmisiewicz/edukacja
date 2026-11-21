import { describe, expect, it } from 'vitest';
import { modules } from '../tasks';
import { createRng, hashSeed, pickDistinct } from './rng';
import { loadState, serializeSettings, stateToQuery } from './state';

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(hashSeed('abc'));
    const b = createRng(hashSeed('abc'));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('pickDistinct avoids repeats while the pool allows', () => {
    const picked = pickDistinct(createRng(1), [1, 2, 3, 4, 5], 5);
    expect(new Set(picked).size).toBe(5);
    expect(pickDistinct(createRng(1), [1, 2], 5)).toHaveLength(5);
  });
});

describe('state', () => {
  const seed = () => 'fixed1';

  it('uses defaults with empty URL and storage', () => {
    const s = loadState(modules, '', null, seed);
    expect(s.task).toBe('clock');
    expect(s.seed).toBe('fixed1');
    expect(s.perTask.clock.count).toBe(12);
    expect(s.perTask.clock.options.precision).toBe('quarter');
  });

  it('round-trips through the URL', () => {
    const s = loadState(modules, '', null, seed);
    s.task = 'math';
    s.seed = 'zz9';
    s.answers = true;
    s.perTask.math.count = 60;
    s.perTask.math.options.maxResult = 100;
    s.perTask.math.options.ops = 'sub';
    const query = stateToQuery(s, modules.find((m) => m.id === 'math')!);
    const back = loadState(modules, `?${query}`, null, seed);
    expect(back.task).toBe('math');
    expect(back.seed).toBe('zz9');
    expect(back.answers).toBe(true);
    expect(back.perTask.math).toEqual(s.perTask.math);
  });

  it('restores settings from storage and rejects garbage', () => {
    const s = loadState(modules, '', null, seed);
    s.perTask.thermometer.options.negatives = true;
    s.task = 'thermometer';
    const restored = loadState(modules, '', serializeSettings(s), seed);
    expect(restored.task).toBe('thermometer');
    expect(restored.perTask.thermometer.options.negatives).toBe(true);

    const bad = loadState(modules, '?t=nope&n=999&o_precision=xyz&s=<script>', '{not json', seed);
    expect(bad.task).toBe('clock');
    expect(bad.seed).toBe('fixed1');
    expect(bad.perTask.clock.count).toBe(12);
    expect(bad.perTask.clock.options.precision).toBe('quarter');
  });

  it('clamps number options', () => {
    const s = loadState(modules, '?t=math&o_maxResult=99999&o_maxB=-5', null, seed);
    expect(s.perTask.math.options.maxResult).toBe(1000);
    expect(s.perTask.math.options.maxB).toBe(0);
  });
});
