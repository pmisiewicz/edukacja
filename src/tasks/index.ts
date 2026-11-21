import type { AnyTaskModule } from '../core/types';
import { calendarModule } from './calendar';
import { clockModule } from './clock';
import { elapsedModule } from './elapsed';
import { mathModule } from './math';
import { moneyModule } from './money';
import { rulerModule } from './ruler';
import { scaleModule } from './scale';
import { thermometerModule } from './thermometer';
import { lettersModule } from './writing/letters';
import { patternsModule } from './writing/patterns';

/** All available worksheet types, in picker order (grouped by `category`). Register new task modules here. */
export const modules: AnyTaskModule[] = [
  clockModule,
  elapsedModule,
  calendarModule,
  thermometerModule,
  rulerModule,
  scaleModule,
  mathModule,
  moneyModule,
  patternsModule,
  lettersModule,
];

export function getModule(id: string): AnyTaskModule {
  return modules.find((m) => m.id === id) ?? modules[0];
}
