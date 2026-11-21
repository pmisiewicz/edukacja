import { escapeHtml, getString } from '../../core/options';
import { pickDistinct, randomInt, type Rng } from '../../core/rng';
import type { TaskModule } from '../../core/types';

const MONTHS = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
];
const MONTHS_GEN = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
];
/** Monday-first. */
const DAYS = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'];
const DAYS_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
/** "Ile ... jest w tym miesiącu?" */
const DAYS_GEN_PL = ['poniedziałków', 'wtorków', 'śród', 'czwartków', 'piątków', 'sobót', 'niedziel'];
/** "w pierwszy poniedziałek", "w pierwszą środę" */
const FIRST_DAY = [
  'pierwszy poniedziałek', 'pierwszy wtorek', 'pierwszą środę', 'pierwszy czwartek',
  'pierwszy piątek', 'pierwszą sobotę', 'pierwszą niedzielę',
];

export interface CalendarQuestion {
  q: string;
  a: string;
}

export interface CalendarTask {
  year: number;
  /** 0–11 */
  month: number;
  questions: CalendarQuestion[];
}

export const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
/** 0 = Monday … 6 = Sunday. */
export const weekday = (y: number, m: number, d: number) => (new Date(y, m, d).getDay() + 6) % 7;

type QuestionMaker = (rng: Rng, y: number, m: number) => CalendarQuestion;

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

const QUESTIONS: QuestionMaker[] = [
  (rng, y, m) => {
    const d = randomInt(rng, 2, daysInMonth(y, m));
    return { q: `Jaki dzień tygodnia jest ${d} ${MONTHS_GEN[m]}?`, a: DAYS[weekday(y, m, d)] };
  },
  (rng, y, m) => {
    const wd = randomInt(rng, 0, 6);
    let n = 0;
    for (let d = 1; d <= daysInMonth(y, m); d++) if (weekday(y, m, d) === wd) n++;
    return { q: `Ile ${DAYS_GEN_PL[wd]} jest w tym miesiącu?`, a: String(n) };
  },
  (rng, y, m) => {
    const d = randomInt(rng, 1, daysInMonth(y, m) - 7);
    return { q: `Jaka data będzie tydzień po ${d} ${MONTHS_GEN[m]}?`, a: `${d + 7} ${MONTHS_GEN[m]}` };
  },
  (rng, y, m) => {
    const d = randomInt(rng, 2, daysInMonth(y, m));
    return { q: `Jaki dzień tygodnia jest dzień przed ${d} ${MONTHS_GEN[m]}?`, a: DAYS[weekday(y, m, d - 1)] };
  },
  (rng, y, m) => {
    const wd = randomInt(rng, 0, 6);
    let d = 1;
    while (weekday(y, m, d) !== wd) d++;
    return { q: `Jaka data przypada w ${FIRST_DAY[wd]} miesiąca?`, a: `${d} ${MONTHS_GEN[m]}` };
  },
  (_rng, y, m) => ({ q: 'Ile dni ma ten miesiąc?', a: String(daysInMonth(y, m)) }),
  (_rng, _y, m) => ({ q: `Którym miesiącem roku jest ${MONTHS[m]}?`, a: `${m + 1}.` }),
  (_rng, _y, m) => ({ q: 'Jaki miesiąc będzie następny?', a: MONTHS[(m + 1) % 12] }),
  (_rng, y, m) => ({
    q: 'Jaki dzień tygodnia jest ostatniego dnia miesiąca?',
    a: DAYS[weekday(y, m, daysInMonth(y, m))],
  }),
];

export function generateCalendarTasks(rng: Rng, count: number, questionCount: number): CalendarTask[] {
  const months = pickDistinct(rng, Array.from({ length: 12 }, (_, i) => i), count);
  return months.map((month) => {
    const year = randomInt(rng, 2025, 2028);
    const makers = pickDistinct(rng, QUESTIONS, Math.min(questionCount, QUESTIONS.length));
    return { year, month, questions: makers.map((make) => make(rng, year, month)) };
  });
}

function calendarTable(t: CalendarTask, color: boolean): string {
  const first = weekday(t.year, t.month, 1);
  const days = daysInMonth(t.year, t.month);
  const cells: string[] = [];
  for (let i = 0; i < first; i++) cells.push('<td></td>');
  for (let d = 1; d <= days; d++) {
    const wd = (first + d - 1) % 7;
    cells.push(`<td class="${color && wd === 6 ? 'sunday' : ''}">${d}</td>`);
  }
  while (cells.length % 7) cells.push('<td></td>');
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);
  const head = DAYS_SHORT.map((d, i) => `<th class="${color && i === 6 ? 'sunday' : ''}">${d}</th>`).join('');
  return `<table class="calendar">
    <caption>${capitalize(MONTHS[t.month])} ${t.year}</caption>
    <thead><tr>${head}</tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>`;
}

function render(t: CalendarTask, color: boolean, answers: boolean): string {
  const items = t.questions
    .map(
      (q) =>
        `<li><span class="q">${escapeHtml(q.q)}</span>${
          answers ? `<span class="a filled">${escapeHtml(q.a)}</span>` : '<span class="a"></span>'
        }</li>`,
    )
    .join('');
  return `<div class="calendar-task">${calendarTable(t, color)}<ol class="calendar-questions">${items}</ol></div>`;
}

export const calendarModule: TaskModule<CalendarTask> = {
  id: 'calendar',
  name: 'Kalendarz',
  category: 'Czas i mierzenie',
  numbered: false,
  options: [
    {
      type: 'select',
      key: 'questions',
      label: 'Pytań do każdej kartki',
      choices: ['4', '6', '8'].map((v) => ({ value: v, label: v })),
      default: '6',
    },
  ],
  counts: [1, 2],
  defaultCount: 2,

  defaultInstruction: () => 'Popatrz na kartkę z kalendarza i odpowiedz na pytania.',

  layout: (count) => ({ columns: 1, rows: count }),

  generate: (rng, count, o) => generateCalendarTasks(rng, count, Number(getString(o, 'questions'))),

  renderTask: (t, ctx) => render(t, ctx.color, false),
  renderAnswer: (t, ctx) => render(t, ctx.color, true),
};
