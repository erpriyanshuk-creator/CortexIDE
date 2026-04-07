// Multi-LLM Provider System for NexusIDE
// Supports: OpenAI, Anthropic, Google Gemini, DeepSeek, Ollama, Groq, Mistral, Together AI, OpenRouter

export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'ollama'
  | 'groq'
  | 'mistral'
  | 'together'
  | 'openrouter'
  | 'custom';

export interface ModelCapability {
  vision: boolean;
  functionCalling: boolean;
  streaming: boolean;
  jsonMode: boolean;
}

export interface ModelRegistryEntry {
  id: string;
  name: string;
  provider: ProviderType;
  capabilities: ModelCapability;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  recommendedFor: TaskType[];
}

export type TaskType = 'coding' | 'chat' | 'reasoning' | 'vision' | 'fast' | 'analysis';

export interface ProviderConfig {
  id: string;
  type: ProviderType;
  name: string;
  apiKey?: string;
  baseUrl: string;
  models: ModelRegistryEntry[];
  isConfigured: boolean;
  isHealthy?: boolean;
  lastHealthCheck?: number;
  latencyMs?: number;
}

export interface ProviderHealth {
  providerId: string;
  isHealthy: boolean;
  latencyMs: number;
  error?: string;
  checkedAt: number;
}

export function detectProviderFromApiKey(apiKey: string): ProviderType | null {
  if (!apiKey) return null;
  const key = apiKey.trim().toLowerCase();
  if (key.startsWith('sk-ant-') || key.startsWith('sk-ant-api03-')) return 'anthropic';
  if (key.startsWith('sk-')) {
    if (key.includes('openrouter')) return 'openrouter';
    return 'openai';
  }
  if (key.startsWith('key-') || key.includes('deepseek')) return 'deepseek';
  if (key.startsWith('gemini-') || key.startsWith('ai')) return 'gemini';
  if (key.startsWith('gsk_')) return 'groq';
  if (key.startsWith('mist-') || key.includes('mistral')) return 'mistral';
  return null;
}

