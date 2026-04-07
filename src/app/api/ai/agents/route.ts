import { NextRequest, NextResponse } from 'next/server';
import { BUILT_IN_AGENTS } from '@/lib/ai/agents/built-in-agents';
import { executeAgentTask, executeParallelTasks, getPoolStatus } from '@/lib/ai/agents/agent-pool';
import type { AgentProgressCallback } from '@/lib/ai/agents/agent-types';
import { StreamingHandler } from '@/lib/ai/streaming';

export async function GET() {
  return NextResponse.json({
    agents: BUILT_IN_AGENTS.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      description: a.description,
      icon: a.icon,
      color: a.color,
      preferredModels: a.preferredModels,
      isReadOnly: a.isReadOnly,
      canRunInBackground: a.canRunInBackground,
    })),
    poolStatus: getPoolStatus(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agentType, prompt, model, context, parallel } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const resolvedModel = model || 'nexus-4';
    const resolvedContext = context || '';

    // Create SSE stream for progress updates
    const encoder = new TextEncoder();

    if (action === 'run-parallel' || parallel) {
      // Parallel agent execution
      const stream = new ReadableStream({
        async start(controller) {
          const progressCb: AgentProgressCallback = (taskId, progress, message) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', taskId, progress, message })}\n\n`));
          };

          try {
            const result = await executeParallelTasks(prompt, resolvedModel, resolvedContext, {}, progressCb);

            // Send individual results
            for (const task of result.tasks) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'agent_result', task: { id: task.id, agentName: task.agentDefinition.name, status: task.status, output: task.output, error: task.error, tokenUsage: task.tokenUsage } })}\n\n`));
            }

            // Send summary
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', summary: { totalTasks: result.tasks.length, totalTokens: result.totalTokens, totalCost: result.totalCost, duration: result.duration } })}\n\n`));
            controller.close();
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    }

    // Single agent execution
    const agentTypeToFind = agentType || 'coder';
    const agentDef = BUILT_IN_AGENTS.find(a => a.id === agentTypeToFind || a.type === agentTypeToFind);

    if (!agentDef) {
      return NextResponse.json({ error: `Agent type '${agentType}' not found. Available: ${BUILT_IN_AGENTS.map(a => a.id).join(', ')}` }, { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const progressCb: AgentProgressCallback = (taskId, progress, message) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', taskId, progress, message })}\n\n`));
        };

        try {
          const task = await executeAgentTask(agentDef, prompt, resolvedModel, resolvedContext, {}, progressCb);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'result', task: { id: task.id, agentName: task.agentDefinition.name, status: task.status, output: task.output, error: task.error, tokenUsage: task.tokenUsage, cost: task.cost } })}\n\n`));
          controller.close();
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error) {
    console.error('Agent API Error:', error);
    return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 });
  }
}
