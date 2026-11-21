import { randomInt, type Rng } from '../../core/rng';

export type Operator = '+' | '-';
export type OperatorMode = 'add' | 'sub' | 'mixed';

export interface MathTask {
  a: number;
  op: Operator;
  b: number;
  result: number;
}

export interface MathLimits {
  /** Max result of every operation. */
  maxResult: number;
  /** Max first number (A). */
  maxA: number;
  /** Max second number (B). */
  maxB: number;
}

/** Lower bound 1 (no "+ 0" / "− 0" busywork) unless the limit forces 0. */
const lo = (max: number) => (max >= 1 ? 1 : 0);

function addition(rng: Rng, l: MathLimits): MathTask {
  // Leave room for B >= 1 so the result never exceeds maxResult.
  const aMax = Math.max(0, Math.min(l.maxA, l.maxResult - lo(Math.min(l.maxB, l.maxResult))));
  const a = randomInt(rng, Math.min(lo(aMax), aMax), aMax);
  const bMax = Math.max(0, Math.min(l.maxB, l.maxResult - a));
  const b = randomInt(rng, Math.min(lo(bMax), bMax), bMax);
  return { a, op: '+', b, result: a + b };
}

function subtraction(rng: Rng, l: MathLimits): MathTask {
  // A − B = C with C >= 0, C <= maxResult, so A <= maxResult + maxB.
  const aMax = Math.min(l.maxA, l.maxResult + l.maxB);
  const a = randomInt(rng, Math.min(lo(aMax), aMax), aMax);
  const bMin = Math.max(0, a - l.maxResult);
  const bMax = Math.min(l.maxB, a);
  const b = randomInt(rng, Math.max(bMin, Math.min(lo(bMax), bMax)), bMax);
  return { a, op: '-', b, result: a - b };
}

export function generateMathTasks(rng: Rng, count: number, mode: OperatorMode, limits: MathLimits): MathTask[] {
  const out: MathTask[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const op: Operator = mode === 'add' ? '+' : mode === 'sub' ? '-' : rng() < 0.5 ? '+' : '-';
    let task = op === '+' ? addition(rng, limits) : subtraction(rng, limits);
    // Avoid repeats while it's still easy to find a fresh one.
    for (let tries = 0; tries < 20 && seen.has(key(task)); tries++) {
      task = op === '+' ? addition(rng, limits) : subtraction(rng, limits);
    }
    seen.add(key(task));
    out.push(task);
  }
  return out;
}

const key = (t: MathTask) => `${t.a}${t.op}${t.b}`;

export const operatorSymbol = (op: Operator) => (op === '+' ? '+' : '−');
