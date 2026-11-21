import { randomInt, type Rng } from '../../core/rng';

export type Operator = '+' | '-';
export type OperatorMode = 'add' | 'sub' | 'mixed';

export interface MathTask {
  a: number;
  op: Operator;
  b: number;
  result: number;
}

export interface Range {
  min: number;
  max: number;
}

export interface MathLimits {
  /** First number (A). */
  a: Range;
  /** Second number (B). */
  b: Range;
  /** Result of the operation. */
  result: Range;
}

const intersect = (x: Range, y: Range): Range => ({ min: Math.max(x.min, y.min), max: Math.min(x.max, y.max) });
const isEmpty = (r: Range) => r.min > r.max;

/**
 * Range of A for which at least one valid B exists:
 *   A + B = R  →  A ∈ [Rmin − Bmax, Rmax − Bmin]
 *   A − B = R  →  A ∈ [Bmin + Rmin, Bmax + Rmax]
 */
function rangeOfA(op: Operator, l: MathLimits): Range {
  const fromOthers =
    op === '+'
      ? { min: l.result.min - l.b.max, max: l.result.max - l.b.min }
      : { min: l.b.min + l.result.min, max: l.b.max + l.result.max };
  return intersect(l.a, fromOthers);
}

/** Range of B for a chosen A, given the result limits. */
function rangeOfB(op: Operator, a: number, l: MathLimits): Range {
  const fromResult =
    op === '+'
      ? { min: l.result.min - a, max: l.result.max - a }
      : { min: a - l.result.max, max: a - l.result.min };
  return intersect(l.b, fromResult);
}

/** Whether any task with this operator satisfies the limits. */
export function isFeasible(op: Operator, l: MathLimits): boolean {
  return !isEmpty(rangeOfA(op, l));
}

function makeTask(rng: Rng, op: Operator, l: MathLimits): MathTask {
  const ra = rangeOfA(op, l);
  const a = randomInt(rng, ra.min, ra.max);
  const rb = rangeOfB(op, a, l);
  const b = randomInt(rng, rb.min, rb.max);
  return { a, op, b, result: op === '+' ? a + b : a - b };
}

/** Returns an empty list when no operation fits the limits. */
export function generateMathTasks(rng: Rng, count: number, mode: OperatorMode, limits: MathLimits): MathTask[] {
  const wanted: Operator[] = mode === 'add' ? ['+'] : mode === 'sub' ? ['-'] : ['+', '-'];
  const ops = wanted.filter((op) => isFeasible(op, limits));
  if (ops.length === 0) return [];

  const out: MathTask[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const op = ops.length === 1 ? ops[0] : rng() < 0.5 ? ops[0] : ops[1];
    let task = makeTask(rng, op, limits);
    // Avoid repeats while it's still easy to find a fresh one.
    for (let tries = 0; tries < 20 && seen.has(key(task)); tries++) task = makeTask(rng, op, limits);
    seen.add(key(task));
    out.push(task);
  }
  return out;
}

const key = (t: MathTask) => `${t.a}${t.op}${t.b}`;

export const operatorSymbol = (op: Operator) => (op === '+' ? '+' : '−');
