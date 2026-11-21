import { defaultOptions, normalizeOptions } from './options';
import type { AnyTaskModule, Options } from './types';

export interface TaskSettings {
  count: number;
  /** Custom instruction; empty means "use the module default". */
  instruction: string;
  options: Options;
}

export interface AppState {
  task: string;
  seed: string;
  answers: boolean;
  color: boolean;
  perTask: Record<string, TaskSettings>;
}

export const STORAGE_KEY = 'edukacja:settings:v1';

export function defaultTaskSettings(m: AnyTaskModule): TaskSettings {
  return { count: m.defaultCount, instruction: '', options: defaultOptions(m.options) };
}

export function normalizeTaskSettings(m: AnyTaskModule, raw: unknown): TaskSettings {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const count = typeof src.count === 'number' && m.counts.includes(src.count) ? src.count : m.defaultCount;
  const instruction = typeof src.instruction === 'string' ? src.instruction.slice(0, 200) : '';
  return { count, instruction, options: normalizeOptions(m.options, src.options) };
}

/**
 * Builds the app state from stored settings (localStorage) with URL parameters
 * applied on top. Pure function, so it is easy to test.
 */
export function loadState(
  modules: AnyTaskModule[],
  search: string,
  stored: string | null,
  makeSeed: () => string,
): AppState {
  let saved: Record<string, unknown> = {};
  try {
    const parsed: unknown = stored ? JSON.parse(stored) : {};
    if (parsed && typeof parsed === 'object') saved = parsed as Record<string, unknown>;
  } catch {
    saved = {};
  }
  const savedPerTask = (saved.perTask && typeof saved.perTask === 'object' ? saved.perTask : {}) as Record<
    string,
    unknown
  >;

  const perTask: Record<string, TaskSettings> = {};
  for (const m of modules) perTask[m.id] = normalizeTaskSettings(m, savedPerTask[m.id]);

  const params = new URLSearchParams(search);
  const isKnown = (id: unknown): id is string => modules.some((m) => m.id === id);
  const task = isKnown(params.get('t')) ? params.get('t')! : isKnown(saved.task) ? saved.task : modules[0].id;

  const state: AppState = {
    task,
    seed: sanitizeSeed(params.get('s')) ?? makeSeed(),
    answers: params.has('ans') ? params.get('ans') === '1' : saved.answers === true,
    color: params.has('col') ? params.get('col') === '1' : saved.color === true,
    perTask,
  };

  // URL overrides for the current task.
  const m = modules.find((x) => x.id === task)!;
  const current = perTask[task];
  const rawOptions: Record<string, unknown> = { ...current.options };
  for (const d of m.options) {
    const v = params.get(`o_${d.key}`);
    if (v === null) continue;
    rawOptions[d.key] = d.type === 'checkbox' ? v === '1' : v;
  }
  const n = params.get('n');
  perTask[task] = normalizeTaskSettings(m, {
    count: n !== null ? Number(n) : current.count,
    instruction: params.get('i') ?? current.instruction,
    options: rawOptions,
  });

  return state;
}

function sanitizeSeed(s: string | null): string | null {
  return s && /^[a-z0-9]{1,16}$/i.test(s) ? s : null;
}

/** Query string that fully reproduces the current sheet. */
export function stateToQuery(state: AppState, m: AnyTaskModule): string {
  const ts = state.perTask[m.id];
  const p = new URLSearchParams();
  p.set('t', m.id);
  p.set('s', state.seed);
  p.set('n', String(ts.count));
  for (const d of m.options) {
    const v = ts.options[d.key];
    p.set(`o_${d.key}`, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
  }
  if (ts.instruction) p.set('i', ts.instruction);
  p.set('ans', state.answers ? '1' : '0');
  p.set('col', state.color ? '1' : '0');
  return p.toString();
}

/** What goes to localStorage: everything except the seed. */
export function serializeSettings(state: AppState): string {
  const { task, answers, color, perTask } = state;
  return JSON.stringify({ task, answers, color, perTask });
}
