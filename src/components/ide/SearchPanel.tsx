'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search,
  FileText,
  Code2,
  Replace,
  ChevronDown,
  ChevronRight,
  X,
  Clock,
  CaseSensitive,
  WholeWord,
  Regex,
  ArrowDown,
  ArrowUp,
  RotateCcw,
} from 'lucide-react';
import { useFileSystemStore } from '@/stores/use-filesystem-store';
import { useEditorStore } from '@/stores/use-editor-store';
import { cn } from '@/lib/utils';
import { getFileIcon } from '@/lib/types';

interface SearchResult {
  filePath: string;
  fileName: string;
  line: number;
  column: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

type SearchMode = 'files' | 'content' | 'symbols';

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('content');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { files } = useFileSystemStore();
  const { openFile, getFileContent } = useEditorStore();

  // Flatten file tree
  const allFiles = useMemo(() => {
    const result: { path: string; name: string; content?: string; language?: string }[] = [];
    const traverse = (nodes: typeof files) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          const content = getFileContent(node.path) || node.content || '';
          result.push({ path: node.path, name: node.name, content, language: node.language });
        }
        if (node.children) traverse(node.children);
      }
    };
    traverse(files);
    return result;
  }, [files, getFileContent]);

  // Content search
  const contentResults = useMemo(() => {
    if (!query.trim() || mode !== 'content') return [];
    const results: SearchResult[] = [];
    const flags = caseSensitive ? 'g' : 'gi';
    let pattern: RegExp;
    try {
      if (useRegex) {
        pattern = new RegExp(query, flags);
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBound = wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(wordBound, flags);
      }
    } catch {
      return [];
    }

    for (const file of allFiles) {
      const lines = (file.content || '').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = pattern.exec(line);
        if (match) {
          results.push({
            filePath: file.path,
            fileName: file.name,
            line: i + 1,
            column: match.index + 1,
            text: line.trim(),
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
        }
      }
    }
    return results;
  }, [query, allFiles, caseSensitive, wholeWord, useRegex, mode]);

  // File name search (fuzzy)
  const fileResults = useMemo(() => {
    if (!query.trim() || mode !== 'files') return [];
    const lower = query.toLowerCase();
    return allFiles.filter(f => f.name.toLowerCase().includes(lower) || f.path.toLowerCase().includes(lower));
  }, [query, allFiles, mode]);

  // Symbol search (basic regex)
  const symbolResults = useMemo(() => {
    if (!query.trim() || mode !== 'symbols') return [];
    const results: SearchResult[] = [];
    const funcRegex = /(?:function|const|let|var|class|interface|type|export)\s+(\w+)/g;
    for (const file of allFiles) {
      const lines = (file.content || '').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const match = funcRegex.exec(lines[i]);
        if (match) {
          const symbolName = match[1];
          if (symbolName.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              filePath: file.path,
              fileName: file.name,
              line: i + 1,
              column: 1,
              text: lines[i].trim(),
              matchStart: lines[i].indexOf(symbolName),
              matchEnd: lines[i].indexOf(symbolName) + symbolName.length,
            });
          }
        }
      }
    }
    return results;
  }, [query, allFiles, mode]);

  const allResults = mode === 'content' ? contentResults : mode === 'files' ? [] : symbolResults;
  const resultFiles = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of allResults) {
      if (!map.has(r.filePath)) map.set(r.filePath, []);
      map.get(r.filePath)!.push(r);
    }
    return map;
  }, [allResults]);

  // Save to recent
  const saveSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== q);
      return [q, ...filtered].slice(0, 10);
    });
  }, []);

  const handleResultClick = useCallback((result: SearchResult | { path: string; name: string; language?: string }) => {
    if ('line' in result) {
      openFile(result.filePath, result.filePath, result.fileName, '');
    } else {
      openFile(result.path, result.path, result.name, result.language || '');
    }
  }, [openFile]);

  const handleReplaceAll = useCallback(() => {
    if (!query.trim() || !replaceQuery.trim() || mode !== 'content') return;
    saveSearch(query);
    const flags = caseSensitive ? 'g' : 'gi';
    let pattern: RegExp;
    try {
      if (useRegex) {
        pattern = new RegExp(query, flags);
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBound = wholeWord ? `\\b${escaped}\\b` : escaped;
        pattern = new RegExp(wordBound, flags);
      }
    } catch { return; }
    for (const file of allFiles) {
      const content = getFileContent(file.path) || '';
      if (pattern.test(content)) {
        const newContent = content.replace(pattern, replaceQuery);
        useEditorStore.getState().updateFileContent(file.path, newContent);
        useFileSystemStore.getState().updateFileContent(file.path, newContent);
      }
    }
  }, [query, replaceQuery, caseSensitive, wholeWord, useRegex, allFiles, mode, saveSearch, getFileContent]);

  const toggleFile = (path: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // Compute expanded files from results (derived, not set in effect)
  const derivedExpandedFiles = useMemo(() => {
    if (!query.trim()) return expandedFiles;
    const fileMap = new Map<string, SearchResult[]>();
    for (const r of allResults) {
      if (!fileMap.has(r.filePath)) fileMap.set(r.filePath, []);
      fileMap.get(r.filePath)!.push(r);
    }
    if (fileMap.size > 0) return new Set(fileMap.keys());
    return expandedFiles;
  }, [query, allResults, expandedFiles]);

  const modes: { id: SearchMode; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: 'Content', icon: <FileText className="w-3 h-3" /> },
    { id: 'files', label: 'Files', icon: <Search className="w-3 h-3" /> },
    { id: 'symbols', label: 'Symbols', icon: <Code2 className="w-3 h-3" /> },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Mode selector */}
      <div className="flex items-center gap-0.5 px-3 pt-2 pb-1">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all',
              mode === m.id
                ? 'bg-[#313244] text-[#89b4fa]'
                : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#1e1e2e]'
            )}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="px-3 pb-1 relative">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6c7086]" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowRecent(false); }}
            onFocus={() => recentSearches.length > 0 && !query && setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveSearch(query);
            }}
            placeholder={mode === 'content' ? 'Search in files...' : mode === 'files' ? 'Search file names...' : 'Search symbols...'}
            className="w-full bg-[#1e1e2e] border border-[#313244] rounded-md px-7 py-1.5 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Recent searches */}
        {showRecent && (
          <div className="absolute top-full left-3 right-3 z-20 bg-[#1e1e2e] border border-[#313244] rounded-md shadow-xl mt-1 overflow-hidden">
            <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-[#6c7086] border-b border-[#313244] flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Recent
            </div>
            {recentSearches.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); setShowRecent(false); }}
                className="w-full text-left px-2 py-1.5 text-xs text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4] transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-2.5 h-2.5 text-[#6c7086]" />
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Options row */}
      <div className="flex items-center gap-1 px-3 pb-1">
        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={cn('p-1 rounded transition-colors', caseSensitive ? 'bg-[#313244] text-[#89b4fa]' : 'text-[#6c7086] hover:text-[#cdd6f4]')}
          title="Match Case"
        >
          <CaseSensitive className="w-3 h-3" />
        </button>
        <button
          onClick={() => setWholeWord(!wholeWord)}
          className={cn('p-1 rounded transition-colors', wholeWord ? 'bg-[#313244] text-[#89b4fa]' : 'text-[#6c7086] hover:text-[#cdd6f4]')}
          title="Match Whole Word"
        >
          <WholeWord className="w-3 h-3" />
        </button>
        <button
          onClick={() => setUseRegex(!useRegex)}
          className={cn('p-1 rounded transition-colors', useRegex ? 'bg-[#313244] text-[#89b4fa]' : 'text-[#6c7086] hover:text-[#cdd6f4]')}
          title="Use Regular Expression"
        >
          <Regex className="w-3 h-3" />
        </button>
        {mode === 'content' && (
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={cn('p-1 rounded transition-colors ml-auto', showReplace ? 'bg-[#313244] text-[#89b4fa]' : 'text-[#6c7086] hover:text-[#cdd6f4]')}
            title="Toggle Replace"
          >
            <Replace className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Replace input */}
      {showReplace && mode === 'content' && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Replace className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6c7086]" />
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace with..."
              className="w-full bg-[#1e1e2e] border border-[#313244] rounded-md px-7 py-1.5 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] transition-colors"
            />
          </div>
          <button
            onClick={handleReplaceAll}
            disabled={!query.trim() || !replaceQuery.trim()}
            className="mt-1.5 w-full py-1 bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] text-[10px] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Replace All ({contentResults.length} results)
          </button>
        </div>
      )}

      {/* Results count */}
      {query.trim() && (
        <div className="px-3 py-1 text-[10px] text-[#6c7086] border-b border-[#313244]">
          {mode === 'content' && `${allResults.length} results in ${resultFiles.size} files`}
          {mode === 'files' && `${fileResults.length} files found`}
          {mode === 'symbols' && `${symbolResults.length} symbols found`}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Content / Symbol results grouped by file */}
        {(mode === 'content' || mode === 'symbols') && (
          <div className="py-1">
            {Array.from(resultFiles.entries()).map(([filePath, results]) => (
              <div key={filePath}>
                <button
                  onClick={() => toggleFile(filePath)}
                  className="w-full flex items-center gap-1.5 px-3 py-1 hover:bg-[#1e1e2e] transition-colors"
                >
                  {derivedExpandedFiles.has(filePath)
                    ? <ChevronDown className="w-3 h-3 text-[#6c7086] flex-shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-[#6c7086] flex-shrink-0" />
                  }
                  <span className="text-[11px]">{getFileIcon(results[0].fileName)}</span>
                  <span className="text-[11px] text-[#cdd6f4] font-medium truncate flex-1">{results[0].fileName}</span>
                  <span className="text-[9px] text-[#6c7086] bg-[#313244] px-1.5 py-0.5 rounded-full">{results.length}</span>
                </button>
                {derivedExpandedFiles.has(filePath) && (
                  <div>
                    {results.map((r, idx) => (
                      <button
                        key={`${r.filePath}-${r.line}-${idx}`}
                        onClick={() => handleResultClick(r)}
                        className={cn(
                          'w-full text-left px-3 pl-9 py-1 hover:bg-[#1e1e2e] transition-colors border-l-2',
                          selectedIdx === idx ? 'border-l-[#89b4fa] bg-[#1e1e2e]' : 'border-l-transparent'
                        )}
                      >
                        <div className="text-[10px] text-[#6c7086] font-mono mb-0.5">
                          {r.filePath}:{r.line}:{r.column}
                        </div>
                        <div className="text-[11px] text-[#a6adc8] font-mono truncate">
                          <span className="text-[#6c7086] mr-1">{String(r.line).padStart(2, ' ')}:</span>
                          {r.text.slice(0, r.matchStart)}
                          <span className="bg-[#f9e2af] text-[#1e1e2e] rounded px-0.5">{r.text.slice(r.matchStart, r.matchEnd)}</span>
                          {r.text.slice(r.matchEnd, r.matchStart + 60)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* File name results */}
        {mode === 'files' && (
          <div className="py-1">
            {fileResults.map(f => (
              <button
                key={f.path}
                onClick={() => handleResultClick(f)}
                className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-[#1e1e2e] transition-colors"
              >
                <span className="text-xs">{getFileIcon(f.name)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-[#cdd6f4] truncate">{f.name}</div>
                  <div className="text-[9px] text-[#6c7086] font-mono truncate">{f.path}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query.trim() && allResults.length === 0 && mode !== 'files' && (
          <div className="px-3 py-6 text-center">
            <Search className="w-6 h-6 text-[#45475a] mx-auto mb-2" />
            <p className="text-xs text-[#6c7086]">No results found</p>
          </div>
        )}
        {query.trim() && mode === 'files' && fileResults.length === 0 && (
          <div className="px-3 py-6 text-center">
            <Search className="w-6 h-6 text-[#45475a] mx-auto mb-2" />
            <p className="text-xs text-[#6c7086]">No files match</p>
          </div>
        )}
        {!query.trim() && (
          <div className="px-3 py-6 text-center">
            <Search className="w-6 h-6 text-[#45475a] mx-auto mb-2" />
            <p className="text-xs text-[#6c7086]">
              {mode === 'content' ? 'Search across file contents...' : mode === 'files' ? 'Search by file name...' : 'Search functions, classes, variables...'}
            </p>
            <p className="text-[10px] text-[#45475a] mt-1">Ctrl+Shift+F</p>
          </div>
        )}
      </div>
    </div>
  );
}
