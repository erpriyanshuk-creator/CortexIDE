import { NextRequest, NextResponse } from 'next/server';
import { StreamingHandler } from '@/lib/ai/streaming';
import { DEFAULT_PROVIDER_CONFIGS } from '@/lib/ai/providers';
import { buildContext, parseMentions, stripMentions } from '@/lib/ai/context';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model, provider, context: contextData } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();

    // Check if user wants to use agents
    const lastMessage = messages[messages.length - 1];
    const userContent = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
    const mentions = parseMentions(userContent);
    const cleanContent = stripMentions(userContent);

    // Build context from provided file data
    const contextFiles = (contextData?.files || []).map((f: { path: string; content: string; language: string }) => f);
    const projectStructure = contextData?.projectStructure || '';
    const contextResult = buildContext(contextFiles, mentions, projectStructure);

    // Prepare messages with context
    const messagesWithContext = [...messages];
    if (contextResult.systemContext) {
      messagesWithContext[0] = {
        ...messagesWithContext[0],
        content: (messagesWithContext[0]?.content || '') + '\n\n' + contextResult.systemContext,
      };
    }
    // Replace last message with cleaned content (no @-mentions)
    if (cleanContent && messagesWithContext.length > 0) {
      messagesWithContext[messagesWithContext.length - 1] = {
        ...messagesWithContext[messagesWithContext.length - 1],
        content: cleanContent,
      };
    }

    const resolvedModel = model || 'nexus-4';

    const stream = await StreamingHandler.createSSEStream(
      messagesWithContext,
      resolvedModel,
      {
        onToken: (token) => {
          // Token counting happens in streaming handler
        },
        onComplete: (usage) => {
          // Log usage
          console.log(`[AI Chat] Model: ${resolvedModel}, Tokens: ${usage.inputTokens}+${usage.outputTokens}`);
        },
        onError: (error) => {
          console.error('[AI Chat Error]', error.message);
        },
      },
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Model': resolvedModel,
        'X-Context-Tokens': String(contextResult.totalTokens),
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}

// GET - return available providers info
export async function GET() {
  return NextResponse.json({
    providers: DEFAULT_PROVIDER_CONFIGS.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      isConfigured: p.isConfigured,
      models: p.models.map(m => ({
        id: m.id,
        name: m.name,
        capabilities: m.capabilities,
        contextWindow: m.contextWindow,
        inputCostPer1M: m.inputCostPer1M,
        outputCostPer1M: m.outputCostPer1M,
      })),
    })),
  });
}
