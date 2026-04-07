// Multi-Agent System Types for NexusIDE

export type AgentStatus = 'idle' | 'running' | 'waiting' | 'completed' | 'error' | 'cancelled';

export type AgentTaskType = 'explore' | 'code' | 'review' | 'debug' | 'plan' | 'summarize' | 'custom';

export interface AgentDefinition {
  id: string;
  name: string;
  type: AgentTaskType;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
  preferredModels: string[]; // model IDs
  preferredTaskTypes: string[]; // coding, chat, reasoning, fast, etc.
  maxTurns: number;
  tools: string[]; // tool names this agent has access to
  canRunInBackground: boolean;
  isReadOnly: boolean; // explore, review, plan are read-only
}

export interface AgentTask {
  id: string;
  agentDefinition: AgentDefinition;
  prompt: string;
  status: AgentStatus;
  progress: number;
  startedAt: number;
  completedAt?: number;
  output?: string;
  error?: string;
  model: string;
  messages: AgentMessage[];
  toolCalls: AgentToolCall[];
  tokenUsage: { input: number; output: number };
  cost: number;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: string;
  result?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp: number;
}

export interface AgentPoolConfig {
  maxConcurrent: number;
  timeout: number; // ms
  enableFallback: boolean;
  enableCostOptimization: boolean;
}

export interface AgentPoolResult {
  tasks: AgentTask[];
  totalTokens: { input: number; output: number };
  totalCost: number;
  duration: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (args: Record<string, unknown>) => Promise<string>;
}

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
}

// Agent execution progress callback
export type AgentProgressCallback = (taskId: string, progress: number, message?: string) => void;
