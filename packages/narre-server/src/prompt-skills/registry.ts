import type { NarrePromptSkillKey } from '@netior/shared/types';
import type { NarrePromptSkillDefinition } from './types.js';

export async function loadPromptSkill(
  skillKey: NarrePromptSkillKey | undefined,
): Promise<NarrePromptSkillDefinition | null> {
  switch (skillKey) {
    case 'bootstrap':
      return (await import('./bootstrap-skill.js')).bootstrapPromptSkill;
    case 'index':
      return (await import('./index-skill.js')).indexPromptSkill;
    default:
      return null;
  }
}
