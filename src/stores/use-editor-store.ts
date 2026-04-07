import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OpenTab } from '@/lib/types';

interface EditorStore {
  openTabs: OpenTab[];
  activeTabId: string | null;
  
  // File contents cache
  fileContents: Record<string, string>;
  originalContents: Record<string, string>;
  
  // Actions
  openFile: (fileId: string, path: string, name: string, language: string) => void;
  closeTab: (tabId: string) => string | null;
  setActiveTab: (tabId: string) => void;
  updateFileContent: (path: string, content: string) => void;
  getFileContent: (path: string) => string;
  isFileDirty: (path: string) => boolean;
  markFileSaved: (path: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      openTabs: [],
      activeTabId: null,
      fileContents: {},
      originalContents: {},

      openFile: (fileId, path, name, language) => {
        const state = get();
        const existing = state.openTabs.find((t) => t.path === path);
        if (existing) {
          set({ activeTabId: existing.fileId });
          return;
        }
        const newTab: OpenTab = {
          fileId,
          path,
          name,
          isDirty: false,
          language,
        };
        set({
          openTabs: [...state.openTabs, newTab],
          activeTabId: fileId,
        });
      },

      closeTab: (tabId) => {
        const state = get();
        const idx = state.openTabs.findIndex((t) => t.fileId === tabId);
        if (idx === -1) return null;
        const newTabs = state.openTabs.filter((t) => t.fileId !== tabId);
        const newActiveId =
          state.activeTabId === tabId
            ? newTabs.length > 0
              ? newTabs[Math.min(idx, newTabs.length - 1)].fileId
              : null
            : state.activeTabId;
        set({ openTabs: newTabs, activeTabId: newActiveId });
        return newActiveId;
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      updateFileContent: (path, content) => {
        set((state) => ({
          fileContents: { ...state.fileContents, [path]: content },
          openTabs: state.openTabs.map((t) =>
            t.path === path
              ? { ...t, isDirty: content !== (state.originalContents[path] ?? '') }
              : t
          ),
        }));
      },

      getFileContent: (path) => {
        return get().fileContents[path] ?? '';
      },

      isFileDirty: (path) => {
        const state = get();
        return state.openTabs.some(
          (t) => t.path === path && t.isDirty
        );
      },

      markFileSaved: (path) => {
        set((state) => ({
          originalContents: { ...state.originalContents, [path]: state.fileContents[path] ?? '' },
          openTabs: state.openTabs.map((t) =>
            t.path === path ? { ...t, isDirty: false } : t
          ),
        }));
      },

      closeOtherTabs: (tabId) => {
        set((state) => ({
          openTabs: state.openTabs.filter((t) => t.fileId === tabId),
          activeTabId: tabId,
        }));
      },

      closeAllTabs: () => {
        set({ openTabs: [], activeTabId: null });
      },

      reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
          const newTabs = [...state.openTabs];
          const [removed] = newTabs.splice(fromIndex, 1);
          newTabs.splice(toIndex, 0, removed);
          return { openTabs: newTabs };
        });
      },
    }),
    {
      name: 'nexus-editor-state',
      partialize: (state) => ({
        openTabs: state.openTabs,
        fileContents: state.fileContents,
        originalContents: state.originalContents,
      }),
    }
  )
);
