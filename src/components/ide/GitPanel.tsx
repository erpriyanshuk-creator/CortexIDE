'use client';

import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  GitCommit,
  FileText,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  MessageSquare,
  RefreshCw,
  GitMerge,
  Clock,
  ArrowUp,
  ArrowDown,
  Diff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFileIcon } from '@/lib/types';

type FileStatus = 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
type DiffLineType = 'add' | 'remove' | 'context';

interface GitFile {
  path: string;
  name: string;
  status: FileStatus;
  staged: boolean;
  additions: number;
  deletions: number;
  diff?: DiffLine[];
}

interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

// Simulated git data
const SIMULATED_FILES: GitFile[] = [
  {
    path: 'src/app/page.tsx',
    name: 'page.tsx',
    status: 'modified',
    staged: true,
    additions: 12,
    deletions: 3,
    diff: [
      { type: 'context', content: "  const [count, setCount] = useState(0);", oldLineNum: 13, newLineNum: 13 },
      { type: 'context', content: '', oldLineNum: 14, newLineNum: 14 },
      { type: 'remove', content: "  return (", oldLineNum: 15 },
      { type: 'remove', content: '    <div className="min-h-screen bg-gray-950">', oldLineNum: 16 },
      { type: 'add', content: '  return (', newLineNum: 15 },
      { type: 'add', content: '    <div className="min-h-screen bg-[#0a0a0f]">', newLineNum: 16 },
      { type: 'add', content: '      <NexusLayout>', newLineNum: 17 },
      { type: 'add', content: '        <Header />', newLineNum: 18 },
      { type: 'add', content: '        <main className="flex-1">', newLineNum: 19 },
      { type: 'add', content: '          <HeroSection />', newLineNum: 20 },
      { type: 'add', content: '          <FeatureGrid />', newLineNum: 21 },
      { type: 'add', content: '        </main>', newLineNum: 22 },
      { type: 'add', content: '        <Footer />', newLineNum: 23 },
      { type: 'add', content: '      </NexusLayout>', newLineNum: 24 },
      { type: 'context', content: '    </div>', oldLineNum: 17, newLineNum: 25 },
    ],
  },
  {
    path: 'src/app/globals.css',
    name: 'globals.css',
    status: 'modified',
    staged: false,
    additions: 5,
    deletions: 2,
    diff: [
      { type: 'context', content: ':root {', oldLineNum: 1, newLineNum: 1 },
      { type: 'remove', content: '  --background: #0a0a0f;', oldLineNum: 2 },
      { type: 'remove', content: '  --foreground: #e2e8f0;', oldLineNum: 3 },
      { type: 'add', content: '  --background: #1e1e2e;', newLineNum: 2 },
      { type: 'add', content: '  --foreground: #cdd6f4;', newLineNum: 3 },
      { type: 'add', content: '  --primary: #89b4fa;', newLineNum: 4 },
      { type: 'add', content: '  --accent: #cba6f7;', newLineNum: 5 },
    ],
  },
  {
    path: 'src/components/Header.tsx',
    name: 'Header.tsx',
    status: 'added',
    staged: true,
    additions: 24,
    deletions: 0,
    diff: [
      { type: 'add', content: "'use client';", newLineNum: 1 },
      { type: 'add', content: '', newLineNum: 2 },
      { type: 'add', content: 'export function Header() {', newLineNum: 3 },
      { type: 'add', content: '  return (', newLineNum: 4 },
      { type: 'add', content: '    <header className="h-16 border-b">', newLineNum: 5 },
      { type: 'add', content: '      <nav className="max-w-7xl mx-auto px-6">', newLineNum: 6 },
      { type: 'add', content: '        <Logo />', newLineNum: 7 },
      { type: 'add', content: '      </nav>', newLineNum: 8 },
      { type: 'add', content: '    </header>', newLineNum: 9 },
      { type: 'add', content: '  );', newLineNum: 10 },
      { type: 'add', content: '}', newLineNum: 11 },
    ],
  },
  {
    path: 'src/lib/old-utils.ts',
    name: 'old-utils.ts',
    status: 'deleted',
    staged: false,
    additions: 0,
    deletions: 15,
    diff: [
      { type: 'remove', content: 'export function formatDate(d: Date) {', oldLineNum: 1 },
      { type: 'remove', content: '  return d.toLocaleDateString();', oldLineNum: 2 },
      { type: 'remove', content: '}', oldLineNum: 3 },
      { type: 'remove', content: '', oldLineNum: 4 },
      { type: 'remove', content: 'export function debounce(fn, ms) {', oldLineNum: 5 },
    ],
  },
  {
    path: 'src/components/Footer.tsx',
    name: 'Footer.tsx',
    status: 'untracked',
    staged: false,
    additions: 10,
    deletions: 0,
  },
];

