'use client';

import React, { useState } from 'react';
import {
  Terminal,
  FileOutput,
  AlertTriangle,
  Activity,
  ChevronDown,
  X,
  Maximize2,
} from 'lucide-react';
import { useIDEStore } from '@/stores/use-ide-store';
import { TerminalPanel } from '@/components/ide/Terminal';
import { AgentMonitor } from '@/components/ide/AgentMonitor';
import { cn } from '@/lib/utils';
import type { BottomPanelView } from '@/lib/types';

const PANEL_TABS: { id: BottomPanelView; icon: React.ReactNode; label: string }[] = [
  { id: 'terminal', icon: <Terminal className="w-3.5 h-3.5" />, label: 'Terminal' },
  { id: 'output', icon: <FileOutput className="w-3.5 h-3.5" />, label: 'Output' },
  { id: 'problems', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Problems' },
  { id: 'ai-activity', icon: <Activity className="w-3.5 h-3.5" />, label: 'AI Activity' },
];

export function BottomPanel() {
  const { bottomPanelView, setBottomPanelView, toggleBottomPanel } = useIDEStore();

  return (
    <div className="h-full flex flex-col bg-[#181825]">
      {/* Panel tabs */}
      <div className="h-8 flex items-center border-b border-[#313244] bg-[#181825] px-2 flex-shrink-0">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setBottomPanelView(tab.id)}
            className={cn(
              'flex items-center gap-1.5 h-full px-2 text-xs transition-colors border-b-2',
              bottomPanelView === tab.id
                ? 'text-[#cdd6f4] border-b-[#89b4fa]'
                : 'text-[#6c7086] border-b-transparent hover:text-[#a6adc8]'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={toggleBottomPanel}
          className="p-1 text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 min-h-0">
        {bottomPanelView === 'terminal' && <TerminalPanel />}
        {bottomPanelView === 'output' && <OutputPanel />}
        {bottomPanelView === 'problems' && <ProblemsPanel />}
        {bottomPanelView === 'ai-activity' && <AgentMonitor />}
      </div>
    </div>
  );
}

function OutputPanel() {
  const [output] = useState([
    { type: 'info', text: '[12:00:01] Starting development server...' },
    { type: 'success', text: '[12:00:02] Ready in 1.2s' },
    { type: 'info', text: '[12:00:03] Compiled /src/app/page.tsx' },
    { type: 'info', text: '[12:00:04] Fast Refresh: /src/components/Button.tsx' },
    { type: 'warning', text: '[12:00:05] Warning: Unused variable "temp" in /src/app/page.tsx:15' },
  ]);

  return (
    <div className="h-full overflow-y-auto p-3 font-mono text-xs space-y-1">
      {output.map((line, i) => (
        <div
          key={i}
          className={cn(
            line.type === 'success' && 'text-[#a6e3a1]',
            line.type === 'warning' && 'text-[#f9e2af]',
            line.type === 'error' && 'text-[#f38ba8]',
            line.type === 'info' && 'text-[#6c7086]'
          )}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}

function ProblemsPanel() {
  const problems = [
    { type: 'warning', file: 'page.tsx', line: 15, col: 5, message: "Variable 'temp' is declared but never used." },
    { type: 'error', file: 'Button.tsx', line: 23, col: 12, message: "Type 'string' is not assignable to type 'number'." },
    { type: 'info', file: 'utils.ts', line: 8, col: 1, message: "Consider using optional chaining." },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2 text-xs">
        {problems.map((problem, i) => (
          <div
            key={i}
            className="flex items-start gap-2 px-2 py-1.5 hover:bg-[#1e1e2e] rounded cursor-pointer transition-colors"
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full mt-1 flex-shrink-0',
                problem.type === 'error' && 'bg-[#f38ba8]',
                problem.type === 'warning' && 'bg-[#f9e2af]',
                problem.type === 'info' && 'bg-[#89b4fa]'
              )}
            />
            <div className="min-w-0 flex-1">
              <span className="text-[#cdd6f4]">{problem.message}</span>
              <span className="text-[#6c7086] ml-2">
                {problem.file}:{problem.line}:{problem.col}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
