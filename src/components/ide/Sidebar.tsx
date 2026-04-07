'use client';

import React from 'react';
import {
  Files,
  Search,
  GitBranch,
  Blocks,
  Bot,
  Plus,
  FolderPlus,
  PanelLeftClose,
} from 'lucide-react';
import { useIDEStore } from '@/stores/use-ide-store';
import { useAIAgentStore } from '@/stores/use-ai-agent-store';
import { FileExplorer } from '@/components/ide/FileExplorer';
import { SearchPanel } from '@/components/ide/SearchPanel';
import { GitPanel } from '@/components/ide/GitPanel';
import { ExtensionsPanel } from '@/components/ide/ExtensionsPanel';
import { cn } from '@/lib/utils';
import type { SidebarView } from '@/lib/types';

const SIDEBAR_ITEMS: { id: SidebarView; icon: React.ReactNode; label: string; badge?: number }[] = [
  { id: 'files', icon: <Files className="w-4 h-4" />, label: 'Explorer' },
  { id: 'search', icon: <Search className="w-4 h-4" />, label: 'Search' },
  { id: 'git', icon: <GitBranch className="w-4 h-4" />, label: 'Source Control', badge: 3 },
  { id: 'extensions', icon: <Blocks className="w-4 h-4" />, label: 'Extensions' },
  { id: 'agents', icon: <Bot className="w-4 h-4" />, label: 'AI Agents' },
];

export function Sidebar() {
  const { sidebarView, setSidebarView, toggleSidebar } = useIDEStore();
  const isMobile = useIDEStore((s) => s.isMobile);

  return (
    <div className="h-full flex bg-[#181825] animate-[nexus-fade-in_0.15s_ease-out]">
      {/* Icon strip */}
      <div className="w-12 flex flex-col items-center py-2 gap-1 border-r border-[#313244] flex-shrink-0">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSidebarView(item.id)}
            className={cn(
              'relative w-10 h-10 flex items-center justify-center rounded-md transition-all duration-150 group',
              sidebarView === item.id
                ? 'bg-[#313244] text-[#89b4fa]'
                : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#1e1e2e]'
            )}
            title={item.label}
          >
            {item.icon}
            {item.badge && item.badge > 0 && (
              <span className="absolute top-1 right-1 bg-[#89b4fa] text-[#1e1e2e] w-3.5 h-3.5 rounded-full text-[7px] flex items-center justify-center font-bold">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center rounded-md text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#1e1e2e] transition-all"
            title="Close Sidebar (Ctrl+B)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="h-10 flex items-center justify-between px-4 border-b border-[#313244] flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6c7086]">
            {SIDEBAR_ITEMS.find((i) => i.id === sidebarView)?.label}
          </span>
          <div className="flex items-center gap-1">
            {sidebarView === 'files' && (
              <>
                <button
                  className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
                  title="New File"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
                  title="New Folder"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {sidebarView === 'files' && <FileExplorer />}
          {sidebarView === 'search' && <SearchPanel />}
          {sidebarView === 'git' && <GitPanel />}
          {sidebarView === 'extensions' && <ExtensionsPanel />}
          {sidebarView === 'agents' && <SidebarAgentPanel />}
        </div>
      </div>
    </div>
  );
}

function SidebarAgentPanel() {
  const { agents, agentTasks } = useAIAgentStore();
  const { toggleRightPanel, rightPanelOpen } = useIDEStore();
  const runningAgents = agents.filter(a => a.status === 'running');
  const completedTasks = agentTasks.filter(t => t.status === 'completed' || t.status === 'error').slice(0, 5);

  return (
    <div className="p-3 space-y-3">
      {runningAgents.length === 0 && completedTasks.length === 0 ? (
        <div className="text-center py-8">
          <Bot className="w-8 h-8 text-[#6c7086] mx-auto mb-3 animate-[nexus-pulse_2s_ease-in-out_infinite]" />
          <p className="text-sm text-[#cdd6f4] font-medium">AI Agents</p>
          <p className="text-xs text-[#6c7086] mt-1 max-w-[180px] mx-auto">
            Create and manage AI agents for parallel task execution.
          </p>
          <button
            onClick={() => {
              if (!rightPanelOpen) toggleRightPanel();
            }}
            className="mt-3 px-3 py-1.5 bg-[#89b4fa] text-[#1e1e2e] text-xs font-medium rounded-md hover:bg-[#b4d0fb] transition-colors"
          >
            Open AI Panel
          </button>
        </div>
      ) : (
        <>
          {/* Running agents */}
          {runningAgents.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6c7086] mb-2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#89b4fa] animate-pulse" />
                Running ({runningAgents.length})
              </div>
              {runningAgents.map(agent => (
                <div key={agent.id} className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-2.5 mb-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: agent.color + '30', color: agent.color }}>
                      <Bot className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-medium text-[#cdd6f4] flex-1 truncate">{agent.name}</span>
                  </div>
                  <p className="text-[10px] text-[#a6adc8] line-clamp-1">{agent.task}</p>
                  <div className="h-1 bg-[#313244] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 animate-pulse" style={{ width: `${agent.progress || 30}%`, backgroundColor: agent.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent tasks */}
          {completedTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6c7086] mb-2">Recent</div>
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#1e1e2e] transition-colors">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: task.agentDefinition.color + '30', color: task.agentDefinition.color }}>
                    <span className="text-[8px]">{task.agentDefinition.icon}</span>
                  </div>
                  <span className="text-[10px] text-[#a6adc8] truncate flex-1">{task.prompt}</span>
                  <span className={cn(
                    'text-[8px] px-1 py-0.5 rounded',
                    task.status === 'completed' ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]' : 'bg-[#f38ba8]/20 text-[#f38ba8]'
                  )}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
