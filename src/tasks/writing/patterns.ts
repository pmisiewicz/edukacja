import { getString } from '../../core/options';
import { pickDistinct } from '../../core/rng';
import type { TaskModule } from '../../core/types';
import { lines, ROW_WIDTH, rowSvg, SOLID, TRACE, TRACE_OPTION, traceFraction } from './shared';

/** Row geometry: pattern between TOP and BOTTOM. */
const TOP = 5;
const BOTTOM = 21;
const MID = (TOP + BOTTOM) / 2;
const H = BOTTOM - TOP;
const ROW_H = 26;

interface Pattern {
  id: string;
  group: 'waves' | 'zigzag' | 'arcs';
  /** Width of one repeating unit. */
  unit: number;
  /** Start point of a unit at x0 (for the leading M). */
  start(x0: number): [number, number];
  /** Path commands drawing one unit from its start point. */
  draw(x0: number): string;
}

const r = (n: number) => +n.toFixed(2);

/** Prolate cycloid sampled as a polyline: a "spring" of loops. */
function springUnit(x0: number, u: number): string {
  const pts: string[] = [];
  for (let i = 1; i <= 24; i++) {
    const s = i / 24;
    const th = 2 * Math.PI * s;
    const x = x0 + u * (s - (1.9 * Math.sin(th)) / (2 * Math.PI));
    const y = MID + (H / 2) * Math.cos(th);
    pts.push(`${r(x)} ${r(y)}`);
  }
  return `L${pts.join(' L')}`;
}

export const PATTERNS: Pattern[] = [
  {
    id: 'wave',
    group: 'waves',
    unit: 16,
    start: (x0) => [x0, MID],
    draw: (x0) => `Q${x0 + 4} ${TOP} ${x0 + 8} ${MID} T${x0 + 16} ${MID}`,
  },
  {
    id: 'loops',
    group: 'waves',
    unit: 12,
    start: (x0) => [x0, BOTTOM],
    draw: (x0) =>
      `C${r(x0 + 7.2)} ${BOTTOM} ${r(x0 + 10.8)} ${TOP} ${r(x0 + 7.2)} ${TOP} C${r(x0 + 3.6)} ${TOP} ${r(x0 + 6)} ${BOTTOM} ${x0 + 12} ${BOTTOM}`,
  },
  {
    id: 'zigzag',
    group: 'zigzag',
    unit: 10,
    start: (x0) => [x0, BOTTOM],
    draw: (x0) => `L${x0 + 5} ${TOP} L${x0 + 10} ${BOTTOM}`,
  },
  {
    id: 'steps',
    group: 'zigzag',
    unit: 18,
    start: (x0) => [x0, BOTTOM],
    draw: (x0) => `V${MID} H${x0 + 6} V${TOP} H${x0 + 12} V${BOTTOM} H${x0 + 18}`,
  },
  {
    id: 'castle',
    group: 'zigzag',
    unit: 14,
    start: (x0) => [x0, BOTTOM],
    draw: (x0) => `V${TOP} H${x0 + 7} V${BOTTOM} H${x0 + 14}`,
  },
  {
    id: 'arcsUp',
    group: 'arcs',
    unit: 12,
    start: (x0) => [x0, BOTTOM],
    draw: (x0) => `C${x0} ${TOP - 3} ${x0 + 12} ${TOP - 3} ${x0 + 12} ${BOTTOM}`,
  },
  {
    id: 'arcsDown',
    group: 'arcs',
    unit: 12,
    start: (x0) => [x0, TOP],
    draw: (x0) => `C${x0} ${BOTTOM + 3} ${x0 + 12} ${BOTTOM + 3} ${x0 + 12} ${TOP}`,
  },
  {
    id: 'spring',
    group: 'arcs',
    unit: 13,
    start: (x0) => [x0, BOTTOM],
    draw: (x0) => springUnit(x0, 13),
  },
];

export interface PatternTask {
  pattern: string;
}

function patternRow(t: PatternTask, traceShare: number, full: boolean): string {
  const p = PATTERNS.find((x) => x.id === t.pattern) ?? PATTERNS[0];
  const x0 = 4;
  const units = Math.floor((ROW_WIDTH - 2 * x0) / p.unit);
  const solidUnits = Math.max(1, Math.round(16 / p.unit)); // ~16 units wide of model
  const traceUnits = full ? units - solidUnits : Math.max(1, Math.round(units * traceShare) - solidUnits);

  const segment = (from: number, n: number) => {
    if (n <= 0) return '';
    const [sx, sy] = p.start(x0 + from * p.unit);
    let d = `M${sx} ${sy}`;
    for (let i = 0; i < n; i++) d += ` ${p.draw(x0 + (from + i) * p.unit)}`;
    return d;
  };

  const body =
    lines([{ y: TOP }, { y: MID, dashed: true }, { y: BOTTOM, strong: true }]) +
    `<path d="${segment(0, solidUnits)}" fill="none" ${SOLID} stroke-linejoin="round"/>` +
    `<path d="${segment(solidUnits, traceUnits)}" fill="none" ${full ? SOLID : TRACE} stroke-linejoin="round"/>`;
  return rowSvg(ROW_H, body);
}

const GROUPS: Record<string, Pattern['group'][]> = {
  all: ['waves', 'zigzag', 'arcs'],
  waves: ['waves'],
  zigzag: ['zigzag'],
  arcs: ['arcs'],
};

export const patternsModule: TaskModule<PatternTask> = {
  id: 'patterns',
  name: 'Szlaczki',
  category: 'Pisanie',
  numbered: false,
  options: [
    {
      type: 'select',
      key: 'group',
      label: 'Wzory',
      choices: [
        { value: 'all', label: 'Wszystkie' },
        { value: 'waves', label: 'Fale i pętelki' },
        { value: 'zigzag', label: 'Zygzaki i schodki' },
        { value: 'arcs', label: 'Łuki i sprężynki' },
      ],
      default: 'all',
    },
    TRACE_OPTION,
  ],
  counts: [6, 8, 10, 12],
  defaultCount: 8,

  defaultInstruction: () => 'Popraw szlaczek po śladzie, a potem rysuj dalej sam do końca linii.',

  layout: (count) => ({ columns: 1, rows: count }),

  generate(rng, count, o) {
    const groups = GROUPS[getString(o, 'group')] ?? GROUPS.all;
    const pool = PATTERNS.filter((p) => groups.includes(p.group)).map((p) => p.id);
    return pickDistinct(rng, pool, count).map((pattern) => ({ pattern }));
  },

  renderTask: (t, ctx) =>
    `<div class="figure">${patternRow(t, traceFraction(getString(ctx.options, 'trace')), false)}</div>`,
  renderAnswer: (t) => `<div class="figure">${patternRow(t, 1, true)}</div>`,
};
