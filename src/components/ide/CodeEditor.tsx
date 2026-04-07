'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useEditorStore } from '@/stores/use-editor-store';
import { useFileSystemStore } from '@/stores/use-filesystem-store';
import { useIDEStore } from '@/stores/use-ide-store';
import { Sparkles, Save, ChevronRight, Minus, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CodeEditor() {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<any>(null);
  const {
    openTabs,
    activeTabId,
    getFileContent,
    updateFileContent,
  } = useEditorStore();
  const { getFileByPath, updateFileContent: updateFSContent } = useFileSystemStore();
  const { settings, updateSettings } = useIDEStore();
  const [wordWrap, setWordWrap] = useState(settings.wordWrap);
  const [minimap, setMinimap] = useState(settings.minimap);

  const activeTab = openTabs.find((t) => t.fileId === activeTabId);
  const content = activeTab ? getFileContent(activeTab.path) : '';

  // Load file content from filesystem on first open
  useEffect(() => {
    if (activeTab && !getFileContent(activeTab.path)) {
      const fileNode = getFileByPath(activeTab.path);
      if (fileNode?.content) {
        updateFileContent(activeTab.path, fileNode.content);
      }
    }
  }, [activeTab, activeTab?.path]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom theme
    monaco.editor.defineTheme('nexus-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cba6f7' },
        { token: 'string', foreground: 'a6e3a1' },
        { token: 'number', foreground: 'fab387' },
        { token: 'regexp', foreground: 'f38ba8' },
        { token: 'type', foreground: '89b4fa' },
        { token: 'function', foreground: '89b4fa' },
        { token: 'variable', foreground: 'cdd6f4' },
        { token: 'variable.predefined', foreground: 'f9e2af' },
        { token: 'operator', foreground: '89dceb' },
        { token: 'delimiter', foreground: '6c7086' },
        { token: 'tag', foreground: '89b4fa' },
        { token: 'attribute.name', foreground: 'f9e2af' },
        { token: 'attribute.value', foreground: 'a6e3a1' },
        { token: 'metatag', foreground: 'cba6f7' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editor.lineHighlightBackground': '#31324440',
        'editor.selectionBackground': '#45475a80',
        'editor.inactiveSelectionBackground': '#45475a40',
        'editorLineNumber.foreground': '#6c7086',
        'editorLineNumber.activeForeground': '#cdd6f4',
        'editorCursor.foreground': '#f5e0dc',
        'editor.findMatchBackground': '#f9e2af40',
        'editor.findMatchHighlightBackground': '#f9e2af20',
        'editorIndentGuide.background': '#313244',
        'editorIndentGuide.activeBackground': '#45475a',
        'editorBracketMatch.background': '#45475a40',
        'editorBracketMatch.border': '#89b4fa40',
        'editorSuggestWidget.background': '#1e1e2e',
        'editorSuggestWidget.border': '#313244',
        'editorSuggestWidget.selectedBackground': '#313244',
        'editorWidget.background': '#1e1e2e',
        'editorWidget.border': '#313244',
        'editorOverviewRuler.border': '#313244',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#45475a60',
        'scrollbarSlider.hoverBackground': '#585b7060',
        'scrollbarSlider.activeBackground': '#6c7086',
        'minimap.background': '#181825',
      },
    });
    monaco.editor.setTheme('nexus-dark');
  };

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeTab && value !== undefined) {
        updateFileContent(activeTab.path, value);
      }
    },
    [activeTab, updateFileContent]
  );

  // Handle Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeTab && editorRef.current) {
          const value = editorRef.current.getValue();
          updateFileContent(activeTab.path, value);
          updateFSContent(activeTab.path, value);
          useEditorStore.getState().markFileSaved(activeTab.path);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, updateFileContent, updateFSContent]);

  if (!activeTab) {
    return null; // WelcomeTab handles the empty state
  }

  // Breadcrumb path parts
  const pathParts = activeTab.path.split('/');
  const breadcrumbItems = pathParts.map((part, i) => ({
    name: part,
    path: pathParts.slice(0, i + 1).join('/'),
  }));

  return (
    <div className="h-full w-full flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-0.5 px-3 py-1 bg-[#1e1e2e] border-b border-[#313244] flex-shrink-0 text-[11px] overflow-x-auto scrollbar-none">
        {breadcrumbItems.map((item, i) => (
          <React.Fragment key={item.path}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-[#45475a] flex-shrink-0" />}
            <button
              className={cn(
                'hover:text-[#cdd6f4] transition-colors whitespace-nowrap',
                i === breadcrumbItems.length - 1 ? 'text-[#cdd6f4]' : 'text-[#6c7086]'
              )}
            >
              {item.name}
            </button>
          </React.Fragment>
        ))}
        <div className="flex-1" />
        {/* Editor toolbar */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => {
              const newWrap = wordWrap === 'on' ? 'off' : 'on';
              setWordWrap(newWrap);
              updateSettings({ wordWrap: newWrap as 'on' | 'off' });
            }}
            className={cn(
              'p-1 rounded transition-colors',
              wordWrap === 'on' ? 'text-[#89b4fa]' : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244]'
            )}
            title="Toggle Word Wrap"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setMinimap(!minimap);
              updateSettings({ minimap: !minimap });
            }}
            className={cn(
              'p-1 rounded transition-colors',
              minimap ? 'text-[#89b4fa]' : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244]'
            )}
            title="Toggle Minimap"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
            title="Save (Ctrl+S)"
            onClick={() => {
              if (editorRef.current) {
                const value = editorRef.current.getValue();
                updateFileContent(activeTab.path, value);
                updateFSContent(activeTab.path, value);
                useEditorStore.getState().markFileSaved(activeTab.path);
              }
            }}
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={activeTab.language}
          value={content}
          theme="nexus-dark"
          onChange={handleChange}
          onMount={handleEditorMount}
          options={{
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            tabSize: settings.tabSize,
            wordWrap: wordWrap,
            minimap: { enabled: minimap, scale: 2, showSlider: 'mouseover' },
            lineNumbers: settings.lineNumbers,
            bracketPairColorization: { enabled: settings.bracketPairColorization },
            cursorBlinking: settings.cursorBlinking,
            cursorStyle: settings.cursorStyle,
            smoothScrolling: settings.smoothScrolling,
            autoSave: settings.autoSave ? 'afterDelay' : 'off',
            autoSaveDelay: settings.autoSaveDelay,
            padding: { top: 12 },
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            stickyScroll: { enabled: true },
            guides: {
              indentation: true,
              bracketPairs: true,
              highlightActiveBracketPair: true,
              highlightActiveIndentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
          loading={
            <div className="h-full w-full flex items-center justify-center bg-[#1e1e2e]">
              <div className="w-8 h-8 border-2 border-[#89b4fa] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        />
      </div>
    </div>
  );
}
