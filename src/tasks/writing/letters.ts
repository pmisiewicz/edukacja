import { escapeHtml, getString } from '../../core/options';
import { pickDistinct } from '../../core/rng';
import type { RenderContext, TaskModule } from '../../core/types';
import { clearFont, letterFont, uploadFont } from './font';
import { lines, rowSvg, rowWidth, TRACE_OPTION, traceFraction } from './shared';

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
const BUILT_IN_SIZE = 13.5;

/** Font size that puts the x-height on the shaded band, shrunk if ascenders/descenders would leave the ruling. */
function fontSize(): number {
  const m = letterFont().metrics;
  if (!m) return BUILT_IN_SIZE;
  const size = Math.min((BASE - XTOP) / m.xHeight, (BASE - ASC + 1) / m.ascender, (DESC - BASE + 1) / m.descender);
  return Math.round(size * 100) / 100;
}
const GAP = 7;

let measureCtx: CanvasRenderingContext2D | null | undefined;

/** Width of `s` in row units; measured with the real font in the browser, estimated elsewhere. */
function textWidth(s: string, size: number): number {
  if (typeof document !== 'undefined') {
    measureCtx ??= document.createElement('canvas').getContext('2d');
    if (measureCtx) {
      measureCtx.font = `${size * 10}px ${letterFont().family}`;
      return measureCtx.measureText(s).width / 10;
    }
  }
  return [...s].length * size * 0.75;
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

function letterRow(t: LetterTask, traceShare: number, full: boolean, ctx: RenderContext): string {
  const width = rowWidth(ROW_H, ctx.cellAspect);
  const x0 = 3;
  const size = fontSize();
  const step = textWidth(t.text, size) + GAP;
  const reps = Math.max(1, Math.floor((width - x0 + GAP) / step));
  const traced = full ? reps - 1 : Math.max(1, Math.round(reps * traceShare) - 1);
  const text = escapeHtml(t.text);
  const glyph = (i: number, fill: string) =>
    `<text x="${x0 + i * step}" y="${BASE}" font-size="${size}" fill="${fill}">${text}</text>`;

  let body =
    `<rect x="0" y="${XTOP}" width="${width}" height="${BASE - XTOP}" fill="${ctx.color ? '#fef9c3' : '#f3f4f6'}"/>` +
    lines(width, [{ y: ASC }, { y: XTOP, strong: true }, { y: BASE, strong: true }, { y: DESC }]);
  body += glyph(0, '#111');
  for (let i = 1; i <= traced; i++) body += glyph(i, full ? '#111' : '#b8bcc4');
  return rowSvg(width, ROW_H, `<g font-family="${letterFont().family.replace(/"/g, '')}">${body}</g>`);
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
    `<div class="figure">${letterRow(t, traceFraction(getString(ctx.options, 'trace')), false, ctx)}</div>`,
  renderAnswer: (t, ctx) => `<div class="figure">${letterRow(t, 1, true, ctx)}</div>`,

  panelExtras: (refresh) => [fontControls(refresh)],
};

/** "Czcionka" field: upload your own cursive font (e.g. the one from the child's primer) or go back to the built-in. */
function fontControls(refresh: () => void): HTMLElement {
  const el = (tag: string, props: Record<string, string>, text = ''): HTMLElement => {
    const node = Object.assign(document.createElement(tag), props);
    if (text) node.textContent = text;
    return node;
  };
  const f = letterFont();
  const wrap = el('div', { className: 'field font-field' });
  wrap.append(el('span', { className: 'field-label' }, 'Czcionka'));
  wrap.append(
    el(
      'p',
      { className: f.name ? 'font-note' : 'font-note warn' },
      f.name
        ? `Własna: ${f.name}`
        : 'Wbudowana (Playwrite Polska) nie jest wzorem z elementarza — np. p, ł i wielkie G, J, L, Y mogą wyglądać inaczej. Najlepiej wczytaj czcionkę pisma szkolnego.',
    ),
  );
  const input = el('input', { type: 'file', accept: '.ttf,.otf,.woff,.woff2' }) as HTMLInputElement;
  input.style.display = 'none';
  const status = el('p', { className: 'font-note' });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    status.textContent = 'Wczytuję…';
    try {
      await uploadFont(file);
      refresh();
    } catch {
      status.textContent = 'To nie jest plik czcionki (TTF, OTF, WOFF lub WOFF2).';
    }
  });
  const pick = el('button', { className: 'btn small', type: 'button' }, f.name ? 'Zmień czcionkę…' : 'Wczytaj czcionkę…');
  pick.addEventListener('click', () => input.click());
  const row = el('div', { className: 'font-actions' });
  row.append(pick);
  if (f.name) {
    const reset = el('button', { className: 'btn small', type: 'button' }, 'Wbudowana');
    reset.addEventListener('click', async () => {
      await clearFont();
      refresh();
    });
    row.append(reset);
  }
  wrap.append(row, input, status);
  return wrap;
}
