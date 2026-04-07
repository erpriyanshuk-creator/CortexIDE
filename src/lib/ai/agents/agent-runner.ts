// Agent Runner - Core agent execution engine for NexusIDE

import type { AgentDefinition, AgentTask, AgentProgressCallback } from './agent-types';
import { BUILT_IN_AGENTS } from './built-in-agents';
import { formatToolsForPrompt, getToolDefinitionsForAgent } from './tool-registry';

let idCounter = 0;
function generateId(): string {
  return `task-${Date.now()}-${++idCounter}`;
}

export async function runAgent(
  agentDef: AgentDefinition,
  prompt: string,
  model: string,
  context: string,
  onProgress?: AgentProgressCallback,
): Promise<AgentTask> {
  const taskId = generateId();
  const tools = getToolDefinitionsForAgent(agentDef.tools);
  const toolPrompt = formatToolsForPrompt(tools);

  const task: AgentTask = {
    id: taskId,
    agentDefinition: agentDef,
    prompt,
    status: 'running',
    progress: 0,
    startedAt: Date.now(),
    model,
    messages: [
      { id: generateId(), role: 'system', content: agentDef.systemPrompt + '\n\n' + toolPrompt, timestamp: Date.now() },
    ],
    toolCalls: [],
    tokenUsage: { input: 0, output: 0 },
    cost: 0,
  };

  onProgress?.(taskId, 10, 'Initializing agent...');

  try {
    // Build user message with context
    const userMessage = context
      ? `<context>\n${context}\n</context>\n\n${prompt}`
      : prompt;

    task.messages.push({ id: generateId(), role: 'user', content: userMessage, timestamp: Date.now() });
    onProgress?.(taskId, 20, 'Processing request...');

    // Execute via z-ai-web-dev-sdk
    const ZAI = await import('z-ai-web-dev-sdk');
    const sdk = new ZAI.default();

    onProgress?.(taskId, 40, 'Generating response...');

    const response = await sdk.chat({
      messages: task.messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      model,
      stream: false,
    });

    onProgress?.(taskId, 80, 'Processing response...');

    let output = '';
    if (typeof response === 'string') {
      output = response;
    } else if (response && typeof response === 'object') {
      // Try to extract text content from the response
      if ('choices' in response) {
        const choices = (response as { choices: Array<{ message?: { content?: string } }> }).choices;
        output = choices?.[0]?.message?.content || JSON.stringify(response);
      } else if ('content' in response) {
        output = (response as { content?: string }).content || JSON.stringify(response);
      } else {
        output = JSON.stringify(response);
      }
    }

    task.messages.push({ id: generateId(), role: 'assistant', content: output, timestamp: Date.now() });
    task.output = output;
    task.tokenUsage.input = Math.ceil(prompt.length / 4);
    task.tokenUsage.output = Math.ceil(output.length / 4);

    onProgress?.(taskId, 100, 'Task completed');
    task.status = 'completed';
    task.progress = 100;
    task.completedAt = Date.now();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    task.status = 'error';
    task.error = err.message;
    onProgress?.(taskId, task.progress, `Error: ${err.message}`);
    task.completedAt = Date.now();
  }

  return task;
}

export function createParallelAgentTasks(
  taskDescription: string,
  agentTypes?: string[],
): AgentDefinition[] {
  if (agentTypes) {
    return agentTypes
      .map(type => BUILT_IN_AGENTS.find(a => a.id === type))
      .filter((a): a is AgentDefinition => a !== undefined);
  }

  // Auto-select agents based on task description
  const lower = taskDescription.toLowerCase();

  if (lower.includes('and') || lower.includes('also') || lower.includes('while')) {
    // Multi-faceted task - use explorer + coder
    return [BUILT_IN_AGENTS[0], BUILT_IN_AGENTS[1]]; // explorer + coder
  }

  if (lower.includes('review') || lower.includes('check')) {
    return [BUILT_IN_AGENTS[2], BUILT_IN_AGENTS[5]]; // reviewer + summarizer
  }

  if (lower.includes('fix') || lower.includes('debug') || lower.includes('bug')) {
    return [BUILT_IN_AGENTS[3], BUILT_IN_AGENTS[0]]; // debugger + explorer
  }

  // Default: just coder
  return [BUILT_IN_AGENTS[1]];
}

export async function runParallelAgents(
  taskDescription: string,
  model: string,
  context: string,
  onProgress?: AgentProgressCallback,
): Promise<AgentTask[]> {
  const agents = createParallelAgentTasks(taskDescription);

  const results = await Promise.allSettled(
    agents.map(async (agent, index) => {
      const agentTask = taskDescription;
      const agentPrompt = `[As ${agent.name}]: ${agentTask}`;
      const taskId = `${agent.id}-${Date.now()}`;

      onProgress?.(taskId, 0, `Starting ${agent.name}...`);

      try {
        const result = await runAgent(agent, agentPrompt, model, context, (id, progress, msg) => {
          onProgress?.(id, Math.round(progress / agents.length), msg ? `[${agent.name}] ${msg}` : undefined);
        });
        return result;
      } catch (error) {
        return {
          id: taskId,
          agentDefinition: agent,
          prompt: agentPrompt,
          status: 'error' as const,
          progress: 0,
          startedAt: Date.now(),
          completedAt: Date.now(),
          model,
          messages: [],
          toolCalls: [],
          tokenUsage: { input: 0, output: 0 },
          cost: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<AgentTask> => r.status === 'fulfilled')
    .map(r => r.value);
}
