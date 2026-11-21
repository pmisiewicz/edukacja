import { getNumber, getString } from '../../core/options';
import type { TaskModule } from '../../core/types';
import { generateMathTasks, operatorSymbol, type MathTask, type OperatorMode } from './generator';

function row(t: MathTask, answer: string): string {
  return `<div class="math-row">
    <span class="num">${t.a}</span><span class="op">${operatorSymbol(t.op)}</span><span class="num b">${t.b}</span>
    <span class="op">=</span>${answer}
  </div>`;
}

export const mathModule: TaskModule<MathTask> = {
  id: 'math',
  name: 'Działania matematyczne',
  category: 'Matematyka',
  options: [
    {
      type: 'select',
      key: 'ops',
      label: 'Działania',
      choices: [
        { value: 'add', label: 'Dodawanie' },
        { value: 'sub', label: 'Odejmowanie' },
        { value: 'mixed', label: 'Dodawanie i odejmowanie' },
      ],
      default: 'mixed',
    },
    { type: 'number', key: 'minA', group: 'Pierwsza liczba (A)', label: 'od', min: 0, max: 1000, default: 1 },
    { type: 'number', key: 'maxA', group: 'Pierwsza liczba (A)', label: 'do', min: 0, max: 1000, default: 20 },
    { type: 'number', key: 'minB', group: 'Druga liczba (B)', label: 'od', min: 0, max: 1000, default: 1 },
    { type: 'number', key: 'maxB', group: 'Druga liczba (B)', label: 'do', min: 0, max: 1000, default: 10 },
    { type: 'number', key: 'minResult', group: 'Wynik', label: 'od', min: 0, max: 1000, default: 0 },
    { type: 'number', key: 'maxResult', group: 'Wynik', label: 'do', min: 0, max: 1000, default: 20 },
  ],
  counts: [15, 30, 45, 60],
  defaultCount: 30,
  // Numbers like "12." next to "3 + 4" read as part of the operation.
  numbered: false,

  defaultInstruction: () => 'Oblicz i wpisz wynik.',

  layout(count) {
    return { columns: 3, rows: Math.ceil(count / 3) };
  },

  generate(rng, count, o) {
    const range = (k: string) => ({ min: getNumber(o, `min${k}`), max: getNumber(o, `max${k}`) });
    return generateMathTasks(rng, count, getString(o, 'ops') as OperatorMode, {
      a: range('A'),
      b: range('B'),
      result: range('Result'),
    });
  },

  renderTask: (t) => row(t, '<span class="box wide"></span>'),
  renderAnswer: (t) => row(t, `<span class="result">${t.result}</span>`),
};
