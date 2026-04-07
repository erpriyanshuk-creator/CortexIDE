'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Keyboard,
  FileText,
  Edit3,
  Eye,
  Bot,
  Terminal,
  Navigation,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '@/stores/use-ide-store';

interface Shortcut {
  id: string;
  keys: string;
  description: string;
  category: ShortcutCategory;
  action?: () => void;
}

type ShortcutCategory = 'File' | 'Edit' | 'View' | 'AI' | 'Terminal' | 'Navigation';

interface ShortcutGroup {
  category: ShortcutCategory;
  icon: React.ReactNode;
  color: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'File',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-[#89b4fa]',
    shortcuts: [
      { id: 'new-file', keys: 'Ctrl+N', description: 'New File', category: 'File' },
      { id: 'save', keys: 'Ctrl+S', description: 'Save File', category: 'File' },
      { id: 'save-as', keys: 'Ctrl+Shift+S', description: 'Save As', category: 'File' },
      { id: 'close-tab', keys: 'Ctrl+W', description: 'Close Tab', category: 'File' },
      { id: 'close-all', keys: 'Ctrl+Shift+W', description: 'Close All Tabs', category: 'File' },
    ],
  },
  {
    category: 'Edit',
    icon: <Edit3 className="w-4 h-4" />,
    color: 'text-[#a6e3a1]',
    shortcuts: [
      { id: 'find', keys: 'Ctrl+F', description: 'Find in File', category: 'Edit' },
      { id: 'find-replace', keys: 'Ctrl+H', description: 'Find and Replace', category: 'Edit' },
      { id: 'search-files', keys: 'Ctrl+Shift+F', description: 'Search Across Files', category: 'Edit' },
      { id: 'toggle-comment', keys: 'Ctrl+/', description: 'Toggle Line Comment', category: 'Edit' },
      { id: 'format', keys: 'Shift+Alt+F', description: 'Format Document', category: 'Edit' },
    ],
  },
  {
    category: 'View',
    icon: <Eye className="w-4 h-4" />,
    color: 'text-[#f9e2af]',
    shortcuts: [
      { id: 'command-palette', keys: 'Ctrl+K', description: 'Command Palette', category: 'View' },
      { id: 'sidebar', keys: 'Ctrl+B', description: 'Toggle Sidebar', category: 'View' },
      { id: 'terminal', keys: 'Ctrl+`', description: 'Toggle Terminal', category: 'View' },
      { id: 'ai-panel', keys: 'Ctrl+J', description: 'Toggle AI Panel', category: 'View' },
      { id: 'settings', keys: 'Ctrl+,', description: 'Open Settings', category: 'View' },
      { id: 'zen-mode', keys: 'Ctrl+Shift+Z', description: 'Toggle Zen Mode', category: 'View' },
      { id: 'word-wrap', keys: 'Alt+Z', description: 'Toggle Word Wrap', category: 'View' },
    ],
  },
  {
    category: 'AI',
    icon: <Bot className="w-4 h-4" />,
    color: 'text-[#cba6f7]',
    shortcuts: [
      { id: 'new-chat', keys: 'Ctrl+Shift+L', description: 'New AI Chat', category: 'AI' },
      { id: 'quick-ai', keys: 'Ctrl+I', description: 'Inline AI Suggestion', category: 'AI' },
      { id: 'agent-monitor', keys: 'Ctrl+Shift+A', description: 'Agent Monitor', category: 'AI' },
    ],
  },
  {
    category: 'Terminal',
    icon: <Terminal className="w-4 h-4" />,
    color: 'text-[#fab387]',
    shortcuts: [
      { id: 'new-terminal', keys: 'Ctrl+Shift+`', description: 'New Terminal', category: 'Terminal' },
      { id: 'clear-terminal', keys: 'Ctrl+L', description: 'Clear Terminal', category: 'Terminal' },
    ],
  },
  {
    category: 'Navigation',
    icon: <Navigation className="w-4 h-4" />,
    color: 'text-[#94e2d5]',
    shortcuts: [
      { id: 'go-to-file', keys: 'Ctrl+P', description: 'Quick Open File', category: 'Navigation' },
      { id: 'go-to-line', keys: 'Ctrl+G', description: 'Go to Line', category: 'Navigation' },
      { id: 'go-to-symbol', keys: 'Ctrl+Shift+O', description: 'Go to Symbol', category: 'Navigation' },
      { id: 'back', keys: 'Alt+Left', description: 'Go Back', category: 'Navigation' },
      { id: 'forward', keys: 'Alt+Right', description: 'Go Forward', category: 'Navigation' },
    ],
  },
];

