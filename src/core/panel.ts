import type { AppState } from './state';
import type { AnyTaskModule, OptionDef } from './types';

export interface PanelHandlers {
  /** Mutate the state; `rebuild` re-creates the panel (e.g. after task change). */
  change(mutate: (s: AppState) => void, rebuild?: boolean): void;
  newSheet(): void;
  print(): void;
  copyLink(): Promise<boolean>;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function field(label: string, control: HTMLElement): HTMLElement {
  return el('label', { className: 'field' }, [el('span', { className: 'field-label' }, [label]), control]);
}

function checkbox(label: string, checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const input = el('input', { type: 'checkbox', checked });
  input.addEventListener('change', () => onChange(input.checked));
  return el('label', { className: 'check' }, [input, label]);
}

function select(
  choices: { value: string; label: string }[],
  value: string,
  onChange: (v: string) => void,
): HTMLSelectElement {
  const s = el(
    'select',
    {},
    choices.map((c) => el('option', { value: c.value, selected: c.value === value }, [c.label])),
  );
  s.addEventListener('change', () => onChange(s.value));
  return s;
}

export function renderPanel(root: HTMLElement, modules: AnyTaskModule[], state: AppState, h: PanelHandlers) {
  const m = modules.find((x) => x.id === state.task)!;
  const ts = state.perTask[m.id];

  const newBtn = el('button', { className: 'btn primary', type: 'button' }, ['🔄 Nowa karta']);
  newBtn.addEventListener('click', h.newSheet);
  const printBtn = el('button', { className: 'btn', type: 'button' }, ['🖨️ Drukuj']);
  printBtn.addEventListener('click', h.print);

  const taskSelect = select(
    modules.map((x) => ({ value: x.id, label: x.name })),
    m.id,
    (v) => h.change((s) => (s.task = v), true),
  );

  const optionControls = m.options.map((d: OptionDef) => {
    if (d.type === 'checkbox') {
      return checkbox(d.label, ts.options[d.key] === true, (v) => h.change((s) => (s.perTask[m.id].options[d.key] = v), true));
    }
    if (d.type === 'number') {
      const input = el('input', {
        type: 'number',
        min: String(d.min),
        max: String(d.max),
        step: '1',
        value: String(ts.options[d.key]),
      });
      input.addEventListener('change', () =>
        h.change((s) => (s.perTask[m.id].options[d.key] = input.value), true),
      );
      return field(d.label, input);
    }
    return field(
      d.label,
      select(d.choices, String(ts.options[d.key]), (v) => h.change((s) => (s.perTask[m.id].options[d.key] = v), true)),
    );
  });

  const countSelect = select(
    m.counts.map((n) => ({ value: String(n), label: String(n) })),
    String(ts.count),
    (v) => h.change((s) => (s.perTask[m.id].count = Number(v))),
  );

  const instruction = el('input', {
    type: 'text',
    value: ts.instruction,
    placeholder: m.defaultInstruction(ts.options),
    maxLength: 200,
  });
  instruction.addEventListener('input', () => h.change((s) => (s.perTask[m.id].instruction = instruction.value)));

  const copyBtn = el('button', { className: 'btn small', type: 'button' }, ['🔗 Kopiuj link do tej karty']);
  copyBtn.addEventListener('click', async () => {
    const ok = await h.copyLink();
    copyBtn.textContent = ok ? '✅ Skopiowano' : 'Skopiuj adres z paska przeglądarki';
    setTimeout(() => (copyBtn.textContent = '🔗 Kopiuj link do tej karty'), 2000);
  });

  root.replaceChildren(
    el('h1', { className: 'app-title' }, ['Generator kart pracy']),
    el('div', { className: 'actions' }, [newBtn, printBtn]),
    el('fieldset', {}, [
      el('legend', {}, ['Zadanie']),
      field('Rodzaj karty', taskSelect),
      ...optionControls,
      field('Liczba zadań na stronie', countSelect),
    ]),
    el('fieldset', {}, [
      el('legend', {}, ['Karta']),
      field('Polecenie', instruction),
      checkbox('Dołącz klucz odpowiedzi (osobna strona)', state.answers, (v) => h.change((s) => (s.answers = v))),
      checkbox('Druk w kolorze', state.color, (v) => h.change((s) => (s.color = v))),
    ]),
    el('div', { className: 'seed' }, [el('span', {}, [`Kod karty: ${state.seed}`]), copyBtn]),
  );
}
