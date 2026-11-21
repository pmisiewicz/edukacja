import { getBool } from '../../core/options';
import { randomInt, type Rng } from '../../core/rng';
import type { TaskModule } from '../../core/types';

export interface RulerTask {
  /** Start of the segment, mm from the ruler's zero. */
  start: number;
  /** Length of the segment, mm. */
  length: number;
}

const RULER_CM = 15;

export function generateRulerTasks(rng: Rng, count: number, withMm: boolean, offset: boolean): RulerTask[] {
  const out: RulerTask[] = [];
  for (let i = 0; i < count; i++) {
    const length = withMm ? randomInt(rng, 15, 140) : randomInt(rng, 2, 14) * 10;
    const maxStartCm = Math.floor((RULER_CM * 10 - length) / 10);
    const start = offset ? randomInt(rng, 1, Math.max(1, maxStartCm)) * 10 : 0;
    out.push({ start: Math.min(start, RULER_CM * 10 - length), length });
  }
  return out;
}

export function formatLength(mm: number): string {
  const cm = Math.floor(mm / 10);
  const rest = mm % 10;
  return rest ? `${cm} cm ${rest} mm` : `${cm} cm`;
}

/** Drawn 1:1 (viewBox units are millimetres), so the ruler is real-size on paper. */
function rulerSvg(t: RulerTask, guides: boolean, color: boolean): string {
  const X0 = 6; // x of the ruler's zero
  const top = 11;
  const p: string[] = [];
  p.push(
    `<rect x="2" y="${top}" width="${RULER_CM * 10 + 8}" height="15" rx="1" fill="${color ? '#fef3c7' : '#fff'}" stroke="#111" stroke-width="0.35"/>`,
  );
  for (let mm = 0; mm <= RULER_CM * 10; mm++) {
    const len = mm % 10 === 0 ? 4.5 : mm % 5 === 0 ? 3.2 : 2;
    const w = mm % 10 === 0 ? 0.3 : 0.18;
    p.push(`<line x1="${X0 + mm}" y1="${top}" x2="${X0 + mm}" y2="${top + len}" stroke="#111" stroke-width="${w}"/>`);
    if (mm % 10 === 0) {
      p.push(`<text x="${X0 + mm}" y="${top + 8}" font-size="3.4" text-anchor="middle" fill="#111">${mm / 10}</text>`);
    }
  }
  p.push(`<text x="${X0 + RULER_CM * 10 - 1}" y="${top + 13}" font-size="2.6" text-anchor="end" fill="#111">cm</text>`);

  const x1 = X0 + t.start;
  const x2 = X0 + t.start + t.length;
  const stroke = color ? '#2563eb' : '#111';
  p.push(`<line x1="${x1}" y1="5" x2="${x2}" y2="5" stroke="${stroke}" stroke-width="1.4"/>`);
  for (const x of [x1, x2]) {
    p.push(`<line x1="${x}" y1="2.5" x2="${x}" y2="7.5" stroke="${stroke}" stroke-width="0.5"/>`);
    if (guides) {
      p.push(`<line x1="${x}" y1="7.5" x2="${x}" y2="${top}" stroke="#888" stroke-width="0.2" stroke-dasharray="0.8 0.8"/>`);
    }
  }
  return `<svg class="real-size" viewBox="0 0 ${RULER_CM * 10 + 12} 28" style="width:${RULER_CM * 10 + 12}mm;height:28mm" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">${p.join('')}</svg>`;
}

export const rulerModule: TaskModule<RulerTask> = {
  id: 'ruler',
  name: 'Linijka',
  category: 'Czas i mierzenie',
  options: [
    { type: 'checkbox', key: 'mm', label: 'Z milimetrami (cm i mm)', default: false },
    { type: 'checkbox', key: 'offset', label: 'Odcinek nie zaczyna się od zera', default: false },
    { type: 'checkbox', key: 'guides', label: 'Linie pomocnicze do linijki', default: true },
  ],
  counts: [3, 4, 5],
  defaultCount: 5,

  defaultInstruction: (o) =>
    getBool(o, 'mm') ? 'Zmierz odcinek i wpisz jego długość w centymetrach i milimetrach.' : 'Zmierz odcinek i wpisz jego długość.',

  layout: (count) => ({ columns: 1, rows: count }),

  generate: (rng, count, o) => generateRulerTasks(rng, count, getBool(o, 'mm'), getBool(o, 'offset')),

  renderTask(t, ctx) {
    const answer = getBool(ctx.options, 'mm')
      ? '<span class="box wide"></span><span class="unit">cm</span><span class="box wide"></span><span class="unit">mm</span>'
      : '<span class="box wide"></span><span class="unit">cm</span>';
    return `<div class="figure">${rulerSvg(t, getBool(ctx.options, 'guides'), ctx.color)}</div><div class="answer roomy">${answer}</div>`;
  },

  renderAnswer: (t, ctx) =>
    `<div class="figure">${rulerSvg(t, getBool(ctx.options, 'guides'), ctx.color)}</div><div class="answer roomy prompt">${formatLength(t.length)}</div>`,
};
