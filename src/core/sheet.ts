import { escapeHtml } from './options';
import { createRng, hashSeed } from './rng';
import type { AppState } from './state';
import type { AnyTaskModule, RenderContext } from './types';

/** Renders the worksheet (and optionally the answer key) as A4 pages. */
export function renderSheets(m: AnyTaskModule, state: AppState): string {
  const ts = state.perTask[m.id];
  const rng = createRng(hashSeed(`${state.seed}:${m.id}`));
  const tasks = m.generate(rng, ts.count, ts.options);
  const ctx: RenderContext = { color: state.color, options: ts.options };
  const layout = m.layout(ts.count, ts.options);
  const instruction = escapeHtml(ts.instruction.trim() || m.defaultInstruction(ts.options));
  const gridStyle = `--cols:${layout.columns};--rows:${layout.rows}`;
  const footer = `<footer class="sheet-footer">Kod karty: ${escapeHtml(state.seed)}</footer>`;

  const cells = (render: (t: unknown) => string) =>
    tasks
      .map((t, i) => `<div class="cell"><span class="cell-no">${i + 1}.</span>${render(t)}</div>`)
      .join('');

  let html = `
    <section class="page">
      <header class="sheet-header">
        <div class="fields">
          <span>Imię i nazwisko: <span class="line"></span></span>
          <span>Data: <span class="line short"></span></span>
        </div>
        <h1 class="instruction">${instruction}</h1>
      </header>
      <div class="grid" style="${gridStyle}">${cells((t) => m.renderTask(t, ctx))}</div>
      ${footer}
    </section>`;

  if (state.answers) {
    html += `
    <section class="page answer-key">
      <header class="sheet-header">
        <h1 class="instruction">Klucz odpowiedzi — ${escapeHtml(m.name.toLowerCase())}</h1>
      </header>
      <div class="grid" style="${gridStyle}">${cells((t) => m.renderAnswer(t, ctx))}</div>
      ${footer}
    </section>`;
  }
  return html;
}
