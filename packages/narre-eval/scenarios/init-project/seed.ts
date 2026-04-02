import type { SeedContext } from '../../src/types.js';

export default async function seed(ctx: SeedContext): Promise<void> {
  ctx.createProject({
    name: '조선시대',
    root_dir: ctx.tempDir,
  });
}
