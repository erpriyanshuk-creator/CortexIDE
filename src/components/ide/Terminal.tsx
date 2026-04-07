'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  X,
  ChevronDown,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { useTerminalStore } from '@/stores/use-terminal-store';
import { useIDEStore } from '@/stores/use-ide-store';
import { cn } from '@/lib/utils';

const SIMULATED_COMMANDS: Record<string, string> = {
  help: '\x1b[36mAvailable commands:\x1b[0m\n  ls        - List files\n  pwd       - Print working directory\n  echo      - Print text\n  clear     - Clear terminal\n  date      - Show date\n  whoami    - Show user\n  node -v   - Node.js version\n  npm -v    - npm version\n  help      - Show this help',
  ls: '\x1b[34msrc/\x1b[0m  \x1b[34mnode_modules/\x1b[0m  package.json  tsconfig.json  README.md  .gitignore  .env.example',
  pwd: '/home/user/project',
  date: new Date().toString(),
  whoami: 'developer',
  'node -v': 'v20.11.0',
  'npm -v': '10.2.4',
  'npm run dev': '\x1b[36m  ▲ Next.js 14.0.0\x1b[0m\n  - Local:    \x1b[32mhttp://localhost:3000\x1b[0m\n  \x1b[32m ✓ Ready\x1b[0m\n  \n  \x1b[90mStarted server in 1.2s\x1b[0m',
  'npm run build': '\x1b[36m  ▲ Next.js 14.0.0\x1b[0m\n\n   Creating an optimized production build ...\n\n \x1b[32m ✓\x1b[0m Compiled successfully\n   \x1b[90mLinting and checking validity of types\x1b[0m\n   \x1b[90mCollecting page data ...\x1b[0m\n   \x1b[90mGenerating static pages ...\x1b[0m\n   \x1b[90mFinalizing page optimization\x1b[0m\n\nRoute (app)              Size     First Load JS\n┌ ○ /                    5.2 kB         84.3 kB\n└ ○ /api/health          0 B            79.1 kB\n\n \x1b[32m ✓\x1b[0m Build completed in 4.8s',
  git: '\x1b[36mOn branch main\x1b[0m\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean',
  'git status': '\x1b[36mOn branch main\x1b[0m\nChanges not staged for commit:\n  \x1b[31mmodified:   src/app/page.tsx\x1b[0m\n\nno changes added to commit',
};

export function TerminalPanel() {
  const { sessions, activeSessionId, createSession, removeSession, setActiveSession, addOutput, clearSession } = useTerminalStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  // Create initial session if none
  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.history]);

  const handleCommand = useCallback(() => {
    if (!input.trim() || !activeSessionId) return;

    // Add the command to output
    addOutput(activeSessionId, `\x1b[32m❯\x1b[0m ${input}`);

    // Process command
    const cmd = input.trim().toLowerCase();

    if (cmd === 'clear') {
      clearSession(activeSessionId);
    } else if (cmd.startsWith('echo ')) {
      addOutput(activeSessionId, input.slice(5));
    } else if (SIMULATED_COMMANDS[cmd]) {
      addOutput(activeSessionId, SIMULATED_COMMANDS[cmd]);
    } else if (cmd === 'ls -la') {
      addOutput(activeSessionId, 'total 48\ndrwxr-xr-x  8 dev dev 4096 Jan 1 12:00 .\ndrwxr-xr-x  3 dev dev 4096 Jan 1 12:00 ..\n-rw-r--r--  1 dev dev  234 Jan 1 12:00 .gitignore\ndrwxr-xr-x  4 dev dev 4096 Jan 1 12:00 node_modules\ndrwxr-xr-x  3 dev dev 4096 Jan 1 12:00 src\n-rw-r--r--  1 dev dev  567 Jan 1 12:00 package.json\n-rw-r--r--  1 dev dev  890 Jan 1 12:00 tsconfig.json\n-rw-r--r--  1 dev dev  432 Jan 1 12:00 README.md');
    } else {
      addOutput(activeSessionId, `\x1b[31mCommand not found: ${cmd}\x1b[0m`);
    }

    setInput('');
  }, [input, activeSessionId, addOutput, clearSession]);

  const renderAnsiText = (text: string) => {
    // Simple ANSI color code rendering
    const parts: React.ReactNode[] = [];
    let current = '';
    let i = 0;
    let color = '';

    while (i < text.length) {
      if (text[i] === '\x1b' && text[i + 1] === '[') {
        if (current) {
          parts.push(<span key={parts.length} style={{ color }}>{current}</span>);
          current = '';
        }
        const endIdx = text.indexOf('m', i);
        if (endIdx !== -1) {
          const code = text.substring(i + 2, endIdx);
          switch (code) {
            case '0': color = ''; break;
            case '31': color = '#f38ba8'; break;
            case '32': color = '#a6e3a1'; break;
            case '33': color = '#f9e2af'; break;
            case '34': color = '#89b4fa'; break;
            case '35': color = '#cba6f7'; break;
            case '36': color = '#94e2d5'; break;
            case '90': color = '#6c7086'; break;
            default: color = '';
          }
          i = endIdx + 1;
        } else {
          i++;
        }
      } else {
        current += text[i];
        i++;
      }
    }
    if (current) {
      parts.push(<span key={parts.length} style={{ color }}>{current}</span>);
    }
    return parts;
  };

  return (
    <div className="h-full flex flex-col bg-[#11111b]">
      {/* Terminal tabs */}
      <div className="h-8 flex items-center gap-0 border-b border-[#313244] bg-[#181825] px-2 flex-shrink-0">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              'flex items-center gap-1.5 h-full px-2 text-xs cursor-pointer border-r border-[#313244] transition-colors',
              session.id === activeSessionId
                ? 'text-[#cdd6f4] bg-[#11111b] border-t-2 border-t-[#a6e3a1]'
                : 'text-[#6c7086] hover:text-[#a6adc8]'
            )}
            onClick={() => setActiveSession(session.id)}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#a6e3a1]" />
            <span>{session.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSession(session.id);
              }}
              className="ml-1 opacity-0 group-hover:opacity-100 hover:text-[#f38ba8]"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={createSession}
          className="p-1 text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Terminal output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm leading-relaxed"
      >
        {activeSession?.history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {renderAnsiText(line)}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center">
          <span className="text-[#a6e3a1]">❯</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommand();
            }}
            className="flex-1 bg-transparent border-none outline-none text-[#cdd6f4] ml-2 font-mono text-sm caret-[#f5e0dc]"
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
