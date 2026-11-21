import { handAngles, type ClockTask } from './generator';

export interface ClockSvgOptions {
  /** Task whose hands to draw; null = empty dial (pupil draws the hands). */
  task: ClockTask | null;
  ring24: boolean;
  minuteLabels: boolean;
  color: boolean;
}

const C = 100;

function polar(angleDeg: number, r: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [+(C + r * Math.cos(a)).toFixed(2), +(C + r * Math.sin(a)).toFixed(2)];
}

function text(angle: number, r: number, label: string | number, size: number, attrs = ''): string {
  const [x, y] = polar(angle, r);
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central" ${attrs}>${label}</text>`;
}

function hand(angle: number, length: number, width: number, stroke: string): string {
  const [x1, y1] = polar(angle + 180, 10);
  const [x2, y2] = polar(angle, length);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
}

export function clockSvg(o: ClockSvgOptions): string {
  const view = o.minuteLabels ? '-22 -22 244 244' : '-4 -4 208 208';
  const parts: string[] = [];

  parts.push(`<circle cx="${C}" cy="${C}" r="94" fill="#fff" stroke="#111" stroke-width="3"/>`);

  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const [x1, y1] = polar(i * 6, major ? 81 : 87);
    const [x2, y2] = polar(i * 6, 92);
    parts.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="${major ? 2.6 : 1}"/>`,
    );
  }

  for (let h = 1; h <= 12; h++) parts.push(text(h * 30, 69, h, 19, 'font-weight="600" fill="#111"'));

  if (o.ring24) {
    const fill = o.color ? '#2563eb' : '#555';
    for (let h = 1; h <= 12; h++) parts.push(text(h * 30, 49, h === 12 ? 24 : h + 12, 10, `fill="${fill}"`));
  }

  if (o.minuteLabels) {
    const fill = o.color ? '#16a34a' : '#444';
    for (let i = 0; i < 12; i++) parts.push(text(i * 30, 106, i * 5, 10, `fill="${fill}"`));
  }

  if (o.task) {
    const a = handAngles(o.task);
    parts.push(hand(a.hour, 46, 7, o.color ? '#1d4ed8' : '#111'));
    parts.push(hand(a.minute, 76, 3.5, o.color ? '#dc2626' : '#111'));
  }
  parts.push(`<circle cx="${C}" cy="${C}" r="5" fill="#111"/>`);

  return `<svg viewBox="${view}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">${parts.join('')}</svg>`;
}
