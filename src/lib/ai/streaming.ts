// Streaming response handler for NexusIDE AI system

export interface StreamOptions {
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onToolCall?: (toolCall: { id: string; name: string; arguments: string }) => void;
  onComplete?: (usage: { inputTokens: number; outputTokens: number }) => void;
  onError?: (error: Error) => void;
}

export interface StreamChunk {
  type: 'token' | 'tool_call' | 'usage' | 'error' | 'done';
  content: string;
  data?: unknown;
}

export class StreamingHandler {
  private abortController: AbortController;
  private tokenCount = 0;
  private startTime = 0;

  constructor() {
    this.abortController = new AbortController();
  }

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  abort(): void {
    this.abortController.abort();
  }

  reset(): void {
    this.abortController = new AbortController();
    this.tokenCount = 0;
    this.startTime = Date.now();
  }

  // Create an SSE stream from z-ai-web-dev-sdk response
  static async createSSEStream(
    messages: Array<{ role: string; content: string }>,
    model: string,
    options: StreamOptions = {},
  ): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          const ZAI = await import('z-ai-web-dev-sdk');
          const sdk = new ZAI.default();

          const response = await sdk.chat({
            messages: messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
            model,
            stream: true,
          });

          let inputTokens = 0;
          let outputTokens = 0;

          if (response && typeof response === 'object' && 'body' in response) {
            const reader = (response as unknown as Response).body?.getReader();
            if (!reader) {
              controller.close();
              return;
            }

            const decoder = new TextDecoder();
            let buffer = '';

            try {
              while (true) {
                if (options.signal?.aborted) break;
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed === 'data: [DONE]') continue;
                  if (trimmed.startsWith('data: ')) {
                    try {
                      const chunk = JSON.parse(trimmed.slice(6));
                      const content = chunk.choices?.[0]?.delta?.content || '';
                      if (content) {
                        options.onToken?.(content);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`));
                      }
                      if (chunk.usage) {
                        inputTokens = chunk.usage.prompt_tokens || 0;
                        outputTokens = chunk.usage.completion_tokens || 0;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'usage', content: '', data: chunk.usage })}\n\n`));
                      }
                    } catch {
                      // non-JSON line, pass through
                      if (trimmed.length > 6) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content: trimmed.slice(6) })}\n\n`));
                      }
                    }
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }
          } else {
            // Non-streaming response
            const text = typeof response === 'string' ? response : JSON.stringify(response);
            options.onToken?.(text);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content: text })}\n\n`));
            outputTokens = Math.ceil(text.length / 4);
          }

          // Send completion
          options.onComplete?.({ inputTokens, outputTokens });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: '', data: { inputTokens, outputTokens } })}\n\n`));
          controller.close();
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: '', data: { inputTokens: 0, outputTokens: 0, aborted: true } })}\n\n`));
            controller.close();
            return;
          }
          const err = error instanceof Error ? error : new Error(String(error));
          options.onError?.(err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`));
          controller.close();
        }
      },
    });
  }

  // Retry with exponential backoff
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
    signal?: AbortSignal,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (signal?.aborted) throw new Error('Aborted');

      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, Math.min(delay, 30000)));
        }
      }
    }

    throw lastError;
  }

  // Token counting in real-time
  static createTokenCounter(onCount: (count: number) => void) {
    let count = 0;
    return {
      add(text: string) {
        count += Math.ceil(text.length / 4);
        onCount(count);
      },
      reset() {
        count = 0;
        onCount(0);
      },
      get count() { return count; },
    };
  }
}