const SIMULATED_BRANCHES = ['main', 'feature/ai-panel', 'fix/responsive', 'experiment/new-theme'];
const SIMULATED_COMMITS: GitCommit[] = [
  { hash: 'a3f8b2c', message: 'feat: add AI chat panel with streaming', author: 'NexusAI', date: '2 hours ago', branch: 'main' },
  { hash: 'e7d1a4f', message: 'style: apply catppuccin mocha theme', author: 'NexusAI', date: '4 hours ago', branch: 'main' },
  { hash: 'b9c3e5d', message: 'fix: responsive layout for mobile devices', author: 'NexusAI', date: '6 hours ago', branch: 'main' },
  { hash: '1f4a2b8', message: 'refactor: extract shared components', author: 'NexusAI', date: '1 day ago', branch: 'main' },
  { hash: '5d7c9e3', message: 'feat: implement file explorer with context menus', author: 'NexusAI', date: '1 day ago', branch: 'main' },
  { hash: '8b2f4a1', message: 'feat: add Monaco editor with custom theme', author: 'NexusAI', date: '2 days ago', branch: 'main' },
  { hash: '3c9d7e5', message: 'chore: update dependencies', author: 'NexusAI', date: '3 days ago', branch: 'main' },
];

const STATUS_CONFIG: Record<FileStatus, { color: string; bg: string; label: string }> = {
  modified: { color: 'text-[#f9e2af]', bg: 'bg-[#f9e2af]/10', label: 'M' },
  added: { color: 'text-[#a6e3a1]', bg: 'bg-[#a6e3a1]/10', label: 'A' },
  deleted: { color: 'text-[#f38ba8]', bg: 'bg-[#f38ba8]/10', label: 'D' },
  untracked: { color: 'text-[#89b4fa]', bg: 'bg-[#89b4fa]/10', label: 'U' },
  renamed: { color: 'text-[#cba6f7]', bg: 'bg-[#cba6f7]/10', label: 'R' },
};

