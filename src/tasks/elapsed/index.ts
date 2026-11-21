import { getBool, getString } from '../../core/options';
import { randomInt, type Rng } from '../../core/rng';
import type { RenderContext, TaskModule } from '../../core/types';
import { format12, type ClockTask } from '../clock/generator';
import { clockSvg } from '../clock/render';

export interface ElapsedTask {
  start: ClockTask;
  /** Duration in minutes. */
  minutes: number;
}

export function generateElapsedTasks(rng: Rng, count: number, step: number, maxHours: number): ElapsedTask[] {
  const out: ElapsedTask[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    let task: ElapsedTask;
    let tries = 0;
    do {
      const hour = randomInt(rng, 1, 12);
      const minute = randomInt(rng, 0, 60 / step - 1) * step;
      const minutes = randomInt(rng, 1, (maxHours * 60) / step) * step;
      task = { start: { hour, minute }, minutes };
    } while (seen.has(key(task)) && ++tries < 20);
    seen.add(key(task));
    out.push(task);
  }
  return out;
}

const key = (t: ElapsedTask) => `${t.start.hour}:${t.start.minute}+${t.minutes}`;

export function endTime(t: ElapsedTask): ClockTask {
  const total = t.start.hour * 60 + t.start.minute + t.minutes;
  return { hour: Math.floor(total / 60) % 24, minute: total % 60 };
}

/** "1 godz. 15 min", "45 min", "2 godz." */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} godz. ${m} min` : `${h} godz.`;
}

function svg(t: ClockTask, ctx: RenderContext): string {
  return clockSvg({ task: t, ring24: false, minuteLabels: getBool(ctx.options, 'minuteLabels'), color: ctx.color });
}

const isAfter = (ctx: RenderContext) => getString(ctx.options, 'mode') === 'after';

function figure(t: ElapsedTask, ctx: RenderContext): string {
  if (isAfter(ctx)) return `<div class="figure">${svg(t.start, ctx)}</div>`;
  return `<div class="figure pair">
    <div class="pair-item">${svg(t.start, ctx)}<span>początek</span></div>
    <div class="pair-item">${svg(endTime(t), ctx)}<span>koniec</span></div>
  </div>`;
}

const timeBoxes =
  '<span class="time-group"><span class="box time"></span><span class="colon">:</span><span class="box time"></span></span>';

export const elapsedModule: TaskModule<ElapsedTask> = {
  id: 'elapsed',
  name: 'Upływ czasu',
  category: 'Czas i mierzenie',
  options: [
    {
      type: 'select',
      key: 'mode',
      label: 'Rodzaj zadania',
      choices: [
        { value: 'between', label: 'Ile czasu minęło? (dwa zegary)' },
        { value: 'after', label: 'Która będzie za…? (jeden zegar)' },
      ],
      default: 'between',
    },
    {
      type: 'select',
      key: 'precision',
      label: 'Dokładność',
      choices: [
        { value: '30', label: 'Co pół godziny' },
        { value: '15', label: 'Co kwadrans' },
        { value: '5', label: 'Co 5 minut' },
      ],
      default: '15',
    },
    {
      type: 'select',
      key: 'maxHours',
      label: 'Najdłuższy odstęp',
      choices: [
        { value: '1', label: '1 godzina' },
        { value: '3', label: '3 godziny' },
        { value: '6', label: '6 godzin' },
      ],
      default: '3',
    },
    { type: 'checkbox', key: 'minuteLabels', label: 'Pomoc: minuty (5, 10…) na tarczy', default: false },
  ],
  counts: [4, 6, 8, 9, 12],
  defaultCount: 6,

  defaultInstruction: (o) =>
    getString(o, 'mode') === 'after'
      ? 'Która godzina będzie po podanym czasie? Wpisz.'
      : 'Ile czasu minęło od początku do końca? Wpisz.',

  layout(count, o) {
    const columns = getString(o, 'mode') === 'after' ? (count <= 4 ? 2 : 3) : 2;
    return { columns, rows: Math.ceil(count / columns) };
  },

  generate: (rng, count, o) =>
    generateElapsedTasks(rng, count, Number(getString(o, 'precision')), Number(getString(o, 'maxHours'))),

  renderTask(t, ctx) {
    if (isAfter(ctx)) {
      return `<div class="question">za ${formatDuration(t.minutes)}</div>${figure(t, ctx)}<div class="answer">${timeBoxes}</div>`;
    }
    const short = getString(ctx.options, 'maxHours') === '1';
    const answer = short
      ? '<span class="box wide"></span><span class="unit">min</span>'
      : '<span class="box"></span><span class="unit">godz.</span><span class="box wide"></span><span class="unit">min</span>';
    return `${figure(t, ctx)}<div class="answer">${answer}</div>`;
  },

  renderAnswer(t, ctx) {
    if (isAfter(ctx)) {
      return `<div class="question">za ${formatDuration(t.minutes)}</div>${figure(t, ctx)}<div class="answer prompt">${format12(endTime(t))}</div>`;
    }
    return `${figure(t, ctx)}<div class="answer prompt">${formatDuration(t.minutes)}</div>`;
  },
};
