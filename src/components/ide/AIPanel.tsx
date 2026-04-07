'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Sparkles,
  Copy,
  RotateCcw,
  PanelRightClose,
  ChevronDown,
  Loader2,
  Mic,
  MicOff,
  StopCircle,
  FileText,
  Check,
  ChevronRight,
  Zap,
  MessageSquare,
  ArrowDownToLine,
  Download,
  Upload,
} from 'lucide-react';
import { useAIAgentStore } from '@/stores/use-ai-agent-store';
import { useIDEStore } from '@/stores/use-ide-store';
import { useEditorStore } from '@/stores/use-editor-store';
import { useCostTrackerStore } from '@/stores/use-cost-tracker-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BUILT_IN_AGENTS } from '@/lib/ai/agents/built-in-agents';
import { parseMentions, stripMentions } from '@/lib/ai/context';
import { DEFAULT_PROVIDER_CONFIGS } from '@/lib/ai/providers';
import { Separator } from '@/components/ui/separator';

// All available models from configured providers
const ALL_MODELS = DEFAULT_PROVIDER_CONFIGS
  .filter(p => p.isConfigured || p.type === 'custom')
  .flatMap(p => p.models.map(m => ({ id: m.id, name: m.name, provider: p.name, providerType: p.type })));

export function AIPanel() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    addMessage,
    isStreaming,
    setStreaming,
    updateLastAssistantMessage,
    markLastMessageComplete,
    activeModel,
    activeAgentType,
    setActiveModel,
    setActiveAgentType,
    streamingTokenCount,
    setStreamingTokenCount,
  } = useAIAgentStore();

  const { toggleRightPanel, isMobile } = useIDEStore();
  const { openTabs, activeTabId, getFileContent } = useEditorStore();
  const { addEntry } = useCostTrackerStore();

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showAgentSelect, setShowAgentSelect] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Create first conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation('Welcome Chat');
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages, autoScroll]);

  const handleCopyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyToEditor = useCallback((code: string) => {
    const { updateFileContent } = useEditorStore.getState();
    const { openTabs, activeTabId } = useEditorStore.getState();
    const activeTab = openTabs.find((t) => t.fileId === activeTabId);
    if (activeTab) {
      const currentContent = getFileContent(activeTab.path);
      updateFileContent(activeTab.path, currentContent + '\n' + code);
    }
  }, [getFileContent]);

  // Voice input
  const toggleVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    const recognition = new (SpeechRecognition as new () => { start: () => void; stop: () => void; onresult: (e: { results: { transcript: string }[][] }) => void; onend: () => void; onerror: () => void })();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + transcript);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  // Insert file context with @-mention
  const insertFileContext = useCallback(() => {
    const activeTab = openTabs.find((t) => t.fileId === activeTabId);
    if (activeTab) {
      const mention = `@${activeTab.path}`;
      setInput((prev) => (prev ? prev + ' ' + mention : mention));
    }
  }, [openTabs, activeTabId]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || !activeConversationId) return;

    const userMessage = input.trim();
    setInput('');
    setAutoScroll(true);

    const mentions = parseMentions(userMessage);
    const cleanMessage = stripMentions(userMessage);

    // Gather file context for mentions
    const files: Array<{ path: string; content: string; language: string }> = [];
    for (const mention of mentions) {
      const tab = openTabs.find(t => t.path.includes(mention) || t.name.includes(mention));
      if (tab) {
        files.push({ path: tab.path, content: getFileContent(tab.path), language: tab.language });
      }
    }

    // Add user message
    addMessage(activeConversationId, {
      role: 'user',
      content: userMessage,
      model: activeModel,
    });

    // Add placeholder assistant message
    addMessage(activeConversationId, {
      role: 'assistant',
      content: '',
      model: activeModel,
      isStreaming: true,
    });

    setStreaming(true);
    let accumulatedContent = '';
    let inputTokens = 0;

    try {
      const messagesForApi = [
        { role: 'system', content: 'You are NexusAI, an intelligent coding assistant inside NexusIDE. Help users with coding tasks, debugging, explanations, and more. Use markdown formatting with code blocks when showing code.' },
        // Include file context
        ...files.map(f => ({ role: 'user' as const, content: `[Context: ${f.path}]\n\`\`\`${f.language}\n${f.content}\n\`\`\`` })),
        { role: 'user' as const, content: cleanMessage || userMessage },
      ];

      abortRef.current = new AbortController();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForApi,
          model: activeModel,
          context: { files, projectStructure: '' },
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) throw new Error('Failed to get response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          try {
            const chunk = JSON.parse(trimmed.slice(6));
            if (chunk.type === 'token' && chunk.content) {
              accumulatedContent += chunk.content;
              setStreamingTokenCount(Math.ceil(accumulatedContent.length / 4));
              updateLastAssistantMessage(activeConversationId, accumulatedContent);
            }
            if (chunk.type === 'done' && chunk.data) {
              inputTokens = chunk.data.inputTokens || Math.ceil(cleanMessage.length / 4);
            }
          } catch {
            // Non-JSON SSE data
            if (trimmed.length > 6) {
              accumulatedContent += trimmed.slice(6).replace(/^data:\s*/, '');
              updateLastAssistantMessage(activeConversationId, accumulatedContent);
            }
          }
        }
      }

      const outputTokens = Math.ceil(accumulatedContent.length / 4);
      markLastMessageComplete(activeConversationId, { input: inputTokens, output: outputTokens });

      // Track cost
      addEntry({
        model: activeModel,
        provider: 'nexus-ai',
        inputTokens,
        outputTokens,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        updateLastAssistantMessage(activeConversationId, accumulatedContent || 'Response cancelled.');
      } else {
        updateLastAssistantMessage(activeConversationId, accumulatedContent || 'Sorry, I encountered an error. Please try again.');
      }
      markLastMessageComplete(activeConversationId);
    } finally {
      setStreaming(false);
      setStreamingTokenCount(0);
      abortRef.current = null;
    }
  }, [input, isStreaming, activeConversationId, addMessage, setStreaming, updateLastAssistantMessage, markLastMessageComplete, activeModel, openTabs, activeTabId, getFileContent, addEntry, setStreamingTokenCount]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Export conversation
  const exportConversation = useCallback(() => {
    if (!activeConversation) return;
    const data = JSON.stringify(activeConversation, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-chat-${activeConversation.title}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeConversation]);

  const lastAssistantMsg = activeConversation?.messages.filter(m => m.role === 'assistant').pop();

  return (
    <div className="h-full flex flex-col bg-[#181825]">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-[#313244] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#89b4fa]" />
          <span className="text-sm font-medium text-[#cdd6f4]">NexusAI</span>
          <div className="flex items-center gap-1">
            {/* Agent selector */}
            <button
              onClick={() => setShowAgentSelect(!showAgentSelect)}
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5',
                activeAgentType ? 'bg-[#cba6f7] text-[#1e1e2e]' : 'bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4]'
              )}
              title="Select Agent"
            >
              <Bot className="w-2.5 h-2.5" />
              {activeAgentType ? BUILT_IN_AGENTS.find(a => a.id === activeAgentType)?.name || 'Agent' : 'Agent'}
            </button>

            {/* Model selector */}
            <button
              onClick={() => setShowModelSelect(!showModelSelect)}
              className="text-[10px] px-1.5 py-0.5 bg-[#313244] rounded text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              title="Select Model"
            >
              <Zap className="w-2.5 h-2.5 inline mr-0.5" />
              {ALL_MODELS.find(m => m.id === activeModel)?.name || activeModel}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {isStreaming && streamingTokenCount > 0 && (
            <span className="text-[10px] text-[#a6adc8] mr-1 font-mono">{streamingTokenCount} tok</span>
          )}
          <button onClick={() => createConversation()} className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="New Chat">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowHistory(!showHistory)} className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="History">
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button onClick={exportConversation} className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="Export">
            <Download className="w-3.5 h-3.5" />
          </button>
          {!isMobile && (
            <button onClick={toggleRightPanel} className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="Close Panel">
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdowns */}
      {showAgentSelect && (
        <div className="absolute top-10 right-2 z-50 w-56 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl p-1.5">
          <button onClick={() => { setActiveAgentType(null); setShowAgentSelect(false); }} className={cn('w-full text-left px-2 py-1.5 rounded text-xs transition-colors', !activeAgentType ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]')}>
            No Agent (Direct Chat)
          </button>
          <Separator className="my-1 bg-[#313244]" />
          {BUILT_IN_AGENTS.map(agent => (
            <button key={agent.id} onClick={() => { setActiveAgentType(agent.id); setShowAgentSelect(false); }} className={cn('w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2', activeAgentType === agent.id ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]')}>
              <span>{agent.icon}</span>
              <div>
                <div className="font-medium">{agent.name}</div>
                <div className="text-[10px] opacity-70">{agent.description.slice(0, 40)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showModelSelect && (
        <div className="absolute top-10 right-16 z-50 w-64 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl p-1.5 max-h-60 overflow-y-auto">
          {ALL_MODELS.map(model => (
            <button key={model.id} onClick={() => { setActiveModel(model.id); setShowModelSelect(false); }} className={cn('w-full text-left px-2 py-1.5 rounded text-xs transition-colors', activeModel === model.id ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'text-[#cdd6f4] hover:bg-[#313244]')}>
              <div className="font-medium">{model.name}</div>
              <div className="text-[10px] opacity-60">{model.provider}</div>
            </button>
          ))}
        </div>
      )}

      {/* Conversation History sidebar */}
      {showHistory && (
        <div className="absolute top-10 left-2 z-50 w-52 bg-[#1e1e2e] border border-[#313244] rounded-lg shadow-xl p-1.5 max-h-60 overflow-y-auto">
          {conversations.map(c => (
            <button key={c.id} onClick={() => { useAIAgentStore.getState().setActiveConversation(c.id); setShowHistory(false); }} className={cn('w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between group', c.id === activeConversationId ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#a6adc8] hover:bg-[#313244]')}>
              <span className="truncate flex-1">{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#f38ba8] hover:text-[#1e1e2e] transition-all">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 relative" onScroll={(e) => {
        const el = e.currentTarget;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        setAutoScroll(isNearBottom);
      }}>
        {activeConversation?.messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', msg.role === 'user' ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'bg-gradient-to-br from-[#89b4fa] to-[#cba6f7] text-[#1e1e2e]')}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={cn('max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed min-w-0', msg.role === 'user' ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'bg-[#1e1e2e] text-[#cdd6f4] border border-[#313244]')}>
              <div className="prose prose-invert prose-sm max-w-none break-words [&_pre]:bg-[#11111b] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_code]:text-xs [&_code]:font-mono [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_li]:my-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#89b4fa] [&_blockquote]:pl-3 [&_blockquote]:text-[#a6adc8] [&_a]:text-[#89b4fa] [&_strong]:text-[#cdd6f4]">
                {msg.content ? (
                  msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match && !className;
                          if (isInline) {
                            return <code className="bg-[#313244] px-1 py-0.5 rounded text-xs" {...props}>{children}</code>;
                          }
                          const codeString = String(children).replace(/\n$/, '');
                          const codeId = msg.id + '-' + codeString.slice(0, 20);
                          return (
                            <div className="relative group my-2">
                              <div className="flex items-center justify-between bg-[#11111b] px-3 py-1 rounded-t-lg border-b border-[#313244]">
                                <span className="text-[10px] text-[#6c7086]">{match ? match[1] : 'code'}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleCopyCode(codeString, codeId)} className="p-0.5 rounded text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="Copy">
                                    {copiedId === codeId ? <Check className="w-3 h-3 text-[#a6e3a1]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                  <button onClick={() => handleCopyToEditor(codeString)} className="p-0.5 rounded text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="Insert in editor">
                                    <ArrowDownToLine className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <SyntaxHighlighter style={oneDark} language={match ? match[1] : 'text'} PreTag="div" customStyle={{ margin: 0, borderRadius: '0 0 8px 8px', fontSize: '12px', background: '#11111b' }}>
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )
                ) : (
                  msg.isStreaming ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[#6c7086]">Thinking...</span>
                    </span>
                  ) : null
                )}
              </div>
              {/* Message actions & token count */}
              {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#313244]">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleCopyCode(msg.content, msg.id)} className="p-0.5 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="Copy">
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-[#a6e3a1]" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button onClick={() => handleSend()} className="p-0.5 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="Regenerate">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                  {msg.tokens && (msg.tokens.input > 0 || msg.tokens.output > 0) && (
                    <span className="text-[9px] text-[#6c7086] font-mono">{msg.tokens.input + msg.tokens.output} tokens</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        {!autoScroll && lastAssistantMsg?.content && (
          <button onClick={() => { setAutoScroll(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="sticky bottom-2 left-1/2 -translate-x-1/2 z-10 bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] p-1.5 rounded-full shadow-lg transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#313244]">
        {activeAgentType && (
          <div className="flex items-center gap-1.5 mb-2 px-1">
            {(() => {
              const agent = BUILT_IN_AGENTS.find(a => a.id === activeAgentType);
              if (!agent) return null;
              return (
                <>
                  <span className="text-sm">{agent.icon}</span>
                  <span className="text-xs text-[#cdd6f4] font-medium">{agent.name}</span>
                  <span className="text-[10px] text-[#6c7086]">{agent.description}</span>
                  <button onClick={() => setActiveAgentType(null)} className="ml-auto text-[#6c7086] hover:text-[#f38ba8]"><span className="text-xs">&times;</span></button>
                </>
              );
            })()}
          </div>
        )}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={activeAgentType ? `Ask ${BUILT_IN_AGENTS.find(a => a.id === activeAgentType)?.name} anything...` : 'Ask NexusAI anything... (@ to mention files)'}
            rows={3}
            className="w-full bg-[#1e1e2e] border border-[#313244] rounded-xl px-3 py-2 pr-20 text-sm text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa] resize-none transition-colors"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button onClick={insertFileContext} className="p-1 rounded text-[#6c7086] hover:text-[#89b4fa] transition-colors" title="@Mention file">
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleVoiceInput} className={cn('p-1 rounded transition-colors', isRecording ? 'text-[#f38ba8] animate-pulse' : 'text-[#6c7086] hover:text-[#89b4fa]')} title="Voice input">
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            {isStreaming ? (
              <button onClick={handleStop} className="p-1.5 rounded-lg bg-[#f38ba8] text-[#1e1e2e] hover:bg-[#eba0ac] transition-all" title="Stop">
                <StopCircle className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim()} className={cn('p-1.5 rounded-lg transition-all', input.trim() ? 'bg-[#89b4fa] text-[#1e1e2e] hover:bg-[#b4d0fb]' : 'text-[#6c7086] cursor-not-allowed')}>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
