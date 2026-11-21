import type { AnyTaskModule } from '../core/types';
import { clockModule } from './clock';
import { mathModule } from './math';
import { thermometerModule } from './thermometer';

/** All available worksheet types. Register new task modules here. */
export const modules: AnyTaskModule[] = [clockModule, thermometerModule, mathModule];

export function getModule(id: string): AnyTaskModule {
  return modules.find((m) => m.id === id) ?? modules[0];
}
