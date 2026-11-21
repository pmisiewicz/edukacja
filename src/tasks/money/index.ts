import { getBool, getString } from '../../core/options';
import { randomInt, type Rng } from '../../core/rng';
import type { TaskModule } from '../../core/types';

/** Polish coins and banknotes, in grosze. */
export const COINS_GR = [1, 2, 5, 10, 20, 50];
export const COINS_ZL = [100, 200, 500];
export const NOTES = [1000, 2000, 5000, 10000, 20000, 50000];

export interface MoneyTask {
  /** Denominations in grosze, largest first. */
  items: number[];
  total: number;
}

/** Breaks `amount` into denominations, mostly the largest that fits, sometimes the next one (varied but few pieces). */
function decompose(rng: Rng, amount: number, denominations: number[]): number[] {
  const out: number[] = [];
  let rest = amount;
  while (rest > 0) {
    const fitting = denominations.filter((d) => d <= rest).sort((a, b) => b - a);
    const d = fitting.length > 1 && rng() < 0.3 ? fitting[1] : fitting[0];
    out.push(d);
    rest -= d;
  }
  return out;
}

export function generateMoneyTasks(rng: Rng, count: number, maxZl: number, withGrosze: boolean): MoneyTask[] {
  const out: MoneyTask[] = [];
  for (let i = 0; i < count; i++) {
    let zl = randomInt(rng, 1, maxZl);
    let gr = withGrosze ? randomInt(rng, 1, 99) : 0;
    // Keep the number of coins readable: grosze are mostly round tens.
    if (withGrosze && rng() < 0.7) gr = Math.max(10, Math.round(gr / 10) * 10) % 100 || 50;
    if (zl * 100 + gr > maxZl * 100) zl = maxZl - 1;
    const items = [
      ...decompose(rng, zl * 100, [...COINS_ZL, ...NOTES.filter((n) => n <= maxZl * 100)]),
      ...decompose(rng, gr, COINS_GR),
    ].sort((a, b) => b - a);
    out.push({ items, total: zl * 100 + gr });
  }
  return out;
}

export function formatMoney(gr: number): string {
  const zl = Math.floor(gr / 100);
  const rest = gr % 100;
  if (!zl) return `${rest} gr`;
  return rest ? `${zl} zł ${rest} gr` : `${zl} zł`;
}

// ---------- drawing ----------

const NOTE_COLORS: Record<number, string> = {
  1000: '#eadcc5',
  2000: '#e3d6f3',
  5000: '#d4e3fb',
  10000: '#d3efd8',
  20000: '#f8e8b4',
  50000: '#ead9cb',
};

interface Placed {
  d: number;
  x: number;
  y: number;
}

const NOTE_W = 46;
const NOTE_H = 24;
const coinR = (d: number) => (d < 10 ? 7 : d < 100 ? 8.5 : d === 100 ? 10 : 11.5);
const itemW = (d: number) => (d >= 1000 ? NOTE_W : coinR(d) * 2);
const itemH = (d: number) => (d >= 1000 ? NOTE_H : coinR(d) * 2);

function coin(d: number, x: number, y: number, color: boolean): string {
  const r = coinR(d);
  const cx = x + r;
  const cy = y + r;
  const label = d >= 100 ? String(d / 100) : String(d);
  const unit = d >= 100 ? 'zł' : 'gr';
  const copper = d < 10;
  const bicolor = d === 200 || d === 500;
  const outer = !color ? '#fff' : copper ? '#f3c79a' : d === 500 ? '#f6dc84' : '#e5e7eb';
  const inner = !color ? '#fff' : d === 500 ? '#e5e7eb' : '#f6dc84';
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${outer}" stroke="#111" stroke-width="0.6"/>`;
  if (bicolor) s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.68}" fill="${inner}" stroke="#111" stroke-width="0.4"/>`;
  s += `<text x="${cx}" y="${cy - 0.5}" font-size="${r * 0.85}" font-weight="700" text-anchor="middle" fill="#111">${label}</text>`;
  s += `<text x="${cx}" y="${cy + r * 0.55}" font-size="${r * 0.42}" text-anchor="middle" fill="#111">${unit}</text>`;
  return s;
}

