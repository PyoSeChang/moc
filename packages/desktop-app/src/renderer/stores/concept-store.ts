import { create } from 'zustand';
import type { Concept, ConceptCreate, ConceptUpdate } from '@moc/shared/types';
import { conceptService } from '../services';

interface ConceptStore {
  concepts: Concept[];
  loading: boolean;

  loadByProject: (projectId: string) => Promise<void>;
  createConcept: (data: ConceptCreate) => Promise<Concept>;
  updateConcept: (id: string, data: ConceptUpdate) => Promise<void>;
  deleteConcept: (id: string) => Promise<void>;
  clear: () => void;
}

export const useConceptStore = create<ConceptStore>((set) => ({
  concepts: [],
  loading: false,

  loadByProject: async (projectId) => {
    set({ loading: true });
    try {
      const concepts = await conceptService.getByProject(projectId);
      set({ concepts });
    } finally {
      set({ loading: false });
    }
  },

  createConcept: async (data) => {
    const concept = await conceptService.create(data);
    set((s) => ({ concepts: [...s.concepts, concept] }));
    return concept;
  },

  updateConcept: async (id, data) => {
    const updated = await conceptService.update(id, data);
    set((s) => ({
      concepts: s.concepts.map((c) => (c.id === id ? updated : c)),
    }));
  },

  deleteConcept: async (id) => {
    await conceptService.delete(id);
    set((s) => ({ concepts: s.concepts.filter((c) => c.id !== id) }));
  },

  clear: () => set({ concepts: [] }),
}));
