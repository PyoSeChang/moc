import {
  buildBootstrapPrompt,
  determineBootstrapToolProfiles,
} from '../prompts/bootstrap.js';
import type { NarrePromptSkillDefinition } from './types.js';

export const bootstrapPromptSkill: NarrePromptSkillDefinition = {
  key: 'bootstrap',
  commandName: 'bootstrap',
  additionalToolProfiles: ['bootstrap-skill'],
  resolveToolProfiles: ({ historyTurns }) => determineBootstrapToolProfiles(historyTurns),
  buildPrompt: ({ params, behavior, historyTurns }) => buildBootstrapPrompt(params, behavior, historyTurns),
};
