// Agent Tool Registry and Tool Definitions for NexusIDE

import type { ToolDefinition } from './agent-types';

export const AGENT_TOOLS: Record<string, ToolDefinition> = {
  read_file: {
    name: 'read_file',
    description: 'Read the contents of a file from the project',
    parameters: [
      { name: 'path', type: 'string', description: 'File path relative to project root', required: true },
    ],
    execute: async (args) => {
      const path = args.path as string;
      // In the IDE, file contents are stored in the editor store (client-side)
      // This tool definition is for the backend agent execution
      return `[File read tool: ${path}] - File content would be provided from the IDE context`;
    },
  },
  write_file: {
    name: 'write_file',
    description: 'Write content to a file, creating it if it doesn\'t exist',
    parameters: [
      { name: 'path', type: 'string', description: 'File path relative to project root', required: true },
      { name: 'content', type: 'string', description: 'Content to write to the file', required: true },
    ],
    execute: async (args) => {
      const path = args.path as string;
      const content = args.content as string;
      return `[File written: ${path}] (${content.length} chars)`;
    },
  },
  edit_file: {
    name: 'edit_file',
    description: 'Edit a specific section of a file using search/replace',
    parameters: [
      { name: 'path', type: 'string', description: 'File path', required: true },
      { name: 'search', type: 'string', description: 'Text to find in the file', required: true },
      { name: 'replace', type: 'string', description: 'Text to replace it with', required: true },
    ],
    execute: async (args) => {
      return `[File edited: ${args.path}] - Replaced matching content`;
    },
  },
  search_files: {
    name: 'search_files',
    description: 'Search for text patterns across files in the project',
    parameters: [
      { name: 'pattern', type: 'string', description: 'Search pattern or regex', required: true },
      { name: 'filePattern', type: 'string', description: 'Optional file glob pattern to filter', required: false },
    ],
    execute: async (args) => {
      return `[Search: "${args.pattern}" in ${args.filePattern || 'all files'}]`;
    },
  },
  list_directory: {
    name: 'list_directory',
    description: 'List files and directories in a given path',
    parameters: [
      { name: 'path', type: 'string', description: 'Directory path to list', required: false },
    ],
    execute: async (args) => {
      return `[Directory listing: ${args.path || '/'}]`;
    },
  },
  get_project_structure: {
    name: 'get_project_structure',
    description: 'Get the overall project structure and file tree',
    parameters: [],
    execute: async () => {
      return '[Project structure]';
    },
  },
  run_command: {
    name: 'run_command',
    description: 'Execute a shell command in the project environment',
    parameters: [
      { name: 'command', type: 'string', description: 'Shell command to execute', required: true },
      { name: 'cwd', type: 'string', description: 'Working directory for the command', required: false },
    ],
    execute: async (args) => {
      return `[Command executed: ${args.command}]`;
    },
  },
};

export function getToolDefinitionsForAgent(toolNames: string[]): ToolDefinition[] {
  return toolNames.map(name => AGENT_TOOLS[name]).filter(Boolean);
}

export function formatToolsForPrompt(tools: ToolDefinition[]): string {
  return tools.map(tool => {
    const params = tool.parameters.map(p => {
      const req = p.required ? ' (required)' : ' (optional)';
      return `  - ${p.name}: ${p.type}${req} - ${p.description}`;
    }).join('\n');
    return `### ${tool.name}\n${tool.description}\nParameters:\n${params}`;
  }).join('\n\n');
}
