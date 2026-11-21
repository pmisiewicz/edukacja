import type { AppState } from './state';
import type { AnyTaskModule, NumberOptionDef, OptionDef } from './types';

export interface PanelHandlers {
  /** Mutate the state; `rebuild` re-creates the panel (e.g. after task change). */
  change(mutate: (s: AppState) => void, rebuild?: boolean): void;
  newSheet(): void;
  print(): void;
  copyLink(): Promise<boolean>;
  /** Redraw sheet and panel after a change made outside the state (e.g. a loaded font). */
  refresh(): void;
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

  // Task picker grouped by category.
  const taskSelect = el('select');
  for (const category of [...new Set(modules.map((x) => x.category))]) {
    taskSelect.append(
      el(
        'optgroup',
        { label: category },
        modules
          .filter((x) => x.category === category)
          .map((x) => el('option', { value: x.id, selected: x.id === m.id }, [x.name])),
      ),
    );
  }
  taskSelect.addEventListener('change', () => h.change((s) => (s.task = taskSelect.value), true));

  const numberInput = (d: NumberOptionDef) => {
    const input = el('input', {
      type: 'number',
      min: String(d.min),
      max: String(d.max),
      step: '1',
      value: String(ts.options[d.key]),
    });
    input.addEventListener('change', () => h.change((s) => (s.perTask[m.id].options[d.key] = input.value), true));
    return input;
  };

  const optionControls: HTMLElement[] = [];
  for (let i = 0; i < m.options.length; i++) {
    const d: OptionDef = m.options[i];
    if (d.type === 'checkbox') {
      optionControls.push(
        checkbox(d.label, ts.options[d.key] === true, (v) => h.change((s) => (s.perTask[m.id].options[d.key] = v), true)),
      );
    } else if (d.type === 'number' && d.group) {
      // Gather consecutive options of the same group into one "od [ ] do [ ]" row.
      const row = el('div', { className: 'range-row' });
      while (i < m.options.length) {
        const g = m.options[i];
        if (g.type !== 'number' || g.group !== d.group) break;
        row.append(el('label', { className: 'range-part' }, [el('span', {}, [g.label]), numberInput(g)]));
        i++;
      }
      i--;
      optionControls.push(
        el('div', { className: 'field' }, [el('span', { className: 'field-label' }, [d.group]), row]),
      );
    } else if (d.type === 'number') {
      optionControls.push(field(d.label, numberInput(d)));
    } else if (d.type === 'text') {
      const input = el('input', {
        type: 'text',
        value: String(ts.options[d.key]),
        placeholder: d.placeholder ?? '',
        maxLength: d.maxLength,
      });
      input.addEventListener('change', () => h.change((s) => (s.perTask[m.id].options[d.key] = input.value), true));
      optionControls.push(field(d.label, input));
    } else {
      optionControls.push(
        field(
          d.label,
          select(d.choices, String(ts.options[d.key]), (v) => h.change((s) => (s.perTask[m.id].options[d.key] = v), true)),
        ),
      );
    }
  }

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
      ...(m.panelExtras?.(h.refresh) ?? []),
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
