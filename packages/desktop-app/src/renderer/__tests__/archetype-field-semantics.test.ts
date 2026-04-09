import { describe, expect, it } from 'vitest';
import {
  fromConceptOptionValue,
  parseArchetypeFieldOptions,
  stringifyArchetypeFieldOptions,
  toConceptOptionValue,
} from '../lib/archetype-field-options';

describe('archetype field options', () => {
  it('parses empty field options as empty choices and concept sources', () => {
    expect(parseArchetypeFieldOptions(null)).toEqual({
      choices: [],
      conceptOptionSourceIds: [],
    });
  });

  it('round-trips direct choices and concept option sources together', () => {
    const serialized = stringifyArchetypeFieldOptions({
      choices: ['manual'],
      conceptOptionSourceIds: ['job-archetype'],
    });

    expect(parseArchetypeFieldOptions(serialized)).toEqual({
      choices: ['manual'],
      conceptOptionSourceIds: ['job-archetype'],
    });
  });

  it('namespaces concept option values', () => {
    expect(toConceptOptionValue('concept-id')).toBe('concept:concept-id');
    expect(fromConceptOptionValue('concept:concept-id')).toBe('concept-id');
    expect(fromConceptOptionValue('manual')).toBeNull();
  });
});
