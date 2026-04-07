// Core IDE type definitions

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  path: string;
  language?: string;
  isExpanded?: boolean;
}

export interface OpenTab {
  fileId: string;
  path: string;
  name: string;
  isDirty: boolean;
  language: string;
}

export interface TerminalSession {
  id: string;
  name: string;
  history: string[];
  cwd: string;
  isActive: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  tokens?: {
    input: number;
    output: number;
  };
  isStreaming?: boolean;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface AIAgent {
  id: string;
  name: string;
  model: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  description: string;
  progress?: number;
  task?: string;
  startedAt?: number;
  completedAt?: number;
  output?: string;
  color: string;
}

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'ollama' | 'custom';
  models: AIModel[];
  isConfigured: boolean;
  apiKey?: string;
  baseUrl?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  maxTokens: number;
  contextWindow: number;
}

export interface CostEntry {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  timestamp: number;
}

export interface IDESettings {
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  bracketPairColorization: boolean;
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle: 'line' | 'block' | 'underline';
  smoothScrolling: boolean;
}

export interface PanelSizes {
  sidebarWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
}

export type MobileView = 'files' | 'editor' | 'ai' | 'terminal' | 'settings';
export type SidebarView = 'files' | 'search' | 'git' | 'extensions' | 'agents';
export type BottomPanelView = 'terminal' | 'output' | 'problems' | 'ai-activity';

export const DEFAULT_SETTINGS: IDESettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  tabSize: 2,
  wordWrap: 'off',
  minimap: true,
  lineNumbers: 'on',
  autoSave: true,
  autoSaveDelay: 1000,
  formatOnSave: true,
  bracketPairColorization: true,
  cursorBlinking: 'smooth',
  cursorStyle: 'line',
  smoothScrolling: true,
};

export const DEFAULT_PANEL_SIZES: PanelSizes = {
  sidebarWidth: 260,
  rightPanelWidth: 320,
  bottomPanelHeight: 250,
};

export const AGENT_COLORS = [
  '#89b4fa', // Blue
  '#a6e3a1', // Green
  '#fab387', // Peach
  '#f9e2af', // Yellow
  '#cba6f7', // Mauve
  '#94e2d5', // Teal
  '#f38ba8', // Red
  '#74c7ec', // Sapphire
];

export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'html',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    svg: 'xml',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    dockerfile: 'dockerfile',
    toml: 'ini',
    ini: 'ini',
    env: 'plaintext',
    txt: 'plaintext',
    graphql: 'graphql',
    prisma: 'prisma',
    vue: 'html',
    svelte: 'html',
  };
  return langMap[ext] || 'plaintext';
}

export function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    ts: '🟦',
    tsx: '⚛️',
    js: '🟨',
    jsx: '⚛️',
    json: '📋',
    css: '🎨',
    scss: '🎨',
    html: '🌐',
    md: '📝',
    py: '🐍',
    rs: '🦀',
    go: '🐹',
    java: '☕',
    gitignore: '🚫',
    env: '🔒',
    yml: '⚙️',
    yaml: '⚙️',
    svg: '🖼️',
    png: '🖼️',
    jpg: '🖼️',
    lock: '🔐',
    prisma: '💎',
  };
  if (name === 'package.json') return '📦';
  if (name === 'next.config.ts' || name === 'next.config.js') return '▲';
  if (name === 'tsconfig.json') return '🔧';
  if (name === '.gitignore') return '🚫';
  if (name === 'README.md') return '📖';
  return iconMap[ext] || '📄';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