export function ShortcutsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const { toggleSidebar, toggleRightPanel, toggleBottomPanel, setSidebarView, setBottomPanelView, updateSettings, settings } = useIDEStore();

  const executeShortcut = useCallback((id: string) => {
    switch (id) {
      case 'sidebar': toggleSidebar(); break;
      case 'ai-panel': toggleRightPanel(); break;
      case 'terminal': toggleBottomPanel(); break;
      case 'search-files': setSidebarView('search'); break;
      case 'zen-mode': updateSettings({ minimap: !settings.minimap }); break;
      case 'word-wrap': updateSettings({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' }); break;
    }
    onClose();
  }, [toggleSidebar, toggleRightPanel, toggleBottomPanel, setSidebarView, updateSettings, settings, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const filteredGroups = search.trim()
    ? SHORTCUT_GROUPS.map(g => ({
        ...g,
        shortcuts: g.shortcuts.filter(s =>
          s.description.toLowerCase().includes(search.toLowerCase()) ||
          s.keys.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.shortcuts.length > 0)
    : SHORTCUT_GROUPS;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#11111b]/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] bg-[#1e1e2e] border border-[#313244] rounded-xl shadow-2xl overflow-hidden animate-[nexus-scale-in_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#313244]">
          <Keyboard className="w-4 h-4 text-[#89b4fa]" />
          <span className="text-sm font-semibold text-[#cdd6f4]">Keyboard Shortcuts</span>
          <div className="flex-1" />
          <button onClick={onClose} className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-[#313244]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6c7086]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full bg-[#181825] border border-[#313244] rounded-lg px-8 py-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Shortcuts grid */}
        <div className="overflow-y-auto max-h-[50vh] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map(group => (
              <div key={group.category} className="space-y-1.5">
                <div className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-wider', group.color)}>
                  {group.icon}
                  <span>{group.category}</span>
                </div>
                {group.shortcuts.map(shortcut => (
                  <button
                    key={shortcut.id}
                    onClick={() => executeShortcut(shortcut.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#313244] transition-colors group"
                  >
                    <span className="text-xs text-[#a6adc8] group-hover:text-[#cdd6f4] transition-colors">{shortcut.description}</span>
                    <kbd className="flex items-center gap-0.5 text-[10px] font-mono text-[#6c7086]">
                      {shortcut.keys.split('+').map((key, i, arr) => (
                        <React.Fragment key={i}>
                          <span className="px-1 py-0.5 bg-[#181825] border border-[#313244] rounded text-[9px] group-hover:border-[#45475a] transition-colors">{key}</span>
                          {i < arr.length - 1 && <span className="text-[#45475a]">+</span>}
                        </React.Fragment>
                      ))}
                    </kbd>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#313244] text-[10px] text-[#45475a] text-center">
          Press <kbd className="px-1 py-0.5 bg-[#313244] rounded text-[9px] text-[#6c7086] font-mono mx-0.5">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcuts() {
  const { setCommandPaletteOpen, commandPaletteOpen, setSettingsDialogOpen, toggleSidebar, toggleRightPanel, toggleBottomPanel, setSidebarView, updateSettings, settings } = useIDEStore();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+K - Command palette
      if (ctrl && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }

      // Ctrl+Shift+F - Search
      if (ctrl && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setSidebarView('search');
        if (!useIDEStore.getState().sidebarOpen) toggleSidebar();
      }

      // Ctrl+B - Sidebar
      if (ctrl && e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl+J - AI Panel
      if (ctrl && e.key === 'j' && !e.shiftKey) {
        e.preventDefault();
        toggleRightPanel();
      }

      // Ctrl+` - Terminal
      if (ctrl && e.key === '`' && !e.shiftKey) {
        e.preventDefault();
        toggleBottomPanel();
      }

      // Ctrl+, - Settings
      if (ctrl && e.key === ',') {
        e.preventDefault();
        setSettingsDialogOpen(true);
      }

      // Ctrl+/ - Keyboard shortcuts
      if (ctrl && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
      }

      // Ctrl+Shift+Z - Zen mode
      if (ctrl && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        updateSettings({ minimap: !settings.minimap });
      }

      // Alt+Z - Word wrap
      if (e.altKey && e.key === 'z') {
        e.preventDefault();
        updateSettings({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' });
      }

      // Escape
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setSettingsDialogOpen(false);
        setShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen, setSettingsDialogOpen, toggleSidebar, toggleRightPanel, toggleBottomPanel, setSidebarView, updateSettings, settings]);

  return { shortcutsOpen, setShortcutsOpen };
}

export { SHORTCUT_GROUPS };