function note(d: number, x: number, y: number, color: boolean): string {
  const fill = color ? NOTE_COLORS[d] : '#fff';
  const zl = d / 100;
  return (
    `<rect x="${x}" y="${y}" width="${NOTE_W}" height="${NOTE_H}" rx="1.5" fill="${fill}" stroke="#111" stroke-width="0.6"/>` +
    `<rect x="${x + 2.5}" y="${y + 2.5}" width="${NOTE_W - 5}" height="${NOTE_H - 5}" rx="1" fill="none" stroke="#111" stroke-width="0.25"/>` +
    `<circle cx="${x + 11}" cy="${y + NOTE_H / 2}" r="5" fill="none" stroke="#111" stroke-width="0.3"/>` +
    `<text x="${x + NOTE_W - 5}" y="${y + NOTE_H / 2 + 3}" font-size="9" font-weight="700" text-anchor="end" fill="#111">${zl}</text>` +
    `<text x="${x + NOTE_W - 5}" y="${y + NOTE_H - 4}" font-size="3.6" text-anchor="end" fill="#111">złotych</text>`
  );
}

/** Lays items out left-to-right in rows of the given width. */
function layoutItems(items: number[], width: number): { placed: Placed[]; height: number } {
  const gap = 3;
  const placed: Placed[] = [];
  let x = 0;
  let y = 0;
  let rowH = 0;
  for (const d of items) {
    const w = itemW(d);
    if (x > 0 && x + w > width) {
      x = 0;
      y += rowH + gap;
      rowH = 0;
    }
    placed.push({ d, x, y });
    x += w + gap;
    rowH = Math.max(rowH, itemH(d));
  }
  // Vertically centre items within their row.
  return { placed, height: y + rowH };
}

function moneySvg(t: MoneyTask, color: boolean): string {
  const width = 150;
  const { placed, height } = layoutItems(t.items, width);
  const rowHeights = new Map<number, number>();
  for (const p of placed) rowHeights.set(p.y, Math.max(rowHeights.get(p.y) ?? 0, itemH(p.d)));
  const body = placed
    .map((p) => {
      const dy = ((rowHeights.get(p.y) ?? 0) - itemH(p.d)) / 2;
      return p.d >= 1000 ? note(p.d, p.x, p.y + dy, color) : coin(p.d, p.x, p.y + dy, color);
    })
    .join('');
  return `<svg viewBox="-1 -1 ${width + 2} ${height + 2}" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">${body}</svg>`;
}

export const moneyModule: TaskModule<MoneyTask> = {
  id: 'money',
  name: 'Pieniądze',
  category: 'Matematyka',
  options: [
    {
      type: 'select',
      key: 'max',
      label: 'Największa kwota',
      choices: [10, 20, 50, 100, 200, 500].map((n) => ({ value: String(n), label: `${n} zł` })),
      default: '20',
    },
    { type: 'checkbox', key: 'grosze', label: 'Z groszami', default: false },
  ],
  counts: [4, 6, 8, 10],
  defaultCount: 8,

  defaultInstruction: () => 'Policz pieniądze i wpisz, ile jest razem.',

  layout: (count) => ({ columns: 2, rows: Math.ceil(count / 2) }),

  generate: (rng, count, o) => generateMoneyTasks(rng, count, Number(getString(o, 'max')), getBool(o, 'grosze')),

  renderTask(t, ctx) {
    const answer = getBool(ctx.options, 'grosze')
      ? '<span class="box wide"></span><span class="unit">zł</span><span class="box"></span><span class="unit">gr</span>'
      : '<span class="box wide"></span><span class="unit">zł</span>';
    return `<div class="figure">${moneySvg(t, ctx.color)}</div><div class="answer">${answer}</div>`;
  },

  renderAnswer: (t, ctx) =>
    `<div class="figure">${moneySvg(t, ctx.color)}</div><div class="answer prompt">${formatMoney(t.total)}</div>`,
};
