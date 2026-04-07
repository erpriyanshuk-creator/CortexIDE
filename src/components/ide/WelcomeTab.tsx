'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  FileCode2,
  Bot,
  Terminal,
  Keyboard,
  GitBranch,
  Search,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Lightbulb,
  Zap,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '@/stores/use-ide-store';

const SHORTCUT_ITEMS = [
  { key: 'Ctrl+K', label: 'Command Palette' },
  { key: 'Ctrl+Shift+F', label: 'Search Files' },
  { key: 'Ctrl+`', label: 'Toggle Terminal' },
  { key: 'Ctrl+B', label: 'Toggle Sidebar' },
  { key: 'Ctrl+J', label: 'Toggle AI Panel' },
  { key: 'Ctrl+S', label: 'Save File' },
  { key: 'Ctrl+/', label: 'Keyboard Shortcuts' },
  { key: 'Ctrl+,', label: 'Settings' },
];

const TIPS = [
  { icon: <Bot className="w-5 h-5" />, title: 'AI-Powered Coding', desc: 'Use @mentions to include file context in your AI conversations. Type @filename in the chat.' },
  { icon: <Layers className="w-5 h-5" />, title: 'Multi-Agent System', desc: 'Run multiple specialized AI agents in parallel for complex tasks like code review and refactoring.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Smart Search', desc: 'Search across all files, find symbols, or fuzzy-match file names with Ctrl+Shift+F.' },
  { icon: <GitBranch className="w-5 h-5" />, title: 'Built-in Git', desc: 'Stage files, write commits, view diffs, and manage branches without leaving the editor.' },
];

const RECENT_PROJECTS = [
  { name: 'nexus-web-app', language: 'TypeScript', path: '~/projects/nexus-web-app' },
  { name: 'ml-pipeline', language: 'Python', path: '~/projects/ml-pipeline' },
  { name: 'rust-game-engine', language: 'Rust', path: '~/projects/rust-game-engine' },
];

export function WelcomeTab() {
  const [tipIdx, setTipIdx] = useState(0);
  const { toggleRightPanel, toggleBottomPanel, setSidebarView, setCommandPaletteOpen } = useIDEStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIdx(prev => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAI = useCallback(() => {
    toggleRightPanel();
  }, [toggleRightPanel]);

  const handleOpenSearch = useCallback(() => {
    setSidebarView('search');
  }, [setSidebarView]);

  const handleOpenTerminal = useCallback(() => {
    toggleBottomPanel();
  }, [toggleBottomPanel]);

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, [setCommandPaletteOpen]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-[#1e1e2e] overflow-auto">
      <div className="max-w-2xl w-full px-8 py-12 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#89b4fa] to-[#cba6f7] rounded-2xl flex items-center justify-center shadow-lg shadow-[#89b4fa]/20 animate-[nexus-glow_3s_ease-in-out_infinite]">
            <Sparkles className="w-10 h-10 text-[#1e1e2e]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#89b4fa] via-[#cba6f7] to-[#f38ba8] bg-clip-text text-transparent">
              NexusIDE
            </h1>
            <p className="text-sm text-[#6c7086] mt-2">
              The world&apos;s most advanced AI-powered IDE
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            icon={<FileCode2 className="w-5 h-5" />}
            label="Open File"
            shortcut="Ctrl+K"
            color="text-[#89b4fa]"
            bgColor="bg-[#89b4fa]/10"
            onClick={handleOpenCommandPalette}
          />
          <QuickAction
            icon={<Search className="w-5 h-5" />}
            label="Search"
            shortcut="Ctrl+Shift+F"
            color="text-[#a6e3a1]"
            bgColor="bg-[#a6e3a1]/10"
            onClick={handleOpenSearch}
          />
          <QuickAction
            icon={<Bot className="w-5 h-5" />}
            label="AI Chat"
            shortcut="Ctrl+J"
            color="text-[#cba6f7]"
            bgColor="bg-[#cba6f7]/10"
            onClick={handleOpenAI}
          />
          <QuickAction
            icon={<Terminal className="w-5 h-5" />}
            label="Terminal"
            shortcut="Ctrl+`"
            color="text-[#f9e2af]"
            bgColor="bg-[#f9e2af]/10"
            onClick={handleOpenTerminal}
          />
        </div>

        {/* Tips Carousel */}
        <div className="bg-[#181825] border border-[#313244] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#cdd6f4]">
              <Lightbulb className="w-4 h-4 text-[#f9e2af]" />
              Tips & Tricks
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTipIdx(prev => (prev - 1 + TIPS.length) % TIPS.length)}
                className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-[#6c7086]">{tipIdx + 1}/{TIPS.length}</span>
              <button
                onClick={() => setTipIdx(prev => (prev + 1) % TIPS.length)}
                className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-start gap-3 min-h-[60px]">
            <div className="text-[#89b4fa] mt-0.5">{TIPS[tipIdx].icon}</div>
            <div>
              <h3 className="text-sm font-medium text-[#cdd6f4]">{TIPS[tipIdx].title}</h3>
              <p className="text-xs text-[#a6adc8] mt-1">{TIPS[tipIdx].desc}</p>
            </div>
          </div>
          <div className="flex gap-1 justify-center">
            {TIPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTipIdx(i)}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === tipIdx ? 'bg-[#89b4fa] w-4' : 'bg-[#45475a] hover:bg-[#585b70]'
                )}
              />
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#6c7086] uppercase tracking-wider flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5" />
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {SHORTCUT_ITEMS.map(s => (
              <div key={s.key} className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-[#181825] transition-colors group">
                <span className="text-xs text-[#a6adc8]">{s.label}</span>
                <kbd className="px-1.5 py-0.5 bg-[#313244] rounded text-[10px] text-[#89b4fa] font-mono group-hover:bg-[#45475a] transition-colors">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#6c7086] uppercase tracking-wider flex items-center gap-2">
            <Rocket className="w-3.5 h-3.5" />
            Recent Projects
          </h3>
          <div className="space-y-1">
            {RECENT_PROJECTS.map(p => (
              <button key={p.name} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#181825] transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-[#313244] flex items-center justify-center text-xs">
                  <FileCode2 className="w-4 h-4 text-[#89b4fa]" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-[#cdd6f4]">{p.name}</div>
                  <div className="text-[10px] text-[#6c7086] font-mono">{p.path}</div>
                </div>
                <span className="ml-auto text-[9px] text-[#45475a] bg-[#313244] px-1.5 py-0.5 rounded">{p.language}</span>
                <ChevronRight className="w-3 h-3 text-[#45475a] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-[#45475a] pt-4 border-t border-[#313244]">
          NexusIDE v1.0.0 · Built with Next.js & Monaco Editor · Powered by AI
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  shortcut,
  color,
  bgColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-[#181825] border border-[#313244] rounded-xl hover:border-[#45475a] hover:bg-[#1e1e2e] transition-all group active:scale-95"
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110', bgColor, color)}>
        {icon}
      </div>
      <span className="text-xs font-medium text-[#cdd6f4]">{label}</span>
      <kbd className="text-[9px] text-[#6c7086] bg-[#313244] px-1.5 py-0.5 rounded font-mono">{shortcut}</kbd>
    </button>
  );
}
