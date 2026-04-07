'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  ChevronDown,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { useTerminalStore } from '@/stores/use-terminal-store';
import { cn } from '@/lib/utils';

// Simulated command responses
const COMMAND_RESPONSES: Record<string, string[]> = {
  'ls': ['src/  node_modules/  package.json  tsconfig.json  README.md  .gitignore'],
  'pwd': ['/home/user/project'],
  'whoami': ['nexus-dev'],
  'date': [new Date().toLocaleString()],
  'echo': [],
  'clear': [],
  'help': [
    'Available commands:',
    '  ls        - List files',
    '  pwd       - Print working directory',
    '  whoami    - Current user',
    '  date      - Show date/time',
    '  echo      - Echo text',
    '  clear     - Clear terminal',
    '  help      - Show this help',
    '  npm/run   - Package commands',
    '  git       - Git commands',
  ],
  'npm run dev': ['\x1b[36m  ▲ Next.js 14.0.0\x1b[0m', '\x1b[32m  - Local:    http://localhost:3000\x1b[0m', '\x1b[90m  - Environments: .env.local\x1b[0m', '', '\x1b[32m ✓ Ready in 1.2s\x1b[0m'],
  'npm run build': ['\x1b[36mCreating an optimized production build...\x1b[0m', '\x1b[32m ✓ Compiled successfully\x1b[0m', '\x1b[32m ✓ Linting and checking validity of types\x1b[0m', '\x1b[32m ✓ Collecting page data\x1b[0m', '\x1b[32m ✓ Generating static pages (3/3)\x1b[0m', '\x1b[32m ✓ Finalizing page optimization\x1b[0m', '', 'Route (app)              Size     First Load JS', '┌ ○ /                    5.2 kB         84.3 kB', '└ ○ /api/health          0 B            79.1 kB', '', '\x1b[32m ✓ Build completed in 8.5s\x1b[0m'],
  'git status': ['On branch \x1b[32mmain\x1b[0m', 'Changes not staged for commit:', '  \x1b[31mmodified:   src/app/page.tsx\x1b[0m', '  \x1b[31mmodified:   src/app/globals.css\x1b[0m', '', 'Untracked files:', '  \x1b[31msrc/components/Header.tsx\x1b[0m'],
  'git log': ['\x1b[33ma3f8b2c\x1b[0m feat: add AI chat panel (2 hours ago)', '\x1b[33me7d1a4f\x1b[0m style: apply catppuccin theme (4 hours ago)', '\x1b[33mb9c3e5d\x1b[0m fix: responsive layout (6 hours ago)'],
};

function processAnsi(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\x1b\[([0-9;]*)m/g;
  let lastIndex = 0;
  let currentColor = '';
  let match;

  const colorMap: Record<string, string> = {
    '0': '', '30': 'text-[#45475a]', '31': 'text-[#f38ba8]', '32': 'text-[#a6e3a1]',
    '33': 'text-[#f9e2af]', '34': 'text-[#89b4fa]', '35': 'text-[#cba6f7]',
    '36': 'text-[#94e2d5]', '37': 'text-[#cdd6f4]', '90': 'text-[#6c7086]',
    '91': 'text-[#f38ba8]', '92': 'text-[#a6e3a1]', '93': 'text-[#f9e2af]',
    '94': 'text-[#89b4fa]', '95': 'text-[#cba6f7]', '96': 'text-[#94e2d5]',
  };

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const segment = text.slice(lastIndex, match.index);
      parts.push(currentColor ? <span key={parts.length} className={currentColor}>{segment}</span> : segment);
    }
    const codes = match[1].split(';');
    if (codes.includes('0')) {
      currentColor = '';
    } else {
      currentColor = codes.map(c => colorMap[c] || '').filter(Boolean).join(' ') || currentColor;
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const segment = text.slice(lastIndex);
    parts.push(currentColor ? <span key={parts.length} className={currentColor}>{segment}</span> : segment);
  }

  return parts.length > 0 ? parts : [text];
}

export function MobileTerminal() {
  const {
    sessions,
    activeSessionId,
    createSession,
    addOutput,
  } = useTerminalStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-create session
  useEffect(() => {
    if (sessions.length === 0) createSession();
  }, [sessions.length, createSession]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const executeCommand = useCallback((cmd: string) => {
    if (!activeSessionId) return;
    addOutput(activeSessionId, `\x1b[32m❯\x1b[0m ${cmd}`);

    if (cmd.trim() === 'clear') {
      useTerminalStore.getState().clearSession(activeSessionId);
      return;
    }

    // Find matching command
    let response = COMMAND_RESPONSES[cmd.trim()];
    if (!response) {
      // Try prefix matching
      const key = Object.keys(COMMAND_RESPONSES).find(k => cmd.trim().startsWith(k));
      if (key && key !== 'echo') response = COMMAND_RESPONSES[key];
    }

    if (cmd.trim().startsWith('echo ')) {
      response = [cmd.trim().slice(5)];
    }

    if (!response) {
      response = [`\x1b[31mcommand not found: ${cmd.trim()}\x1b[0m`];
    }

    // Stagger output for realism
    response.forEach((line, i) => {
      setTimeout(() => {
        addOutput(activeSessionId, line);
      }, i * 50);
    });
  }, [activeSessionId, addOutput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = input;
      setInput('');
      executeCommand(cmd);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#11111b]">
      {/* Compact header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#181825] border-b border-[#313244]">
        <div className="flex items-center gap-1.5">
          <TerminalIcon className="w-3 h-3 text-[#a6e3a1]" />
          <span className="text-[10px] text-[#cdd6f4] font-mono">{activeSession?.name || 'Terminal'}</span>
        </div>
        <div className="flex items-center gap-1">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => useTerminalStore.getState().setActiveSession(s.id)}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                s.id === activeSessionId ? 'bg-[#a6e3a1]' : 'bg-[#45475a] hover:bg-[#585b70]'
              )}
            />
          ))}
          <button onClick={createSession} className="p-0.5 text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-[11px] leading-relaxed min-h-0" onClick={() => inputRef.current?.focus()}>
        {activeSession?.history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all min-h-[1.2em]">
            {processAnsi(line)}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[#a6e3a1]">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[#cdd6f4] outline-none font-mono text-[11px] caret-[#f5e0dc]"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
