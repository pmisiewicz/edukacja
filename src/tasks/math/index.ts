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
    { type: 'number', key: 'maxResult', label: 'Największy wynik', min: 1, max: 1000, default: 20 },
    { type: 'number', key: 'maxA', label: 'Największa pierwsza liczba (A)', min: 1, max: 1000, default: 20 },
    { type: 'number', key: 'maxB', label: 'Największa druga liczba (B)', min: 1, max: 1000, default: 10 },
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
    return generateMathTasks(rng, count, getString(o, 'ops') as OperatorMode, {
      maxResult: getNumber(o, 'maxResult'),
      maxA: getNumber(o, 'maxA'),
      maxB: getNumber(o, 'maxB'),
    });
  },

  renderTask: (t) => row(t, '<span class="box wide"></span>'),
  renderAnswer: (t) => row(t, `<span class="result">${t.result}</span>`),
};
