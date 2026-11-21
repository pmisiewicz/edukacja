import type { Rng } from './rng';

export type OptionValue = string | boolean | number;
export type Options = Record<string, OptionValue>;

interface OptionBase {
  key: string;
  label: string;
}

export interface SelectOptionDef extends OptionBase {
  type: 'select';
  choices: { value: string; label: string }[];
  default: string;
}

export interface CheckboxOptionDef extends OptionBase {
  type: 'checkbox';
  default: boolean;
}

export interface NumberOptionDef extends OptionBase {
  type: 'number';
  min: number;
  max: number;
  default: number;
}

export type OptionDef = SelectOptionDef | CheckboxOptionDef | NumberOptionDef;

export interface RenderContext {
  /** Colour print (otherwise black & white). */
  color: boolean;
  options: Options;
}

export interface GridLayout {
  columns: number;
  rows: number;
}

/**
 * A worksheet task type (clocks, thermometers, ...).
 * Adding a new kind of exercise = implementing this interface and registering
 * the module in `src/tasks/index.ts`. The options panel is built from `options`.
 */
export interface TaskModule<P = unknown> {
  id: string;
  /** Name shown in the task picker. */
  name: string;
  options: OptionDef[];
  /** Allowed numbers of tasks per page. */
  counts: number[];
  defaultCount: number;
  defaultInstruction(options: Options): string;
  layout(count: number, options: Options): GridLayout;
  generate(rng: Rng, count: number, options: Options): P[];
  /** HTML (usually inline SVG + answer field) of a single task for the pupil. */
  renderTask(task: P, ctx: RenderContext): string;
  /** HTML of the solved task for the answer key. */
  renderAnswer(task: P, ctx: RenderContext): string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTaskModule = TaskModule<any>;
