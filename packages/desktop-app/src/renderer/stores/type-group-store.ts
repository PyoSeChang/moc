import { create } from 'zustand';
import type { TypeGroup, TypeGroupCreate, TypeGroupUpdate, TypeGroupKind } from '@netior/shared/types';
import { typeGroupService } from '../services';

interface TypeGroupStore {
  groups: TypeGroup[];
  loading: boolean;

  loadGroups: (projectId: string, kind: TypeGroupKind) => Promise<void>;
  createGroup: (data: TypeGroupCreate) => Promise<TypeGroup>;
  updateGroup: (id: string, data: TypeGroupUpdate) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;

  clear: () => void;
}

export const useTypeGroupStore = create<TypeGroupStore>((set) => ({
  groups: [],
  loading: false,

  loadGroups: async (projectId, kind) => {
    set({ loading: true });
    try {
      const groups = await typeGroupService.list(projectId, kind);
      set({ groups });
    } finally {
      set({ loading: false });
    }
  },

  createGroup: async (data) => {
    const group = await typeGroupService.create(data);
    set((s) => ({ groups: [...s.groups, group] }));
    return group;
  },

  updateGroup: async (id, data) => {
    const updated = await typeGroupService.update(id, data);
    set((s) => ({
      groups: s.groups.map((g) => (g.id === id ? updated : g)),
    }));
  },

  deleteGroup: async (id) => {
    await typeGroupService.delete(id);
    set((s) => ({ groups: s.groups.filter((g) => g.id !== id) }));
  },

  clear: () => set({ groups: [], loading: false }),
}));
