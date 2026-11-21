import { SCALE_MAX, SCALE_MIN } from './generator';

export interface ThermometerSvgOptions {
  /** Temperature to show; null = empty tube (pupil colours it in). */
  temperature: number | null;
  color: boolean;
}

const TOP = 30; // y of SCALE_MAX
const PX_PER_DEG = 3.2;
const TUBE_L = 34;
const TUBE_R = 48;
const TUBE_BOTTOM = 298;
const BULB_CY = 310;
const BULB_R = 15;

const y = (t: number) => +(TOP + (SCALE_MAX - t) * PX_PER_DEG).toFixed(2);

export function thermometerSvg(o: ThermometerSvgOptions): string {
  const liquid = o.color ? '#dc2626' : '#111';
  const cx = (TUBE_L + TUBE_R) / 2;
  const parts: string[] = [];

  // Bulb first, then the tube on top (its white fill hides the bulb outline inside the tube).
  parts.push(`<circle cx="${cx}" cy="${BULB_CY}" r="${BULB_R}" fill="${liquid}" stroke="#111" stroke-width="2"/>`);
  parts.push(
    `<path d="M${TUBE_L} ${TUBE_BOTTOM} V17 A7 7 0 0 1 ${TUBE_R} 17 V${TUBE_BOTTOM}" fill="#fff" stroke="#111" stroke-width="2"/>`,
  );
  const columnTop = o.temperature === null ? TUBE_BOTTOM - 4 : y(o.temperature);
  parts.push(`<rect x="${cx - 3}" y="${columnTop}" width="6" height="${BULB_CY - columnTop}" fill="${liquid}"/>`);

  for (let t = SCALE_MIN; t <= SCALE_MAX; t++) {
    const major = t % 10 === 0;
    const mid = !major && t % 5 === 0;
    const len = major ? 14 : mid ? 9 : 5;
    const w = major ? 1.4 : mid ? 1 : 0.6;
    parts.push(`<line x1="${TUBE_R + 2}" y1="${y(t)}" x2="${TUBE_R + 2 + len}" y2="${y(t)}" stroke="#111" stroke-width="${w}"/>`);
    if (major) {
      const label = t < 0 ? `−${-t}` : String(t);
      parts.push(
        `<text x="${TUBE_R + 19}" y="${y(t)}" font-size="11" dominant-baseline="central" fill="#111">${label}</text>`,
      );
    }
  }
  parts.push(`<text x="${TUBE_R + 19}" y="9" font-size="11" font-weight="600" fill="#111">°C</text>`);

  return `<svg viewBox="0 0 100 330" preserveAspectRatio="xMidYMax meet"xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">${parts.join('')}</svg>`;
}
