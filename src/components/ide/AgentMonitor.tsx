'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  X,
  Play,
  Square,
  Trash2,
  Zap,
  Copy,
  Check,
  Users,
} from 'lucide-react';
import { useAIAgentStore } from '@/stores/use-ai-agent-store';
import { cn } from '@/lib/utils';
import { BUILT_IN_AGENTS, getAgentsForTask } from '@/lib/ai/agents/built-in-agents';
import type { AgentTask } from '@/lib/ai/agents/agent-types';

export function AgentMonitor() {
  const {
    agents,
    agentTasks,
    removeAgent,
    clearCompletedTasks,
    isStreaming,
  } = useAIAgentStore();

  const [taskInput, setTaskInput] = useState('');
  const [selectedAgentTypes, setSelectedAgentTypes] = useState<string[]>([]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const runningTasks = agentTasks.filter(t => t.status === 'running');
  const completedTasks = agentTasks.filter(t => t.status === 'completed' || t.status === 'error');

  // Auto-select agents based on task description
  const handleTaskInputChange = useCallback((value: string) => {
    setTaskInput(value);
    if (value.length > 10) {
      const suggested = getAgentsForTask(value).map(a => a.id);
      setSelectedAgentTypes(suggested);
    }
  }, []);

  const toggleAgentType = useCallback((type: string) => {
    setSelectedAgentTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const handleRunAgents = useCallback(async () => {
    if (!taskInput.trim() || selectedAgentTypes.length === 0 || isStreaming) return;

    const { addAgentTask, updateAgentTask, setActiveAgentType } = useAIAgentStore.getState();
    setActiveAgentType(null);

    try {
      const response = await fetch('/api/ai/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedAgentTypes.length > 1 ? 'run-parallel' : 'run',
          agentType: selectedAgentTypes[0],
          prompt: taskInput,
          model: useAIAgentStore.getState().activeModel,
          context: '',
          parallel: selectedAgentTypes.length > 1,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Failed to start agents');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          try {
            const chunk = JSON.parse(trimmed.slice(6));
            if (chunk.type === 'progress' && chunk.taskId) {
              updateAgentTask(chunk.taskId, { progress: chunk.progress });
            }
            if (chunk.type === 'agent_result' && chunk.task) {
              const agentDef = BUILT_IN_AGENTS.find(a => a.name === chunk.task.agentName);
              addAgentTask({
                id: chunk.task.id,
                agentDefinition: agentDef || BUILT_IN_AGENTS[1],
                prompt: taskInput,
                status: chunk.task.status,
                progress: 100,
                startedAt: Date.now() - 5000,
                completedAt: Date.now(),
                output: chunk.task.output,
                error: chunk.task.error,
                model: useAIAgentStore.getState().activeModel,
                messages: [],
                toolCalls: [],
                tokenUsage: chunk.task.tokenUsage || { input: 0, output: 0 },
                cost: 0,
              });
            }
            if (chunk.type === 'result' && chunk.task) {
              const agentDef = BUILT_IN_AGENTS.find(a => a.name === chunk.task.agentName);
              addAgentTask({
                id: chunk.task.id,
                agentDefinition: agentDef || BUILT_IN_AGENTS[1],
                prompt: taskInput,
                status: chunk.task.status,
                progress: 100,
                startedAt: Date.now() - 5000,
                completedAt: Date.now(),
                output: chunk.task.output,
                error: chunk.task.error,
                model: useAIAgentStore.getState().activeModel,
                messages: [],
                toolCalls: [],
                tokenUsage: chunk.task.tokenUsage || { input: 0, output: 0 },
                cost: 0,
              });
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch {
      // Error handling
    }

    setTaskInput('');
  }, [taskInput, selectedAgentTypes, isStreaming]);

  const handleCopyOutput = useCallback((output: string, id: string) => {
    navigator.clipboard.writeText(output);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const noActivity = agents.length === 0 && agentTasks.length === 0;

  return (
    <div className="h-full flex flex-col">
      {/* Task input */}
      <div className="p-3 border-b border-[#313244] space-y-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#89b4fa]" />
          <span className="text-xs font-medium text-[#cdd6f4]">Multi-Agent System</span>
          {runningTasks.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#89b4fa]/20 text-[#89b4fa] rounded-full">{runningTasks.length} running</span>
          )}
        </div>

        <textarea
          value={taskInput}
          onChange={(e) => handleTaskInputChange(e.target.value)}
          placeholder="Describe a task for agents... (auto-selects appropriate agents)"
          rows={2}
          className="w-full bg-[#1e1e2e] border border-[#313244] rounded-lg px-2.5 py-2 text-xs text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] resize-none transition-colors"
        />

        {/* Selected agents */}
        {selectedAgentTypes.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {selectedAgentTypes.map(type => {
              const agent = BUILT_IN_AGENTS.find(a => a.id === type);
              if (!agent) return null;
              return (
                <button
                  key={type}
                  onClick={() => toggleAgentType(type)}
                  className="text-[10px] px-1.5 py-0.5 rounded-full border transition-colors flex items-center gap-0.5"
                  style={{ borderColor: agent.color + '60', color: agent.color, backgroundColor: agent.color + '15' }}
                >
                  <span>{agent.icon}</span>
                  {agent.name}
                  <X className="w-2 h-2" />
                </button>
              );
            })}
            <button onClick={() => setShowAgentPicker(!showAgentPicker)} className="text-[10px] px-1.5 py-0.5 bg-[#313244] rounded-full text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
              + Add
            </button>
          </div>
        )}

        {showAgentPicker && (
          <div className="grid grid-cols-2 gap-1">
            {BUILT_IN_AGENTS.filter(a => !selectedAgentTypes.includes(a.id)).map(agent => (
              <button
                key={agent.id}
                onClick={() => { toggleAgentType(agent.id); setShowAgentPicker(false); }}
                className="text-[10px] px-2 py-1.5 rounded border border-[#313244] text-[#a6adc8] hover:text-[#cdd6f4] hover:border-[#89b4fa] transition-colors flex items-center gap-1"
              >
                <span>{agent.icon}</span>
                <span className="truncate">{agent.name}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleRunAgents}
          disabled={!taskInput.trim() || selectedAgentTypes.length === 0 || isStreaming}
          className={cn(
            'w-full py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5',
            taskInput.trim() && selectedAgentTypes.length > 0 && !isStreaming
              ? 'bg-[#89b4fa] text-[#1e1e2e] hover:bg-[#b4d0fb]'
              : 'bg-[#313244] text-[#6c7086] cursor-not-allowed'
          )}
        >
          {isStreaming ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Running {runningTasks.length} agent{runningTasks.length !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Run {selectedAgentTypes.length} Agent{selectedAgentTypes.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {noActivity && !isStreaming && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-8 h-8 text-[#6c7086] mx-auto mb-2" />
              <p className="text-sm text-[#6c7086]">No agent activity</p>
              <p className="text-xs text-[#45475a] mt-1">Describe a task above to run agents in parallel</p>
            </div>
          </div>
        )}

        {/* Running tasks */}
        {agentTasks.filter(t => t.status === 'running').map(task => (
          <AgentTaskCard key={task.id} task={task} copiedId={copiedId} onCopy={handleCopyOutput} />
        ))}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6c7086] uppercase tracking-wider">Completed</span>
              <button onClick={clearCompletedTasks} className="text-[10px] text-[#6c7086] hover:text-[#f38ba8] transition-colors">Clear</button>
            </div>
            {completedTasks.slice(0, 10).map(task => (
              <AgentTaskCard key={task.id} task={task} copiedId={copiedId} onCopy={handleCopyOutput} />
            ))}
          </>
        )}

        {/* Legacy agents */}
        {agents.filter(a => a.status === 'running').map(agent => (
          <div key={agent.id} className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: agent.color + '30', color: agent.color }}>
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium text-[#cdd6f4]">{agent.name}</span>
              </div>
              <button onClick={() => removeAgent(agent.id)} className="p-0.5 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#f38ba8] transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-[#a6adc8] line-clamp-2">{agent.task}</p>
            <div className="h-1.5 bg-[#313244] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500 animate-pulse" style={{ width: `${agent.progress || 30}%`, backgroundColor: agent.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentTaskCard({ task, copiedId, onCopy }: { task: AgentTask; copiedId: string | null; onCopy: (output: string, id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const agent = task.agentDefinition;

  return (
    <div
      className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 space-y-2"
      onClick={() => task.output && setExpanded(!expanded)}
      role="button"
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: agent.color + '30', color: agent.color }}>
            <span>{agent.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#cdd6f4]">{agent.name}</span>
              {task.status === 'running' && <Loader2 className="w-3 h-3 text-[#89b4fa] animate-spin" />}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-[#6c7086]">{agent.type}</span>
              {agent.isReadOnly && <span className="text-[9px] px-1 py-0.5 bg-[#313244] rounded text-[#6c7086]">read-only</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AgentStatusBadge status={task.status} />
        </div>
      </div>

      {/* Progress bar */}
      {task.status === 'running' && (
        <div className="h-1.5 bg-[#313244] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${task.progress}%`, backgroundColor: agent.color }} />
        </div>
      )}

      {/* Task description */}
      <p className="text-[11px] text-[#a6adc8] line-clamp-2">{task.prompt}</p>

      {/* Expanded output */}
      {expanded && task.output && (
        <div className="text-[11px] text-[#a6adc8] bg-[#181825] rounded p-2.5 max-h-40 overflow-y-auto font-mono whitespace-pre-wrap border border-[#313244]">
          {task.output.slice(0, 2000)}
          {task.output.length > 2000 && '... [truncated]'}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[9px] text-[#6c7086]">
          <span>{task.progress}%</span>
          <span>·</span>
          <span>{task.tokenUsage.input + task.tokenUsage.output} tok</span>
          <span>·</span>
          <Clock className="w-2.5 h-2.5" />
          <span>{Math.floor((Date.now() - task.startedAt) / 1000)}s</span>
        </div>
        {task.output && (
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(task.output!, task.id); }}
            className="p-0.5 rounded text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
            title="Copy output"
          >
            {copiedId === task.id ? <Check className="w-3 h-3 text-[#a6e3a1]" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

function AgentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'running':
      return <span className="flex items-center gap-1 text-[10px] text-[#89b4fa]"><Loader2 className="w-3 h-3 animate-spin" /> Running</span>;
    case 'completed':
      return <span className="flex items-center gap-1 text-[10px] text-[#a6e3a1]"><CheckCircle2 className="w-3 h-3" /> Done</span>;
    case 'error':
      return <span className="flex items-center gap-1 text-[10px] text-[#f38ba8]"><XCircle className="w-3 h-3" /> Error</span>;
    default:
      return <span className="flex items-center gap-1 text-[10px] text-[#6c7086]"><Clock className="w-3 h-3" /> {status}</span>;
  }
}
