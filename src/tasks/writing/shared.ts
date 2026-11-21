/** Shared bits for handwriting rows (szlaczki, letters). */

export const TRACE_OPTION = {
  type: 'select' as const,
  key: 'trace',
  label: 'Ile po śladzie',
  choices: [
    { value: 'little', label: 'Mało (1/3 wiersza)' },
    { value: 'half', label: 'Połowa wiersza' },
    { value: 'most', label: 'Dużo (2/3 wiersza)' },
    { value: 'full', label: 'Cały wiersz' },
  ],
  default: 'half',
};

export function traceFraction(v: string): number {
  return v === 'little' ? 1 / 3 : v === 'most' ? 2 / 3 : v === 'full' ? 1 : 1 / 2;
}

export const SOLID = 'stroke="#111" stroke-width="0.9"';
export const TRACE = 'stroke="#9ca3af" stroke-width="0.8" stroke-dasharray="0.1 1.6" stroke-linecap="round"';

/**
 * Row width in viewBox units such that a row of `height` units fills the whole grid cell
 * (so changing the number of rows never narrows them).
 */
export function rowWidth(height: number, cellAspect: number): number {
  return Math.round(height * cellAspect * 10) / 10;
}

/** Horizontal ruled lines across the row. */
export function lines(width: number, spec: { y: number; strong?: boolean; dashed?: boolean }[]): string {
  return spec
    .map(
      (l) =>
        `<line x1="0" y1="${l.y}" x2="${width}" y2="${l.y}" stroke="${l.strong ? '#6b7280' : '#c4c8ce'}" stroke-width="${l.strong ? 0.35 : 0.25}"${l.dashed ? ' stroke-dasharray="1.5 1.5"' : ''}/>`,
    )
    .join('');
}

export function rowSvg(width: number, height: number, body: string): string {
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}
