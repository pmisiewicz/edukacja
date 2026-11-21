import { pickDistinct, type Rng } from '../../core/rng';

/** Fixed scale of the drawn thermometer, °C. */
export const SCALE_MIN = -30;
export const SCALE_MAX = 50;

export interface ThermometerTask {
  temperature: number;
}

export function generateThermometerTasks(
  rng: Rng,
  count: number,
  step: number,
  negatives: boolean,
): ThermometerTask[] {
  const s = [1, 2, 5, 10].includes(step) ? step : 5;
  const min = negatives ? SCALE_MIN : 0;
  const pool: number[] = [];
  for (let t = Math.ceil(min / s) * s; t <= SCALE_MAX; t += s) pool.push(t);
  return pickDistinct(rng, pool, count).map((temperature) => ({ temperature }));
}

/** "23 °C", "−5 °C" (typographic minus). */
export function formatTemperature(t: number): string {
  return `${t < 0 ? '−' : ''}${Math.abs(t)} °C`;
}