export function GitPanel() {
  const [branch, setBranch] = useState('main');
  const [showBranches, setShowBranches] = useState(false);
  const [files, setFiles] = useState(SIMULATED_FILES);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [commitMsg, setCommitMsg] = useState('');
  const [activeView, setActiveView] = useState<'changes' | 'commits'>('changes');

  const stagedCount = files.filter(f => f.staged).length;
  const unstagedCount = files.filter(f => !f.staged).length;
  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  const toggleStage = (path: string) => {
    setFiles(prev => prev.map(f => f.path === path ? { ...f, staged: !f.staged } : f));
  };

  const stageAll = () => setFiles(prev => prev.map(f => ({ ...f, staged: true })));
  const unstageAll = () => setFiles(prev => prev.map(f => ({ ...f, staged: false })));

  const stagedFiles = useMemo(() => files.filter(f => f.staged), [files]);
  const unstagedFiles = useMemo(() => files.filter(f => !f.staged), [files]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#313244] space-y-2">
        {/* Branch selector */}
        <div className="relative">
          <button
            onClick={() => setShowBranches(!showBranches)}
            className="flex items-center gap-2 w-full px-2 py-1.5 bg-[#1e1e2e] border border-[#313244] rounded-md hover:border-[#45475a] transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#a6e3a1]" />
            <span className="text-xs text-[#cdd6f4] flex-1 text-left">{branch}</span>
            <ChevronDown className="w-3 h-3 text-[#6c7086]" />
          </button>
          {showBranches && (
            <div className="absolute top-full left-0 right-0 z-10 bg-[#1e1e2e] border border-[#313244] rounded-md shadow-xl mt-1 overflow-hidden">
              {SIMULATED_BRANCHES.map(b => (
                <button
                  key={b}
                  onClick={() => { setBranch(b); setShowBranches(false); }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2',
                    b === branch ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]'
                  )}
                >
                  <GitBranch className="w-3 h-3" />
                  <span>{b}</span>
                  {b === 'main' && <span className="ml-auto text-[9px] bg-[#313244] px-1 py-0.5 rounded">default</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#6c7086]">~{files.length} changes</span>
          <span className="text-[#a6e3a1]">+{totalAdditions}</span>
          <span className="text-[#f38ba8]">-{totalDeletions}</span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('changes')}
            className={cn(
              'flex-1 py-1 text-[10px] rounded transition-colors text-center',
              activeView === 'changes' ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#a6adc8]'
            )}
          >
            Changes
          </button>
          <button
            onClick={() => setActiveView('commits')}
            className={cn(
              'flex-1 py-1 text-[10px] rounded transition-colors text-center',
              activeView === 'commits' ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#a6adc8]'
            )}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeView === 'changes' ? (
          <div className="py-1">
            {/* Staged section */}
            {stagedCount > 0 && (
              <div>
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6c7086]">
                    Staged Changes ({stagedCount})
                  </span>
                  <button onClick={unstageAll} className="text-[9px] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
                    Unstage All
                  </button>
                </div>
                {stagedFiles.map(f => (
                  <GitFileRow
                    key={f.path}
                    file={f}
                    expanded={expandedFile === f.path}
                    onToggle={() => setExpandedFile(expandedFile === f.path ? null : f.path)}
                    onStageToggle={() => toggleStage(f.path)}
                  />
                ))}
              </div>
            )}

            {/* Unstaged section */}
            {unstagedCount > 0 && (
              <div>
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6c7086]">
                    Changes ({unstagedCount})
                  </span>
                  <button onClick={stageAll} className="text-[9px] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
                    Stage All
                  </button>
                </div>
                {unstagedFiles.map(f => (
                  <GitFileRow
                    key={f.path}
                    file={f}
                    expanded={expandedFile === f.path}
                    onToggle={() => setExpandedFile(expandedFile === f.path ? null : f.path)}
                    onStageToggle={() => toggleStage(f.path)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Commit history */
          <div className="py-1">
            {SIMULATED_COMMITS.map(commit => (
              <div key={commit.hash} className="px-3 py-2 hover:bg-[#1e1e2e] transition-colors border-b border-[#313244]/50">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#313244] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <GitCommit className="w-3 h-3 text-[#89b4fa]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-[#cdd6f4] font-medium truncate">{commit.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-[#89b4fa] font-mono">{commit.hash}</span>
                      <span className="text-[9px] text-[#6c7086]">{commit.author}</span>
                      <span className="text-[9px] text-[#45475a]">{commit.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commit bar */}
      <div className="px-3 py-2 border-t border-[#313244] space-y-1.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="Commit message..."
            className="flex-1 bg-[#1e1e2e] border border-[#313244] rounded-md px-2.5 py-1.5 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors"
          />
          <button
            disabled={!commitMsg.trim() || stagedCount === 0}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1',
              commitMsg.trim() && stagedCount > 0
                ? 'bg-[#a6e3a1] text-[#1e1e2e] hover:bg-[#b8eab6]'
                : 'bg-[#313244] text-[#6c7086] cursor-not-allowed'
            )}
          >
            <Check className="w-3 h-3" />
            Commit
          </button>
        </div>
        <div className="flex items-center justify-between text-[9px] text-[#6c7086]">
          <span>{stagedCount} staged</span>
          <div className="flex items-center gap-2">
            <button className="hover:text-[#cdd6f4] transition-colors flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5" />
              Pull
            </button>
            <button className="hover:text-[#cdd6f4] transition-colors flex items-center gap-1">
              <ArrowUp className="w-2.5 h-2.5" />
              Push
            </button>
            <button className="hover:text-[#cdd6f4] transition-colors flex items-center gap-1">
              <GitMerge className="w-2.5 h-2.5" />
              Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GitFileRow({
  file,
  expanded,
  onToggle,
  onStageToggle,
}: {
  file: GitFile;
  expanded: boolean;
  onToggle: () => void;
  onStageToggle: () => void;
}) {
  const cfg = STATUS_CONFIG[file.status];
  return (
    <div>
      <div className="flex items-center gap-1.5 px-3 py-1 hover:bg-[#1e1e2e] transition-colors group">
        <button onClick={onToggle} className="text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <button
          onClick={onStageToggle}
          className={cn(
            'w-4 h-4 rounded flex items-center justify-center transition-colors flex-shrink-0',
            file.staged ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'border border-[#45475a] text-transparent hover:border-[#89b4fa]'
          )}
        >
          <Check className="w-2.5 h-2.5" />
        </button>
        <span className="text-xs">{getFileIcon(file.name)}</span>
        <span className="text-[11px] text-[#cdd6f4] truncate flex-1">{file.name}</span>
        <span className={cn('text-[9px] px-1 py-0.5 rounded font-mono', cfg.color, cfg.bg)}>{cfg.label}</span>
        <div className="flex items-center gap-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">
          {file.additions > 0 && <span className="text-[#a6e3a1]">+{file.additions}</span>}
          {file.deletions > 0 && <span className="text-[#f38ba8]">-{file.deletions}</span>}
        </div>
      </div>

      {/* Diff view */}
      {expanded && file.diff && (
        <div className="bg-[#11111b] mx-3 mb-1 rounded border border-[#313244] overflow-hidden">
          <div className="px-2 py-1 bg-[#181825] border-b border-[#313244] text-[9px] text-[#6c7086] font-mono flex items-center gap-2">
            <Diff className="w-2.5 h-2.5" />
            {file.path}
          </div>
          <div className="overflow-x-auto max-h-48 overflow-y-auto font-mono text-[10px]">
            {file.diff.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'flex whitespace-pre',
                  line.type === 'add' && 'bg-[#a6e3a1]/10',
                  line.type === 'remove' && 'bg-[#f38ba8]/10'
                )}
              >
                <span className="w-8 text-right pr-2 text-[#45475a] select-none flex-shrink-0">
                  {line.type === 'add' ? line.newLineNum : line.type === 'remove' ? line.oldLineNum : line.newLineNum || ''}
                </span>
                <span className={cn(
                  'w-4 text-center select-none flex-shrink-0',
                  line.type === 'add' && 'text-[#a6e3a1]',
                  line.type === 'remove' && 'text-[#f38ba8]',
                  line.type === 'context' && 'text-[#45475a]'
                )}>
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                </span>
                <span className={cn(
                  'flex-1 px-1',
                  line.type === 'add' && 'text-[#a6e3a1]',
                  line.type === 'remove' && 'text-[#f38ba8]',
                  line.type === 'context' && 'text-[#6c7086]'
                )}>
                  {line.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
