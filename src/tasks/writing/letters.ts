import { escapeHtml, getString } from '../../core/options';
import { pickDistinct } from '../../core/rng';
import type { TaskModule } from '../../core/types';
import { lines, ROW_WIDTH, rowSvg, TRACE_OPTION, traceFraction } from './shared';

const LOWER = 'a ą b c ć d e ę f g h i j k l ł m n ń o ó p r s ś t u w y z ź ż'.split(' ');
const UPPER = LOWER.map((l) => l.toUpperCase());

/**
 * Ruling like a first-grade exercise book: ascender line, x-height band (shaded), baseline, descender line.
 * Font size is tuned so Playwrite PL's x-height fills the band.
 */
const ASC = 4;
const XTOP = 11;
const BASE = 18;
const DESC = 25;
const ROW_H = 29;
/** Playwrite PL: x-height 0.52 em, ascender 1.0 em, descender 0.51 em → x-height = BASE − XTOP. */
const FONT_SIZE = 13.5;
const GAP = 7;

let measureCtx: CanvasRenderingContext2D | null | undefined;

/** Width of `s` in row units; measured with the real font in the browser, estimated elsewhere. */
function textWidth(s: string): number {
  if (typeof document !== 'undefined') {
    measureCtx ??= document.createElement('canvas').getContext('2d');
    if (measureCtx) {
      measureCtx.font = `${FONT_SIZE * 10}px 'Playwrite PL', cursive`;
      return measureCtx.measureText(s).width / 10;
    }
  }
  return [...s].length * FONT_SIZE * 0.75;
}

export interface LetterTask {
  text: string;
}

export function parseCustom(input: string): string[] {
  return input
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function letterRow(t: LetterTask, traceShare: number, full: boolean, color: boolean): string {
  const x0 = 3;
  const step = textWidth(t.text) + GAP;
  const reps = Math.max(1, Math.floor((ROW_WIDTH - x0) / step));
  const traced = full ? reps - 1 : Math.max(1, Math.round(reps * traceShare) - 1);
  const text = escapeHtml(t.text);
  const glyph = (i: number, fill: string) =>
    `<text x="${x0 + i * step}" y="${BASE}" font-size="${FONT_SIZE}" fill="${fill}">${text}</text>`;

  let body =
    `<rect x="0" y="${XTOP}" width="${ROW_WIDTH}" height="${BASE - XTOP}" fill="${color ? '#fef9c3' : '#f3f4f6'}"/>` +
    lines([{ y: ASC }, { y: XTOP, strong: true }, { y: BASE, strong: true }, { y: DESC }]);
  body += glyph(0, '#111');
  for (let i = 1; i <= traced; i++) body += glyph(i, full ? '#111' : '#b8bcc4');
  return rowSvg(ROW_H, `<g font-family="'Playwrite PL', cursive">${body}</g>`);
}

export const lettersModule: TaskModule<LetterTask> = {
  id: 'letters',
  name: 'Litery pisane',
  category: 'Pisanie',
  numbered: false,
  options: [
    {
      type: 'select',
      key: 'set',
      label: 'Litery',
      choices: [
        { value: 'lower', label: 'Małe litery' },
        { value: 'upper', label: 'Wielkie litery' },
        { value: 'pairs', label: 'Pary (Aa, Bb…)' },
      ],
      default: 'lower',
    },
    {
      type: 'text',
      key: 'custom',
      label: 'Własne litery lub wyrazy (zastępują losowe)',
      placeholder: 'np. a, ą, mama, Ola',
      maxLength: 200,
      default: '',
    },
    TRACE_OPTION,
  ],
  counts: [6, 8, 10],
  defaultCount: 8,

  defaultInstruction: () => 'Napisz po śladzie, a potem pisz dalej sam do końca linii.',

  layout: (count) => ({ columns: 1, rows: count }),

  generate(rng, count, o) {
    const custom = parseCustom(getString(o, 'custom'));
    if (custom.length) return Array.from({ length: count }, (_, i) => ({ text: custom[i % custom.length] }));
    const set = getString(o, 'set');
    const pool = set === 'upper' ? UPPER : set === 'pairs' ? LOWER.map((l) => l.toUpperCase() + l) : LOWER;
    return pickDistinct(rng, pool, count).map((text) => ({ text }));
  },

  renderTask: (t, ctx) =>
    `<div class="figure">${letterRow(t, traceFraction(getString(ctx.options, 'trace')), false, ctx.color)}</div>`,
  renderAnswer: (t, ctx) => `<div class="figure">${letterRow(t, 1, true, ctx.color)}</div>`,
};
