import { create } from 'zustand';
import type { Context, ContextCreate, ContextUpdate, ContextMember } from '@netior/shared/types';
import { contextService } from '../services';

interface ContextStore {
  contexts: Context[];
  members: ContextMember[];
  activeContextId: string | null;
  loading: boolean;

  loadContexts: (networkId: string) => Promise<void>;
  createContext: (data: ContextCreate) => Promise<Context>;
  updateContext: (id: string, data: ContextUpdate) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
  loadMembers: (contextId: string) => Promise<void>;
  addMember: (contextId: string, memberType: 'object' | 'edge', memberId: string) => Promise<ContextMember>;
  removeMember: (id: string) => Promise<void>;
  setActiveContext: (id: string | null) => void;
  clear: () => void;
}

export const useContextStore = create<ContextStore>((set) => ({
  contexts: [],
  members: [],
  activeContextId: null,
  loading: false,

  loadContexts: async (networkId) => {
    set({ loading: true });
    try {
      const contexts = await contextService.list(networkId);
      set({ contexts });
    } finally {
      set({ loading: false });
    }
  },

  createContext: async (data) => {
    const context = await contextService.create(data);
    set((s) => ({ contexts: [...s.contexts, context] }));
    return context;
  },

  updateContext: async (id, data) => {
    const updated = await contextService.update(id, data);
    set((s) => ({
      contexts: s.contexts.map((c) => (c.id === id ? updated : c)),
    }));
  },

  deleteContext: async (id) => {
    await contextService.delete(id);
    set((s) => ({
      contexts: s.contexts.filter((c) => c.id !== id),
      activeContextId: s.activeContextId === id ? null : s.activeContextId,
    }));
  },

  loadMembers: async (contextId) => {
    const members = await contextService.getMembers(contextId);
    set({ members });
  },

  addMember: async (contextId, memberType, memberId) => {
    const member = await contextService.addMember(contextId, memberType, memberId);
    set((s) => ({ members: [...s.members, member] }));
    return member;
  },

  removeMember: async (id) => {
    await contextService.removeMember(id);
    set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
  },

  setActiveContext: (id) => {
    set({ activeContextId: id });
    if (id) {
      contextService.getMembers(id).then((members) => set({ members }));
    } else {
      set({ members: [] });
    }
  },

  clear: () => set({ contexts: [], members: [], activeContextId: null, loading: false }),
}));
