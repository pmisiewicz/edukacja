import { getBool, getString } from '../../core/options';
import type { Options, RenderContext, TaskModule } from '../../core/types';
import { format12, format24, formatBoth, generateClockTasks, type ClockPrecision, type ClockTask } from './generator';
import { clockSvg } from './render';

const timeBoxes =
  '<span class="time-group"><span class="box time"></span><span class="colon">:</span><span class="box time"></span></span>';

function svg(task: ClockTask | null, ctx: RenderContext): string {
  return clockSvg({
    task,
    ring24: getBool(ctx.options, 'ring24'),
    minuteLabels: getBool(ctx.options, 'minuteLabels'),
    color: ctx.color,
  });
}

/** Time the pupil sees (draw mode) or should write (read mode). */
function answerText(t: ClockTask, o: Options): string {
  const use24 = getBool(o, 'use24');
  if (getString(o, 'mode') === 'draw') return use24 ? format24(t) : format12(t);
  return use24 ? formatBoth(t) : format12(t);
}

export const clockModule: TaskModule<ClockTask> = {
  id: 'clock',
  name: 'Zegary',
  options: [
    {
      type: 'select',
      key: 'mode',
      label: 'Co robi uczeń',
      choices: [
        { value: 'read', label: 'Odczytuje godzinę z zegara' },
        { value: 'draw', label: 'Rysuje wskazówki' },
      ],
      default: 'read',
    },
    {
      type: 'select',
      key: 'precision',
      label: 'Dokładność',
      choices: [
        { value: 'hour', label: 'Pełne godziny' },
        { value: 'half', label: 'Co pół godziny' },
        { value: 'quarter', label: 'Co kwadrans' },
        { value: 'five', label: 'Co 5 minut' },
        { value: 'one', label: 'Co 1 minutę' },
      ],
      default: 'quarter',
    },
    { type: 'checkbox', key: 'use24', label: 'Format 24-godzinny (rano i po południu)', default: false },
    { type: 'checkbox', key: 'ring24', label: 'Pomoc: godziny 13–24 na tarczy', default: false },
    { type: 'checkbox', key: 'minuteLabels', label: 'Pomoc: minuty (5, 10…) na tarczy', default: false },
  ],
  counts: [6, 9, 12, 15, 20],
  defaultCount: 12,

  defaultInstruction(o) {
    if (getString(o, 'mode') === 'draw') return 'Narysuj wskazówki tak, aby zegar pokazywał podaną godzinę.';
    return getBool(o, 'use24')
      ? 'Która godzina? Wpisz obie możliwości: rano i po południu.'
      : 'Która godzina? Wpisz godzinę, którą pokazuje zegar.';
  },

  layout(count) {
    const columns = count <= 6 ? 2 : count <= 15 ? 3 : 4;
    return { columns, rows: Math.ceil(count / columns) };
  },

  generate(rng, count, o) {
    return generateClockTasks(rng, count, getString(o, 'precision') as ClockPrecision);
  },

  renderTask(t, ctx) {
    if (getString(ctx.options, 'mode') === 'draw') {
      return `<div class="figure">${svg(null, ctx)}</div><div class="answer prompt">${answerText(t, ctx.options)}</div>`;
    }
    const boxes = getBool(ctx.options, 'use24') ? `${timeBoxes}<span class="time-group"><span class="or">lub</span>${timeBoxes}</span>` : timeBoxes;
    const cls = getBool(ctx.options, 'use24') ? 'answer dual' : 'answer';
    return `<div class="figure">${svg(t, ctx)}</div><div class="${cls}">${boxes}</div>`;
  },

  renderAnswer(t, ctx) {
    return `<div class="figure">${svg(t, ctx)}</div><div class="answer prompt">${answerText(t, ctx.options)}</div>`;
  },
};
