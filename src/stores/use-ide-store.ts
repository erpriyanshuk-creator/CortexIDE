import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  IDESettings,
  PanelSizes,
  MobileView,
  SidebarView,
  BottomPanelView,
} from '@/lib/types';
import { DEFAULT_SETTINGS, DEFAULT_PANEL_SIZES } from '@/lib/types';

interface IDEStore {
  // Panel visibility
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  
  // Active views
  sidebarView: SidebarView;
  bottomPanelView: BottomPanelView;
  mobileView: MobileView;
  
  // Settings
  settings: IDESettings;
  
  // Panel sizes
  panelSizes: PanelSizes;
  
  // Layout
  isMobile: boolean;
  commandPaletteOpen: boolean;
  settingsDialogOpen: boolean;
  
  // Actions
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setSidebarView: (view: SidebarView) => void;
  setBottomPanelView: (view: BottomPanelView) => void;
  setMobileView: (view: MobileView) => void;
  updateSettings: (settings: Partial<IDESettings>) => void;
  setPanelSize: (key: keyof PanelSizes, size: number) => void;
  setIsMobile: (isMobile: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSettingsDialogOpen: (open: boolean) => void;
}

export const useIDEStore = create<IDEStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      rightPanelOpen: false,
      bottomPanelOpen: false,
      sidebarView: 'files',
      bottomPanelView: 'terminal',
      mobileView: 'editor',
      settings: DEFAULT_SETTINGS,
      panelSizes: DEFAULT_PANEL_SIZES,
      isMobile: false,
      commandPaletteOpen: false,
      settingsDialogOpen: false,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
      toggleBottomPanel: () => set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),
      setSidebarView: (view) => set({ sidebarView: view }),
      setBottomPanelView: (view) => set({ bottomPanelView: view }),
      setMobileView: (view) => set({ mobileView: view }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setPanelSize: (key, size) =>
        set((state) => ({
          panelSizes: { ...state.panelSizes, [key]: size },
        })),
      setIsMobile: (isMobile) => set({ isMobile }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setSettingsDialogOpen: (open) => set({ settingsDialogOpen: open }),
    }),
    {
      name: 'nexus-ide-settings',
      partialize: (state) => ({
        settings: state.settings,
        panelSizes: state.panelSizes,
        sidebarOpen: state.sidebarOpen,
        rightPanelOpen: state.rightPanelOpen,
        bottomPanelOpen: state.bottomPanelOpen,
      }),
    }
  )
);
