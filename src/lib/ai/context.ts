// Smart Context System for NexusIDE
// Automatically gathers relevant file context for AI interactions

import { estimateTokens } from './providers';

export interface FileContext {
  path: string;
  content: string;
  language: string;
  tokens: number;
}

export interface ContextResult {
  systemContext: string;
  fileContexts: FileContext[];
  totalTokens: number;
  truncated: boolean;
}

export interface ContextOptions {
  maxTokens: number;
  includeOpenFiles: boolean;
  includeProjectStructure: boolean;
  priorityFiles: string[];
  excludePatterns: string[];
}

const DEFAULT_OPTIONS: ContextOptions = {
  maxTokens: 100000,
  includeOpenFiles: true,
  includeProjectStructure: true,
  priorityFiles: [],
  excludePatterns: ['node_modules', '.next', 'dist', 'build', '.git', 'bun.lock', 'package-lock.json'],
};

// Build context for AI from @-mentioned files and open files
export function buildContext(
  openFiles: Array<{ path: string; content: string; language: string }>,
  mentionedPaths: string[],
  projectStructure: string,
  options: Partial<ContextOptions> = {},
): ContextResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const fileContexts: FileContext[] = [];
  let totalTokens = 0;

  // Priority: mentioned files first
  const mentionedContents = openFiles.filter(f => mentionedPaths.includes(f.path));
  for (const file of mentionedContents) {
    const tokens = estimateTokens(file.content);
    if (totalTokens + tokens <= opts.maxTokens) {
      fileContexts.push({ ...file, tokens });
      totalTokens += tokens;
    }
  }

  // Then open files (excluding already-mentioned)
  if (opts.includeOpenFiles) {
    const mentionedSet = new Set(mentionedPaths);
    const remainingOpen = openFiles.filter(f => !mentionedSet.has(f.path));
    for (const file of remainingOpen) {
      const tokens = estimateTokens(file.content);
      if (totalTokens + tokens <= opts.maxTokens) {
        fileContexts.push({ ...file, tokens });
        totalTokens += tokens;
      }
    }
  }

  // Priority files
  for (const path of opts.priorityFiles) {
    if (fileContexts.some(f => f.path === path)) continue;
    const file = openFiles.find(f => f.path === path);
    if (file) {
      const tokens = estimateTokens(file.content);
      if (totalTokens + tokens <= opts.maxTokens) {
        fileContexts.push({ ...file, tokens });
        totalTokens += tokens;
      }
    }
  }

  // Build system context
  const parts: string[] = [];

  if (opts.includeProjectStructure && projectStructure) {
    parts.push(`<project_structure>\n${projectStructure}\n</project_structure>`);
  }

  for (const ctx of fileContexts) {
    // Truncate very large files
    let content = ctx.content;
    const maxFileTokens = 20000;
    if (ctx.tokens > maxFileTokens) {
      const charLimit = maxFileTokens * 4;
      content = content.slice(0, charLimit) + '\n\n... [file truncated due to size]';
    }
    parts.push(`<file path="${ctx.path}">\n${content}\n</file>`);
  }

  const systemContext = parts.join('\n\n');
  const structTokens = estimateTokens(projectStructure || '');
  const finalTotalTokens = totalTokens + structTokens;

  return {
    systemContext,
    fileContexts,
    totalTokens: finalTotalTokens,
    truncated: false,
  };
}

// Parse @-mentions from user input
export function parseMentions(input: string): string[] {
  const regex = /@(\S+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = regex.exec(input)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)];
}

// Strip @-mentions from input for clean message
export function stripMentions(input: string): string {
  return input.replace(/@\S+/g, '').replace(/\s{2,}/g, ' ').trim();
}

// Format context for inclusion in chat messages
export function formatContextForChat(contexts: FileContext[]): string {
  if (contexts.length === 0) return '';
  const parts = contexts.map(ctx => {
    const langTag = ctx.language ? `\`\`\`${ctx.language}\n` : '```\n';
    return `File: ${ctx.path}\n${langTag}${ctx.content.slice(0, 8000)}${ctx.content.length > 8000 ? '\n... [truncated]' : ''}\n\`\`\``;
  });
  return parts.join('\n\n');
}
