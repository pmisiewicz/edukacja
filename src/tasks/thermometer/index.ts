import { getString } from '../../core/options';
import type { TaskModule } from '../../core/types';
import { formatTemperature, generateThermometerTasks, type TemperatureSign, type ThermometerTask } from './generator';
import { thermometerSvg } from './render';

export const thermometerModule: TaskModule<ThermometerTask> = {
  id: 'thermometer',
  name: 'Termometry',
  category: 'Czas i mierzenie',
  options: [
    {
      type: 'select',
      key: 'mode',
      label: 'Co robi uczeń',
      choices: [
        { value: 'read', label: 'Odczytuje temperaturę' },
        { value: 'fill', label: 'Zamalowuje słupek' },
      ],
      default: 'read',
    },
    {
      type: 'select',
      key: 'precision',
      label: 'Dokładność',
      choices: [
        { value: '10', label: 'Co 10 °C' },
        { value: '5', label: 'Co 5 °C' },
        { value: '2', label: 'Co 2 °C' },
        { value: '1', label: 'Co 1 °C' },
      ],
      default: '5',
    },
    {
      type: 'select',
      key: 'sign',
      label: 'Temperatury',
      choices: [
        { value: 'plus', label: 'Tylko dodatnie (od 0 °C)' },
        { value: 'both', label: 'Dodatnie i ujemne' },
        { value: 'minus', label: 'Tylko ujemne (poniżej 0 °C)' },
      ],
      default: 'plus',
    },
  ],
  counts: [4, 6, 8, 10, 12],
  defaultCount: 8,

  defaultInstruction(o) {
    return getString(o, 'mode') === 'fill'
      ? 'Zamaluj słupek termometru do podanej temperatury.'
      : 'Odczytaj temperaturę i wpisz ją pod termometrem.';
  },

  layout(count) {
    const columns = count <= 6 ? count : Math.ceil(count / 2);
    return { columns, rows: Math.ceil(count / columns) };
  },

  generate(rng, count, o) {
    return generateThermometerTasks(rng, count, Number(getString(o, 'precision')), getString(o, 'sign') as TemperatureSign);
  },

  renderTask(t, ctx) {
    if (getString(ctx.options, 'mode') === 'fill') {
      return `<div class="figure">${thermometerSvg({ temperature: null, color: ctx.color })}</div>
        <div class="answer prompt">${formatTemperature(t.temperature)}</div>`;
    }
    return `<div class="figure">${thermometerSvg({ temperature: t.temperature, color: ctx.color })}</div>
      <div class="answer"><span class="box wide"></span><span class="unit">°C</span></div>`;
  },

  renderAnswer(t, ctx) {
    return `<div class="figure">${thermometerSvg({ temperature: t.temperature, color: ctx.color })}</div>
      <div class="answer prompt">${formatTemperature(t.temperature)}</div>`;
  },
};
