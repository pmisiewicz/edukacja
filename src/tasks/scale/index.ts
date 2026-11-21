import { getString } from '../../core/options';
import { pickDistinct, type Rng } from '../../core/rng';
import type { Options, TaskModule } from '../../core/types';

export type ScaleKind = 'g1000' | 'kg5';
export type ScalePrecision = 'major' | 'mid' | 'minor';

/** Dial definitions, all values in grams. */
export const SCALES: Record<ScaleKind, { max: number; minor: number; mid: number; major: number }> = {
  g1000: { max: 1000, minor: 10, mid: 50, major: 100 },
  kg5: { max: 5000, minor: 100, mid: 500, major: 1000 },
};

export interface ScaleTask {
  grams: number;
}

export function generateScaleTasks(rng: Rng, count: number, kind: ScaleKind, precision: ScalePrecision): ScaleTask[] {
  const s = SCALES[kind] ?? SCALES.g1000;
  const step = s[precision] ?? s.mid;
  const pool: number[] = [];
  for (let g = step; g < s.max; g += step) pool.push(g);
  return pickDistinct(rng, pool, count).map((grams) => ({ grams }));
}

export function formatMass(grams: number, kind: ScaleKind): string {
  if (kind === 'g1000') return `${grams} g`;
  const kg = Math.floor(grams / 1000);
  const g = grams % 1000;
  if (!kg) return `${g} g`;
  return g ? `${kg} kg ${g} g` : `${kg} kg`;
}

// ---------- drawing ----------

const CX = 100;
const CY = 118;
const R = 72;
const SWEEP = 330; // degrees from 0 (top) clockwise to max

function polar(angle: number, r: number): [number, number] {
  const a = ((angle - 90) * Math.PI) / 180;
  return [+(CX + r * Math.cos(a)).toFixed(2), +(CY + r * Math.sin(a)).toFixed(2)];
}

function scaleSvg(kind: ScaleKind, grams: number | null, color: boolean): string {
  const s = SCALES[kind];
  const p: string[] = [];
  // Bowl, stem and body.
  p.push(`<path d="M38 12 H162 L150 30 H50 Z" fill="${color ? '#dbeafe' : '#fff'}" stroke="#111" stroke-width="2"/>`);
  p.push(`<rect x="92" y="30" width="16" height="10" fill="#fff" stroke="#111" stroke-width="2"/>`);
  p.push(
    `<rect x="14" y="40" width="172" height="164" rx="22" fill="${color ? '#e0f2fe' : '#fff'}" stroke="#111" stroke-width="2.5"/>`,
  );
  p.push(`<circle cx="${CX}" cy="${CY}" r="${R + 6}" fill="#fff" stroke="#111" stroke-width="2"/>`);

  for (let g = 0; g <= s.max; g += s.minor) {
    const angle = (g / s.max) * SWEEP;
    const major = g % s.major === 0;
    const mid = !major && g % s.mid === 0;
    const [x1, y1] = polar(angle, R - (major ? 12 : mid ? 8 : 5));
    const [x2, y2] = polar(angle, R);
    p.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="${major ? 2 : mid ? 1.3 : 0.7}"/>`);
    if (major) {
      const [tx, ty] = polar(angle, R - 22);
      const label = kind === 'kg5' ? g / 1000 : g;
      p.push(
        `<text x="${tx}" y="${ty}" font-size="${kind === 'kg5' ? 13 : 9}" font-weight="600" text-anchor="middle" dominant-baseline="central" fill="#111">${label}</text>`,
      );
    }
  }
  p.push(
    `<text x="${CX}" y="${CY + 34}" font-size="12" font-weight="600" text-anchor="middle" fill="#111">${kind === 'kg5' ? 'kg' : 'g'}</text>`,
  );

  if (grams !== null) {
    const angle = (grams / s.max) * SWEEP;
    const [x2, y2] = polar(angle, R - 3);
    const [x1, y1] = polar(angle + 180, 10);
    p.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color ? '#dc2626' : '#111'}" stroke-width="2.5" stroke-linecap="round"/>`,
    );
  }
  p.push(`<circle cx="${CX}" cy="${CY}" r="5" fill="#111"/>`);
  return `<svg viewBox="10 8 180 200" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">${p.join('')}</svg>`;
}

const kindOf = (o: Options) => (getString(o, 'kind') as ScaleKind) || 'g1000';

export const scaleModule: TaskModule<ScaleTask> = {
  id: 'scale',
  name: 'Waga kuchenna',
  category: 'Czas i mierzenie',
  options: [
    {
      type: 'select',
      key: 'mode',
      label: 'Co robi uczeń',
      choices: [
        { value: 'read', label: 'Odczytuje masę' },
        { value: 'draw', label: 'Rysuje wskazówkę' },
      ],
      default: 'read',
    },
    {
      type: 'select',
      key: 'kind',
      label: 'Skala',
      choices: [
        { value: 'g1000', label: '0–1000 g' },
        { value: 'kg5', label: '0–5 kg' },
      ],
      default: 'g1000',
    },
    {
      type: 'select',
      key: 'precision',
      label: 'Dokładność',
      choices: [
        { value: 'major', label: 'Pełne (100 g / 1 kg)' },
        { value: 'mid', label: 'Połówki (50 g / 500 g)' },
        { value: 'minor', label: 'Dokładnie (10 g / 100 g)' },
      ],
      default: 'major',
    },
  ],
  counts: [4, 6, 9, 12],
  defaultCount: 6,

  defaultInstruction: (o) =>
    getString(o, 'mode') === 'draw' ? 'Narysuj wskazówkę, aby waga pokazywała podaną masę.' : 'Ile waży? Odczytaj i wpisz.',

  layout: (count) => {
    const columns = count <= 4 ? 2 : 3;
    return { columns, rows: Math.ceil(count / columns) };
  },

  generate: (rng, count, o) =>
    generateScaleTasks(rng, count, kindOf(o), getString(o, 'precision') as ScalePrecision),

  renderTask(t, ctx) {
    const kind = kindOf(ctx.options);
    if (getString(ctx.options, 'mode') === 'draw') {
      return `<div class="figure">${scaleSvg(kind, null, ctx.color)}</div><div class="answer prompt">${formatMass(t.grams, kind)}</div>`;
    }
    const answer =
      kind === 'kg5'
        ? '<span class="box"></span><span class="unit">kg</span><span class="box wide"></span><span class="unit">g</span>'
        : '<span class="box wide"></span><span class="unit">g</span>';
    return `<div class="figure">${scaleSvg(kind, t.grams, ctx.color)}</div><div class="answer">${answer}</div>`;
  },

  renderAnswer(t, ctx) {
    const kind = kindOf(ctx.options);
    return `<div class="figure">${scaleSvg(kind, t.grams, ctx.color)}</div><div class="answer prompt">${formatMass(t.grams, kind)}</div>`;
  },
};
