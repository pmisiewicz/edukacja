import type { OptionDef, Options } from './types';

export function getString(options: Options, key: string): string {
  const v = options[key];
  return typeof v === 'string' ? v : '';
}

export function getBool(options: Options, key: string): boolean {
  return options[key] === true;
}

export function getNumber(options: Options, key: string): number {
  const v = options[key];
  return typeof v === 'number' ? v : 0;
}

export function defaultOptions(defs: OptionDef[]): Options {
  const out: Options = {};
  for (const d of defs) out[d.key] = d.default;
  return out;
}

/** Keeps only known keys with valid values; everything else falls back to defaults. */
export function normalizeOptions(defs: OptionDef[], raw: unknown): Options {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out: Options = {};
  for (const d of defs) {
    const v = src[d.key];
    if (d.type === 'checkbox') {
      out[d.key] = typeof v === 'boolean' ? v : d.default;
    } else if (d.type === 'number') {
      const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
      out[d.key] = Number.isFinite(n) ? Math.min(d.max, Math.max(d.min, Math.round(n))) : d.default;
    } else {
      out[d.key] = typeof v === 'string' && d.choices.some((c) => c.value === v) ? v : d.default;
    }
  }
  return out;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
