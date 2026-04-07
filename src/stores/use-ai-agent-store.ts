import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIConversation, AIMessage, AIAgent, AGENT_COLORS } from '@/lib/types';
import { generateId } from '@/lib/types';
import type { AgentTask, AgentDefinition } from '@/lib/ai/agents/agent-types';

const COLORS = ['#89b4fa', '#a6e3a1', '#fab387', '#f9e2af', '#cba6f7', '#94e2d5', '#f38ba8', '#74c7ec'];

interface AIAgentStore {
  conversations: AIConversation[];
  activeConversationId: string | null;
  agents: AIAgent[];
  agentTasks: AgentTask[];
  isStreaming: boolean;
  activeModel: string;
  activeAgentType: string | null;
  streamingTokenCount: number;

  // Conversation actions
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  updateLastAssistantMessage: (conversationId: string, content: string) => void;
  markLastMessageComplete: (conversationId: string, tokens?: { input: number; output: number }) => void;
  clearConversations: () => void;

  // Provider actions
  setActiveModel: (modelId: string) => void;

  // Agent actions
  setActiveAgentType: (type: string | null) => void;
  createAgent: (name: string, model: string, task: string) => string;
  updateAgentStatus: (id: string, status: AIAgent['status'], output?: string, progress?: number) => void;
  removeAgent: (id: string) => void;

  // Streaming
  setStreaming: (streaming: boolean) => void;
  setStreamingTokenCount: (count: number) => void;

  // Agent tasks
  addAgentTask: (task: AgentTask) => void;
  updateAgentTask: (taskId: string, update: Partial<AgentTask>) => void;
  removeAgentTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
}

export const useAIAgentStore = create<AIAgentStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      agents: [],
      agentTasks: [],
      isStreaming: false,
      activeModel: 'nexus-4',
      activeAgentType: null,
      streamingTokenCount: 0,

      createConversation: (title) => {
        const id = generateId();
        const conversation: AIConversation = {
          id,
          title: title || 'New Chat',
          messages: [
            {
              id: generateId(),
              role: 'assistant',
              content: 'Hello! I\'m NexusAI, your intelligent coding assistant. I can help you with code writing, debugging, refactoring, and much more.\n\nYou can also @mention files to include their context, or select a specialized agent from the dropdown above.\n\nHow can I help you today?',
              timestamp: Date.now(),
              model: get().activeModel,
            },
          ],
          model: get().activeModel,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id
              ? state.conversations[0]?.id || null
              : state.activeConversationId,
        }));
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (conversationId, message) => {
        const fullMessage: AIMessage = {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        };
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, fullMessage],
                  updatedAt: Date.now(),
                  title:
                    c.messages.length <= 1 && message.role === 'user'
                      ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                      : c.title,
                }
              : c
          ),
        }));
      },

      updateLastAssistantMessage: (conversationId, content) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const messages = [...c.messages];
            const lastIdx = messages.length - 1;
            if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
              messages[lastIdx] = { ...messages[lastIdx], content, isStreaming: true };
            }
            return { ...c, messages, updatedAt: Date.now() };
          }),
        }));
      },

      markLastMessageComplete: (conversationId, tokens) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const messages = [...c.messages];
            const lastIdx = messages.length - 1;
            if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
              messages[lastIdx] = {
                ...messages[lastIdx],
                isStreaming: false,
                tokens: tokens || messages[lastIdx].tokens,
              };
            }
            return { ...c, messages };
          }),
        }));
      },

      clearConversations: () => set({ conversations: [], activeConversationId: null }),
      setActiveModel: (modelId) => set({ activeModel: modelId }),
      setActiveAgentType: (type) => set({ activeAgentType: type }),

      createAgent: (name, model, task) => {
        const id = generateId();
        const agent: AIAgent = {
          id,
          name,
          model,
          status: 'running',
          description: task,
          progress: 0,
          task,
          startedAt: Date.now(),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
        set((state) => ({ agents: [...state.agents, agent] }));
        return id;
      },

      updateAgentStatus: (id, status, output, progress) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  output: output !== undefined ? output : a.output,
                  progress: progress !== undefined ? progress : a.progress,
                  completedAt: status === 'completed' || status === 'error' ? Date.now() : a.completedAt,
                }
              : a
          ),
        }));
      },

      removeAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        }));
      },

      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setStreamingTokenCount: (count) => set({ streamingTokenCount: count }),

      addAgentTask: (task) => {
        set((state) => ({ agentTasks: [task, ...state.agentTasks] }));
      },

      updateAgentTask: (taskId, update) => {
        set((state) => ({
          agentTasks: state.agentTasks.map((t) =>
            t.id === taskId ? { ...t, ...update } : t
          ),
        }));
      },

      removeAgentTask: (taskId) => {
        set((state) => ({
          agentTasks: state.agentTasks.filter((t) => t.id !== taskId),
        }));
      },

      clearCompletedTasks: () => {
        set((state) => ({
          agentTasks: state.agentTasks.filter((t) => t.status === 'running'),
        }));
      },
    }),
    {
      name: 'nexus-ai-state',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        activeModel: state.activeModel,
        activeAgentType: state.activeAgentType,
      }),
    }
  )
);
