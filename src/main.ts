import './styles.css';
import { renderPanel } from './core/panel';
import { newSeed } from './core/rng';
import { renderSheets } from './core/sheet';
import { loadState, normalizeTaskSettings, serializeSettings, stateToQuery, STORAGE_KEY, type AppState } from './core/state';
import { getModule, modules } from './tasks';

const panel = document.getElementById('panel')!;
const preview = document.getElementById('preview')!;

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value: string) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode etc. — settings just won't be remembered.
  }
}

let state: AppState = loadState(modules, location.search, readStorage(), newSeed);

function sync(push: boolean) {
  const m = getModule(state.task);
  const url = `${location.pathname}?${stateToQuery(state, m)}`;
  if (push) history.pushState(null, '', url);
  else history.replaceState(null, '', url);
  writeStorage(serializeSettings(state));
  preview.innerHTML = renderSheets(m, state);
}

function drawPanel() {
  renderPanel(panel, modules, state, {
    change(mutate, rebuild) {
      mutate(state);
      // Panel inputs deliver raw values (e.g. numbers as text) — coerce and clamp them.
      const m = getModule(state.task);
      state.perTask[m.id] = normalizeTaskSettings(m, state.perTask[m.id]);
      sync(false);
      if (rebuild) drawPanel();
    },
    newSheet() {
      state.seed = newSeed();
      sync(true);
      drawPanel();
    },
    print: () => window.print(),
    async copyLink() {
      try {
        await navigator.clipboard.writeText(location.href);
        return true;
      } catch {
        return false;
      }
    },
  });
}

window.addEventListener('popstate', () => {
  state = loadState(modules, location.search, readStorage(), newSeed);
  sync(false);
  drawPanel();
});

sync(false);
drawPanel();