export const MODEL_REGISTRY: ModelRegistryEntry[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 128000, maxOutputTokens: 16384, inputCostPer1M: 2.5, outputCostPer1M: 10, recommendedFor: ['coding', 'chat', 'vision', 'analysis'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 128000, maxOutputTokens: 16384, inputCostPer1M: 0.15, outputCostPer1M: 0.6, recommendedFor: ['chat', 'fast', 'analysis'] },
  { id: 'o3-mini', name: 'o3-mini', provider: 'openai', capabilities: { vision: false, functionCalling: true, streaming: true, jsonMode: false }, contextWindow: 200000, maxOutputTokens: 100000, inputCostPer1M: 1.1, outputCostPer1M: 4.4, recommendedFor: ['reasoning', 'coding', 'fast'] },
  { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet', provider: 'anthropic', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: false }, contextWindow: 200000, maxOutputTokens: 64000, inputCostPer1M: 3, outputCostPer1M: 15, recommendedFor: ['coding', 'chat', 'vision', 'analysis', 'reasoning'] },
  { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus', provider: 'anthropic', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: false }, contextWindow: 200000, maxOutputTokens: 32000, inputCostPer1M: 15, outputCostPer1M: 75, recommendedFor: ['coding', 'reasoning', 'analysis'] },
  { id: 'claude-haiku-3-5-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: false }, contextWindow: 200000, maxOutputTokens: 8192, inputCostPer1M: 0.8, outputCostPer1M: 4, recommendedFor: ['chat', 'fast'] },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 1048576, maxOutputTokens: 65536, inputCostPer1M: 1.25, outputCostPer1M: 10, recommendedFor: ['coding', 'reasoning', 'analysis', 'vision'] },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 1048576, maxOutputTokens: 65536, inputCostPer1M: 0.15, outputCostPer1M: 0.6, recommendedFor: ['chat', 'fast', 'coding'] },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'deepseek', capabilities: { vision: false, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 65536, maxOutputTokens: 65536, inputCostPer1M: 0.55, outputCostPer1M: 2.19, recommendedFor: ['reasoning', 'coding'] },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'deepseek', capabilities: { vision: false, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 65536, maxOutputTokens: 65536, inputCostPer1M: 0.27, outputCostPer1M: 1.1, recommendedFor: ['coding', 'chat', 'fast'] },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', capabilities: { vision: false, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 131072, maxOutputTokens: 32768, inputCostPer1M: 0.59, outputCostPer1M: 0.79, recommendedFor: ['chat', 'fast'] },
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 131072, maxOutputTokens: 128000, inputCostPer1M: 2, outputCostPer1M: 6, recommendedFor: ['coding', 'chat', 'reasoning'] },
  { id: 'codestral-latest', name: 'Codestral', provider: 'mistral', capabilities: { vision: false, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 32768, maxOutputTokens: 8192, inputCostPer1M: 0.3, outputCostPer1M: 0.9, recommendedFor: ['coding', 'fast'] },
  { id: 'openrouter:auto', name: 'Auto (Best)', provider: 'openrouter', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 200000, maxOutputTokens: 16384, inputCostPer1M: 3, outputCostPer1M: 15, recommendedFor: ['coding', 'chat', 'reasoning', 'vision'] },
  { id: 'llama3', name: 'Llama 3 (Local)', provider: 'ollama', capabilities: { vision: false, functionCalling: false, streaming: true, jsonMode: false }, contextWindow: 8192, maxOutputTokens: 4096, inputCostPer1M: 0, outputCostPer1M: 0, recommendedFor: ['chat', 'fast'] },
  { id: 'codellama', name: 'Code Llama (Local)', provider: 'ollama', capabilities: { vision: false, functionCalling: false, streaming: true, jsonMode: false }, contextWindow: 16384, maxOutputTokens: 4096, inputCostPer1M: 0, outputCostPer1M: 0, recommendedFor: ['coding'] },
];

export const DEFAULT_PROVIDER_CONFIGS: ProviderConfig[] = [
  { id: 'nexus-ai', type: 'custom', name: 'NexusAI (Built-in)', baseUrl: '', isConfigured: true, models: [{ id: 'nexus-4', name: 'Nexus-4', provider: 'custom', capabilities: { vision: true, functionCalling: true, streaming: true, jsonMode: true }, contextWindow: 128000, maxOutputTokens: 8192, inputCostPer1M: 0, outputCostPer1M: 0, recommendedFor: ['coding', 'chat', 'reasoning', 'analysis'] }] },
  { id: 'openai', type: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', isConfigured: false, models: MODEL_REGISTRY.filter(m => m.provider === 'openai') },
  { id: 'anthropic', type: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com', isConfigured: false, models: MODEL_REGISTRY.filter(m => m.provider === 'anthropic') },
  { id: 'gemini', type: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com', isConfigured: false, models: MODEL_REGISTRY.filter(m => m.provider === 'gemini') },
  { id: 'deepseek', type: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', isConfigured: false, models: MODEL_REGISTRY.filter(m => m.provider === 'deepseek') },
  { id: 'groq', type: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', isConfigured: false, models: MODEL_REGISTRY.filter(m => m.provider === 'groq') },
  { id: 'mistral', type: 'mistral', name: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', isConfigured: false, models: MODEL_REGISTRY.filter(m => m.provider === 'mistral') },
  { id: 'openrouter', type: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', isConfigured: false, models: MODEL_REGISTRY.filter(m => m.provider === 'openrouter') },
  { id: 'ollama', type: 'ollama', name: 'Ollama (Local)', baseUrl: 'http://localhost:11434', isConfigured: false, models: MODEL_REGISTRY.filter(m => m.provider === 'ollama') },
];

export function selectModelForTask(taskType: TaskType, configuredProviders: ProviderConfig[], preferCheap?: boolean): ModelRegistryEntry | null {
  const allModels = configuredProviders.filter(p => p.isConfigured).flatMap(p => p.models);
  const candidates = allModels.filter(m => m.recommendedFor.includes(taskType));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    if (preferCheap) return (a.inputCostPer1M + a.outputCostPer1M) - (b.inputCostPer1M + b.outputCostPer1M);
    return (b.contextWindow * 0.01 + (b.capabilities.vision ? 1000 : 0)) - (a.contextWindow * 0.01 + (a.capabilities.vision ? 1000 : 0));
  });
  return candidates[0];
}

export function getCheapestModel(taskTypes: TaskType[], configuredProviders: ProviderConfig[]): ModelRegistryEntry | null {
  const allModels = configuredProviders.filter(p => p.isConfigured).flatMap(p => p.models);
  const candidates = allModels.filter(m => m.recommendedFor.some(t => taskTypes.includes(t)));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.inputCostPer1M + a.outputCostPer1M) - (b.inputCostPer1M + b.outputCostPer1M));
  return candidates[0];
}

export function calculateCost(model: ModelRegistryEntry, inputTokens: number, outputTokens: number): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function checkProviderHealth(provider: ProviderConfig): Promise<ProviderHealth> {
  if (provider.type === 'ollama') {
    try {
      const start = Date.now();
      const res = await fetch(`${provider.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      return { providerId: provider.id, isHealthy: res.ok, latencyMs: Date.now() - start, checkedAt: Date.now() };
    } catch (error) {
      return { providerId: provider.id, isHealthy: false, latencyMs: 0, error: error instanceof Error ? error.message : 'Unknown error', checkedAt: Date.now() };
    }
  }
  if (!provider.apiKey && provider.type !== 'custom') {
    return { providerId: provider.id, isHealthy: false, latencyMs: 0, error: 'No API key configured', checkedAt: Date.now() };
  }
  try {
    const start = Date.now();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (provider.apiKey) {
      if (provider.type === 'anthropic') {
        headers['x-api-key'] = provider.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
      }
    }
    const res = await fetch(provider.baseUrl, { method: 'HEAD', headers, signal: AbortSignal.timeout(5000) });
    return { providerId: provider.id, isHealthy: res.ok || res.status === 404 || res.status === 405, latencyMs: Date.now() - start, checkedAt: Date.now() };
  } catch (error) {
    return { providerId: provider.id, isHealthy: false, latencyMs: 0, error: error instanceof Error ? error.message : 'Unknown error', checkedAt: Date.now() };
  }
}

export function buildFallbackChain(preferredProviderId: string | null, configuredProviders: ProviderConfig[], taskType: TaskType): ProviderConfig[] {
  const configured = configuredProviders.filter(p => p.isConfigured);
  if (preferredProviderId) {
    const preferred = configured.find(p => p.id === preferredProviderId);
    if (preferred) return [preferred, ...configured.filter(p => p.id !== preferredProviderId)];
  }
  return [...configured].sort((a, b) => {
    const mA = a.models.find(m => m.recommendedFor.includes(taskType));
    const mB = b.models.find(m => m.recommendedFor.includes(taskType));
    if (!mA) return 1;
    if (!mB) return -1;
    return (mA.inputCostPer1M + mA.outputCostPer1M) - (mB.inputCostPer1M + mB.outputCostPer1M);
  });
}

export function getProviderIcon(type: ProviderType): string {
  const icons: Record<ProviderType, string> = { openai: '🤖', anthropic: '🧠', gemini: '💎', deepseek: '🔮', ollama: '🦙', groq: '⚡', mistral: '🌬️', together: '🤝', openrouter: '🛤️', custom: '⚙️' };
  return icons[type];
}

export function getProviderColor(type: ProviderType): string {
  const colors: Record<ProviderType, string> = { openai: '#10a37f', anthropic: '#d97706', gemini: '#4285f4', deepseek: '#6366f1', ollama: '#94e2d5', groq: '#f55036', mistral: '#ff7000', together: '#cba6f7', openrouter: '#8b5cf6', custom: '#89b4fa' };
  return colors[type];
}
