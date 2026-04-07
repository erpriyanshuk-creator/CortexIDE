'use client';

import React, { useCallback } from 'react';
import { X, Circle } from 'lucide-react';
import { useEditorStore } from '@/stores/use-editor-store';
import { getFileIcon } from '@/lib/types';
import { cn } from '@/lib/utils';

export function EditorTabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useEditorStore();

  if (openTabs.length === 0) {
    return (
      <div className="h-9 border-b border-[#313244] bg-[#181825] flex items-center px-3">
        <span className="text-xs text-[#6c7086]">No files open</span>
      </div>
    );
  }

  return (
    <div className="h-9 bg-[#181825] border-b border-[#313244] flex items-end overflow-x-auto scrollbar-none">
      <div className="flex items-end h-full">
        {openTabs.map((tab) => {
          const isActive = tab.fileId === activeTabId;
          return (
            <div
              key={tab.fileId}
              className={cn(
                'group flex items-center gap-1.5 h-7 px-3 cursor-pointer border-r border-[#313244] transition-all duration-150 min-w-0 max-w-[180px] flex-shrink-0',
                isActive
                  ? 'bg-[#1e1e2e] text-[#cdd6f4] border-t-2 border-t-[#89b4fa]'
                  : 'bg-[#181825] text-[#6c7086] border-t-2 border-t-transparent hover:bg-[#1e1e2e] hover:text-[#a6adc8]'
              )}
              onClick={() => setActiveTab(tab.fileId)}
            >
              {/* Modified indicator */}
              {tab.isDirty && (
                <Circle className="w-2 h-2 fill-[#f9e2af] text-[#f9e2af] flex-shrink-0" />
              )}

              {/* File icon */}
              <span className="text-xs flex-shrink-0">{getFileIcon(tab.name)}</span>

              {/* File name */}
              <span className="text-xs truncate">{tab.name}</span>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.fileId);
                }}
                className={cn(
                  'w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0',
                  isActive
                    ? 'hover:bg-[#313244] text-[#cdd6f4]'
                    : 'hover:bg-[#313244] text-[#6c7086]'
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
