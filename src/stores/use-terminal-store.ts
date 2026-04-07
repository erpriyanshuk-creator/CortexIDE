import { create } from 'zustand';
import type { TerminalSession } from '@/lib/types';
import { generateId } from '@/lib/types';

interface TerminalStore {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  
  createSession: () => string;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  addOutput: (sessionId: string, output: string) => void;
  clearSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
}

export const useTerminalStore = create<TerminalStore>()((set, get) => ({
  sessions: [],
  activeSessionId: null,

  createSession: () => {
    const id = generateId();
    const session: TerminalSession = {
      id,
      name: `Terminal ${get().sessions.length + 1}`,
      history: [
        '\x1b[36m~ NexusIDE Terminal v1.0\x1b[0m',
        '\x1b[90mType commands below. Press Enter to execute.\x1b[0m',
        '',
      ],
      cwd: '/home/user/project',
      isActive: true,
    };
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: id,
    }));
    return id;
  },

  removeSession: (id) => {
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id);
      const newActiveId =
        state.activeSessionId === id
          ? newSessions.length > 0
            ? newSessions[0].id
            : null
          : state.activeSessionId;
      return { sessions: newSessions, activeSessionId: newActiveId };
    });
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  addOutput: (sessionId, output) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, history: [...s.history, output] } : s
      ),
    }));
  },

  clearSession: (id) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, history: [] } : s
      ),
    }));
  },

  renameSession: (id, name) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, name } : s
      ),
    }));
  },
}));
