import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import type { EvalScenario, EvalOptions } from './types.js';

export function loadScenarios(scenariosDir: string, options: EvalOptions): EvalScenario[] {
  const files = readdirSync(scenariosDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

  let scenarios: EvalScenario[] = files.map((file) => {
    const raw = readFileSync(join(scenariosDir, file), 'utf-8');
    return parse(raw) as EvalScenario;
  });

  if (options.scenario) {
    scenarios = scenarios.filter((s) => s.id === options.scenario);
  }

  if (options.tag) {
    scenarios = scenarios.filter((s) => s.tags.includes(options.tag!));
  }

  return scenarios;
}
