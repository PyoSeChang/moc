import type { SeedContext } from '../../src/types.js';

export default async function seed(ctx: SeedContext): Promise<void> {
  const project = ctx.createProject({
    name: '조선시대',
    root_dir: ctx.tempDir,
  });

  const archetype = ctx.createArchetype({
    project_id: project.id,
    name: '인물',
    icon: 'user',
    color: '#4A90D9',
  });

  ctx.createConcept({
    project_id: project.id,
    title: '세종대왕',
    archetype_id: archetype.id,
  });
}
