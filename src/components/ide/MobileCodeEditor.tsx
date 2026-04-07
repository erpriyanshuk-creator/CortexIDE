'use client';

import React, { useRef, useCallback, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useEditorStore } from '@/stores/use-editor-store';
import { useFileSystemStore } from '@/stores/use-filesystem-store';
import { useIDEStore } from '@/stores/use-ide-store';
import { Save, Maximize2, MoreVertical, Copy, Undo, Redo } from 'lucide-react';

export function MobileCodeEditor() {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<any>(null);
  const {
    openTabs,
    activeTabId,
    getFileContent,
    updateFileContent,
  } = useEditorStore();
  const { getFileByPath, updateFileContent: updateFSContent } = useFileSystemStore();
  const { settings } = useIDEStore();
  const [showMenu, setShowMenu] = useState(false);

  const activeTab = openTabs.find((t) => t.fileId === activeTabId);
  const content = activeTab ? getFileContent(activeTab.path) : '';

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('nexus-mobile', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cba6f7' },
        { token: 'string', foreground: 'a6e3a1' },
        { token: 'number', foreground: 'fab387' },
        { token: 'type', foreground: '89b4fa' },
        { token: 'function', foreground: '89b4fa' },
        { token: 'variable', foreground: 'cdd6f4' },
        { token: 'operator', foreground: '89dceb' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editor.lineHighlightBackground': '#31324440',
        'editor.selectionBackground': '#45475a80',
        'editorLineNumber.foreground': '#6c7086',
        'editorCursor.foreground': '#f5e0dc',
        'editorIndentGuide.background': '#313244',
        'scrollbarSlider.background': '#45475a40',
        'scrollbarSlider.hoverBackground': '#585b7040',
      },
    });
    monaco.editor.setTheme('nexus-mobile');
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      lineNumbers: 'on',
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      padding: { top: 8, bottom: 40 },
    });
  };

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeTab && value !== undefined) {
        updateFileContent(activeTab.path, value);
      }
    },
    [activeTab, updateFileContent]
  );

  const handleSave = () => {
    if (activeTab && editorRef.current) {
      const value = editorRef.current.getValue();
      updateFileContent(activeTab.path, value);
      updateFSContent(activeTab.path, value);
      useEditorStore.getState().markFileSaved(activeTab.path);
    }
  };

  if (!activeTab) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#1e1e2e]">
        <p className="text-xs text-[#6c7086]">No file open</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Mobile toolbar */}
      <div className="absolute top-0 right-0 z-10 flex items-center gap-0.5 p-1">
        <button className="p-1.5 rounded text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors" onClick={handleSave}>
          <Save className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors" onClick={() => setShowMenu(!showMenu)}>
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {showMenu && (
        <div className="absolute top-8 right-2 z-20 bg-[#181825] border border-[#313244] rounded-lg shadow-xl p-1 w-36 animate-[nexus-slide-down_0.1s_ease-out]">
          <button onClick={() => { editorRef.current?.trigger('mobile', 'undo'); setShowMenu(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#cdd6f4] hover:bg-[#313244] rounded">
            <Undo className="w-3 h-3" /> Undo
          </button>
          <button onClick={() => { editorRef.current?.trigger('mobile', 'redo'); setShowMenu(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#cdd6f4] hover:bg-[#313244] rounded">
            <Redo className="w-3 h-3" /> Redo
          </button>
          <button onClick={() => { navigator.clipboard.writeText(editorRef.current?.getSelectedText() || ''); setShowMenu(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#cdd6f4] hover:bg-[#313244] rounded">
            <Copy className="w-3 h-3" /> Copy
          </button>
        </div>
      )}

      <Editor
        height="100%"
        language={activeTab.language}
        value={content}
        theme="nexus-mobile"
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          tabSize: settings.tabSize,
          wordWrap: 'on',
          minimap: { enabled: false },
          lineNumbers: 'on',
          bracketPairColorization: { enabled: true },
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 8, bottom: 40 },
          renderLineHighlight: 'all',
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
        loading={
          <div className="h-full w-full flex items-center justify-center bg-[#1e1e2e]">
            <div className="w-8 h-8 border-2 border-[#89b4fa] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      />
    </div>
  );
}
