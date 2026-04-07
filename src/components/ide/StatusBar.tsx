'use client';

import React from 'react';
import {
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Wifi,
  PanelBottom,
  Layout,
  Braces,
  DollarSign,
  Maximize2,
} from 'lucide-react';
import { useIDEStore } from '@/stores/use-ide-store';
import { useEditorStore } from '@/stores/use-editor-store';
import { useAIAgentStore } from '@/stores/use-ai-agent-store';
import { useCostTrackerStore } from '@/stores/use-cost-tracker-store';
import { NotificationCenter } from '@/components/ide/NotificationCenter';

export function StatusBar() {
  const {
    toggleBottomPanel,
    bottomPanelOpen,
    sidebarOpen,
    toggleSidebar,
    toggleRightPanel,
    rightPanelOpen,
    settings,
  } = useIDEStore();

  const activeTab = useEditorStore((s) => {
    const tab = s.openTabs.find((t) => t.fileId === s.activeTabId);
    return tab;
  });
  const agents = useAIAgentStore((s) => s.agents);
  const runningAgents = agents.filter((a) => a.status === 'running').length;
  const { getTotalTokens } = useCostTrackerStore();
  const tokens = getTotalTokens();

  return (
    <div className="h-6 bg-[#181825] border-t border-[#313244] flex items-center justify-between px-2 text-[11px] select-none flex-shrink-0 z-10">
      {/* Left section */}
      <div className="flex items-center gap-0">
        {/* Git branch */}
        <button className="flex items-center gap-1.5 px-2 h-6 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
          <CheckCircle2 className="w-3 h-3 text-[#a6e3a1]" />
        </button>

        {/* Errors and warnings */}
        <button className="flex items-center gap-1.5 px-2 h-6 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors">
          <AlertCircle className="w-3 h-3 text-[#f38ba8]" />
          <span>1</span>
          <AlertCircle className="w-3 h-3 text-[#f9e2af]" />
          <span>1</span>
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-0">
        {/* Line / Column indicator */}
        {activeTab && (
          <button className="flex items-center gap-1 px-2 h-6 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors">
            <span>Ln 1, Col 1</span>
          </button>
        )}

        {/* Spaces / Tab size */}
        <button className="flex items-center gap-1 px-2 h-6 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors">
          <span>Spaces: {settings.tabSize}</span>
        </button>

        {/* Encoding */}
        <button className="flex items-center gap-1 px-2 h-6 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors">
          <span>UTF-8</span>
        </button>

        {/* Language */}
        {activeTab && (
          <button className="flex items-center gap-1 px-2 h-6 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors">
            <Braces className="w-3 h-3" />
            <span>{activeTab.language}</span>
          </button>
        )}

        {/* AI Agents */}
        {runningAgents > 0 && (
          <button className="flex items-center gap-1 px-2 h-6 text-[#89b4fa] hover:bg-[#313244] transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-[#89b4fa] animate-pulse" />
            <span>{runningAgents} agent{runningAgents > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* Token usage */}
        {(tokens.input > 0 || tokens.output > 0) && (
          <button className="flex items-center gap-1 px-2 h-6 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors">
            <DollarSign className="w-3 h-3" />
            <span>{((tokens.input + tokens.output) / 1000).toFixed(1)}k tokens</span>
          </button>
        )}

        {/* Notifications */}
        <NotificationCenter />

        {/* Connection status */}
        <div className="flex items-center gap-1 px-1 h-6 text-[#a6e3a1]">
          <Wifi className="w-3 h-3" />
        </div>

        {/* Bottom panel toggle */}
        <button
          onClick={toggleBottomPanel}
          className={`flex items-center gap-1 px-2 h-6 transition-colors ${bottomPanelOpen ? 'text-[#cdd6f4]' : 'text-[#6c7086]'} hover:bg-[#313244]`}
        >
          <PanelBottom className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
