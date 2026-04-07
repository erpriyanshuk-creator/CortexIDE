// Agent Pool Manager - Parallel agent execution with resource management

import type { AgentTask, AgentPoolConfig, AgentPoolResult } from './agent-types';
import type { AgentProgressCallback } from './agent-types';
import { runParallelAgents, runAgent } from './agent-runner';
import type { AgentDefinition } from './agent-types';

const DEFAULT_POOL_CONFIG: AgentPoolConfig = {
  maxConcurrent: 3,
  timeout: 120000,
  enableFallback: true,
  enableCostOptimization: true,
};

// Simple in-memory pool for tracking active agents
const activeTasks = new Map<string, AgentTask>();

export function getActiveTasks(): AgentTask[] {
  return Array.from(activeTasks.values());
}

export function getTask(taskId: string): AgentTask | undefined {
  return activeTasks.get(taskId);
}

export function removeTask(taskId: string): boolean {
  return activeTasks.delete(taskId);
}

export async function executeAgentTask(
  agentDef: AgentDefinition,
  prompt: string,
  model: string,
  context: string,
  config: Partial<AgentPoolConfig> = {},
  onProgress?: AgentProgressCallback,
): Promise<AgentTask> {
  const poolConfig = { ...DEFAULT_POOL_CONFIG, ...config };

  // Check concurrency limit
  const runningTasks = Array.from(activeTasks.values()).filter(t => t.status === 'running');
  if (runningTasks.length >= poolConfig.maxConcurrent) {
    throw new Error(`Maximum concurrent agents (${poolConfig.maxConcurrent}) reached. Wait for running agents to complete.`);
  }

  const task = await runAgent(agentDef, prompt, model, context, onProgress);
  activeTasks.set(task.id, task);

  // Auto-cleanup after 5 minutes
  setTimeout(() => {
    if (task.status === 'completed' || task.status === 'error') {
      activeTasks.delete(task.id);
    }
  }, 300000);

  return task;
}

export async function executeParallelTasks(
  taskDescription: string,
  model: string,
  context: string,
  config: Partial<AgentPoolConfig> = {},
  onProgress?: AgentProgressCallback,
): Promise<AgentPoolResult> {
  const startTime = Date.now();
  const tasks = await runParallelAgents(taskDescription, model, context, onProgress);

  // Store all tasks
  for (const task of tasks) {
    activeTasks.set(task.id, task);
  }

  const totalTokens = tasks.reduce(
    (acc, t) => ({
      input: acc.input + t.tokenUsage.input,
      output: acc.output + t.tokenUsage.output,
    }),
    { input: 0, output: 0 },
  );

  const totalCost = tasks.reduce((acc, t) => acc + t.cost, 0);

  return {
    tasks,
    totalTokens,
    totalCost,
    duration: Date.now() - startTime,
  };
}

export function getPoolStatus() {
  const tasks = Array.from(activeTasks.values());
  return {
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    error: tasks.filter(t => t.status === 'error').length,
    tasks: tasks.map(t => ({
      id: t.id,
      agentName: t.agentDefinition.name,
      status: t.status,
      progress: t.progress,
      startedAt: t.startedAt,
      completedAt: t.completedAt,
    })),
  };
}
