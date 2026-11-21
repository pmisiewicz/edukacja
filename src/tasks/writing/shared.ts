/** Shared bits for handwriting rows (ślaczki, letters). */

export const ROW_WIDTH = 180;

export type TraceAmount = 'little' | 'half' | 'most';

export const TRACE_OPTION = {
  type: 'select' as const,
  key: 'trace',
  label: 'Ile po śladzie',
  choices: [
    { value: 'little', label: 'Mało (1/3 wiersza)' },
    { value: 'half', label: 'Połowa wiersza' },
    { value: 'most', label: 'Dużo (2/3 wiersza)' },
  ],
  default: 'half',
};

export function traceFraction(v: string): number {
  return v === 'little' ? 1 / 3 : v === 'most' ? 2 / 3 : 1 / 2;
}

export const SOLID = 'stroke="#111" stroke-width="0.9"';
export const TRACE = 'stroke="#9ca3af" stroke-width="0.8" stroke-dasharray="0.1 1.6" stroke-linecap="round"';

/** Horizontal ruled lines across the row: [y, style] pairs. */
export function lines(spec: { y: number; strong?: boolean; dashed?: boolean }[]): string {
  return spec
    .map(
      (l) =>
        `<line x1="0" y1="${l.y}" x2="${ROW_WIDTH}" y2="${l.y}" stroke="${l.strong ? '#6b7280' : '#c4c8ce'}" stroke-width="${l.strong ? 0.35 : 0.25}"${l.dashed ? ' stroke-dasharray="1.5 1.5"' : ''}/>`,
    )
    .join('');
}

export function rowSvg(height: number, body: string): string {
  return `<svg viewBox="0 0 ${ROW_WIDTH} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}
