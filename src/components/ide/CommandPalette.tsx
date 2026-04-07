'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  File,
  Settings,
  Palette,
  GitBranch,
  Terminal,
  Bot,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useIDEStore } from '@/stores/use-ide-store';
import { useFileSystemStore } from '@/stores/use-filesystem-store';
import { useEditorStore } from '@/stores/use-editor-store';
import { useAIAgentStore } from '@/stores/use-ai-agent-store';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { toggleSidebar, toggleBottomPanel, toggleRightPanel, setSettingsDialogOpen } = useIDEStore();
  const { files, getFileByPath } = useFileSystemStore();
  const { openFile } = useEditorStore();
  const { createConversation } = useAIAgentStore();

  // Flatten file tree
  const allFiles = useMemo(() => {
    const result: { path: string; name: string; language: string }[] = [];
    const traverse = (nodes: typeof files) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          result.push({
            path: node.path,
            name: node.name,
            language: node.language || 'plaintext',
          });
        }
        if (node.children) traverse(node.children);
      }
    };
    traverse(files);
    return result;
  }, [files]);

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: 'toggle-sidebar',
        label: 'Toggle Sidebar',
        icon: <File className="w-4 h-4" />,
        category: 'View',
        action: toggleSidebar,
      },
      {
        id: 'toggle-terminal',
        label: 'Toggle Terminal',
        icon: <Terminal className="w-4 h-4" />,
        category: 'View',
        action: toggleBottomPanel,
      },
      {
        id: 'toggle-ai',
        label: 'Toggle AI Panel',
        icon: <Bot className="w-4 h-4" />,
        category: 'View',
        action: toggleRightPanel,
      },
      {
        id: 'new-chat',
        label: 'New AI Chat',
        icon: <Sparkles className="w-4 h-4" />,
        category: 'AI',
        action: () => {
          createConversation();
          if (!useIDEStore.getState().rightPanelOpen) toggleRightPanel();
        },
      },
      {
        id: 'settings',
        label: 'Open Settings',
        icon: <Settings className="w-4 h-4" />,
        category: 'Preferences',
        action: () => setSettingsDialogOpen(true),
      },
      {
        id: 'theme',
        label: 'Toggle Theme',
        icon: <Palette className="w-4 h-4" />,
        category: 'Preferences',
        action: () => {
          const current = useIDEStore.getState().settings.theme;
          useIDEStore.getState().updateSettings({
            theme: current === 'dark' ? 'light' : 'dark',
          });
        },
      },
      ...allFiles.map((file) => ({
        id: `file-${file.path}`,
        label: file.name,
        description: file.path,
        icon: <File className="w-4 h-4" />,
        category: 'Files',
        action: () => {
          const node = getFileByPath(file.path);
          if (node) {
            openFile(node.id, file.path, file.name, file.language);
          }
        },
      })),
    ],
    [allFiles, toggleSidebar, toggleBottomPanel, toggleRightPanel, createConversation, setSettingsDialogOpen, getFileByPath, openFile]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        (cmd.description && cmd.description.toLowerCase().includes(lower))
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
        onOpenChange(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex, onOpenChange]);

  // Group commands by category
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  let flatIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 bg-[#1e1e2e] border-[#313244] text-[#cdd6f4] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 border-b border-[#313244]">
          <Search className="w-4 h-4 text-[#6c7086]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search files..."
            className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-[#cdd6f4] placeholder-[#6c7086]"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6c7086]">
                {category}
              </div>
              {items.map((item) => {
                const idx = flatIndex++;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onOpenChange(false);
                      setQuery('');
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                      idx === selectedIndex
                        ? 'bg-[#313244] text-[#cdd6f4]'
                        : 'text-[#a6adc8] hover:bg-[#313244]/50'
                    )}
                  >
                    <span className="text-[#6c7086]">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.description && (
                      <span className="text-[11px] text-[#6c7086] truncate max-w-[200px]">
                        {item.description}
                      </span>
                    )}
                    <ArrowRight className="w-3 h-3 text-[#6c7086] opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          ))}
          {filteredCommands.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-[#6c7086]">
              No results found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
