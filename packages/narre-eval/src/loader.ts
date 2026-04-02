import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { pathToFileURL } from 'url';
import type { EvalScenario, EvalOptions } from './types.js';

interface ScenarioYaml {
  id: string;
  description: string;
  type: 'single-turn' | 'conversation';
  tags: string[];
  turns: Array<{ role: 'user'; content: string }>;
  verify: EvalScenario['verify'];
  qualitative: EvalScenario['qualitative'];
}

export async function loadScenarios(scenariosDir: string, options: EvalOptions): Promise<EvalScenario[]> {
  const entries = readdirSync(scenariosDir).filter((entry) => {
    const fullPath = join(scenariosDir, entry);
    return statSync(fullPath).isDirectory();
  });

  const scenarios: EvalScenario[] = [];

  for (const dir of entries) {
    const scenarioDir = join(scenariosDir, dir);
    const yamlPath = join(scenarioDir, 'scenario.yaml');

    if (!existsSync(yamlPath)) continue;

    const raw = readFileSync(yamlPath, 'utf-8');
    const yaml = parse(raw) as ScenarioYaml;

    // Dynamic import seed.ts
    const seedPath = join(scenarioDir, 'seed.ts');
    if (!existsSync(seedPath)) {
      throw new Error(`seed.ts not found in ${scenarioDir}`);
    }
    const seedModule = await import(pathToFileURL(seedPath).href);
    const seed = seedModule.default;

    // Dynamic import responder.ts (optional, conversation only)
    let responder: EvalScenario['responder'];
    const responderPath = join(scenarioDir, 'responder.ts');
    if (existsSync(responderPath)) {
      const responderModule = await import(pathToFileURL(responderPath).href);
      responder = responderModule.default;
    } else if (yaml.type === 'conversation') {
      throw new Error(`conversation type scenario requires responder.ts: ${scenarioDir}`);
    }

    scenarios.push({
      id: yaml.id,
      description: yaml.description,
      type: yaml.type,
      tags: yaml.tags ?? [],
      turns: yaml.turns ?? [],
      verify: yaml.verify ?? [],
      qualitative: yaml.qualitative ?? [],
      scenarioDir,
      seed,
      responder,
    });
  }

  // Apply filters
  let filtered = scenarios;

  if (options.scenario) {
    filtered = filtered.filter((s) => s.id === options.scenario);
  }

  if (options.tag) {
    filtered = filtered.filter((s) => s.tags.includes(options.tag!));
  }

  return filtered;
}
