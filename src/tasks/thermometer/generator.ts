import { pickDistinct, type Rng } from '../../core/rng';

/** Fixed scale of the drawn thermometer, °C. */
export const SCALE_MIN = -30;
export const SCALE_MAX = 50;

export interface ThermometerTask {
  temperature: number;
}

/** Which temperatures to draw: only ≥ 0, both signs, or only below zero. */
export type TemperatureSign = 'plus' | 'both' | 'minus';

export function generateThermometerTasks(
  rng: Rng,
  count: number,
  step: number,
  sign: TemperatureSign,
): ThermometerTask[] {
  const s = [1, 2, 5, 10].includes(step) ? step : 5;
  const min = sign === 'plus' ? 0 : SCALE_MIN;
  const max = sign === 'minus' ? -1 : SCALE_MAX;
  const pool: number[] = [];
  for (let t = Math.ceil(min / s) * s; t <= max; t += s) pool.push(t);
  return pickDistinct(rng, pool, count).map((temperature) => ({ temperature }));
}

/** "23 °C", "−5 °C" (typographic minus). */
export function formatTemperature(t: number): string {
  return `${t < 0 ? '−' : ''}${Math.abs(t)} °C`;
}
