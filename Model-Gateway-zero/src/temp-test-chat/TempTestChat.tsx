import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Plus,
  Send,
  Square,
  Trash2,
  Brain,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { useGateway } from '../gateway';
import type { ChatMessage } from '../gateway/types';
import type { AgentChatSession } from './types';
import './chat.css';

function getCleanModelDisplayName(model?: { id: string; name?: string }): string {
  if (!model) return '';
  let name = (model.name || model.id).trim();
  // Strip [Local GGUF] prefix
  name = name.replace(/^\[Local GGUF\]\s*/i, '');
  // Strip ⚡ Guide tags
  name = name.replace(/\s*⚡\s*Guide(?:\s*\([^)]*\))?/gi, '');
  // Strip trailing (F16), (Q4_K_M), (FP16), etc.
  name = name.replace(/\s*\((?:Q[0-9]_[A-Za-z0-9_]+|F16|F32|BF16|FP16|FP32|TYPE_\d+)\)/gi, '');
  // Strip any embedded raw (model.id)
  name = name.replace(/\s*\([^)]*\/[^)]*\)/g, '');
  if (model.id) {
    const escaped = model.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    name = name.replace(new RegExp('\\s*\\(' + escaped + '\\)', 'gi'), '');
  }
  return name.trim() || model.id;
}

export const TempTestChat: React.FC = () => {
  const { availableModels, dispatchChat } = useGateway();

  // Multi-Agent Chat Sessions
  const [sessions, setSessions] = useState<AgentChatSession[]>(() => {
    const defaultModel = availableModels[0]?.model.id || 'mock-gpt-4o';
    const secondModel = availableModels[1]?.model.id || defaultModel;

    return [
      {
        id: 'agent-1',
        name: 'Agent 1 (Primary)',
        modelId: defaultModel,
        messages: [
          {
            id: 'init-1',
            role: 'assistant',
            content: 'Hello! I am Agent 1. Select any model from the dropdown above to test routing through the Modular Gateway.',
            timestamp: Date.now(),
          },
        ],
        isGenerating: false,
        createdAt: Date.now(),
      },
      {
        id: 'agent-2',
        name: 'Agent 2 (Reasoning)',
        modelId: secondModel,
        messages: [
          {
            id: 'init-2',
            role: 'assistant',
            content: 'Hello! I am Agent 2 running independently. You can select a different model and chat concurrently with Agent 1.',
            timestamp: Date.now(),
          },
        ],
        isGenerating: false,
        createdAt: Date.now() + 1,
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>('agent-1');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const [openReasoningMap, setOpenReasoningMap] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active session object
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Active model config & capabilities
  const currentModelWithProvider = availableModels.find(
    (m) => m.model.id === currentSession?.modelId
  );
  const currentCapabilities = currentModelWithProvider?.model.capabilities || {
    reasoning: false,
    image: false,
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Listen for model selection events from Gateway / Setup Pipeline
  useEffect(() => {
    const handleSelectModel = (e: any) => {
      const targetModelId = e.detail?.modelId;
      if (targetModelId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId ? { ...s, modelId: targetModelId } : s
          )
        );
      }
    };
    window.addEventListener('gateway:select-model', handleSelectModel);
    return () => window.removeEventListener('gateway:select-model', handleSelectModel);
  }, [activeSessionId]);

  // Automatically fallback to a valid model if an active session's model was deleted
  useEffect(() => {
    if (availableModels.length > 0) {
      setSessions((prev) =>
        prev.map((s) => {
          const exists = availableModels.some((m) => m.model.id === s.modelId);
          if (!exists) {
            return { ...s, modelId: availableModels[0].model.id };
          }
          return s;
        })
      );
    }
  }, [availableModels]);

  // Create a new Agent session
  const handleCreateAgent = () => {
    const nextNum = sessions.length + 1;
    const modelToUse = availableModels[(nextNum - 1) % (availableModels.length || 1)]?.model.id || 'mock-gpt-4o';

    const newAgent: AgentChatSession = {
      id: `agent-${Date.now()}`,
      name: `Agent ${nextNum}`,
      modelId: modelToUse,
      messages: [
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Agent ${nextNum} initialized. Ready to execute requests using model "${modelToUse}".`,
          timestamp: Date.now(),
        },
      ],
      isGenerating: false,
      createdAt: Date.now(),
    };

    setSessions((prev) => [...prev, newAgent]);
    setActiveSessionId(newAgent.id);
  };

  // Switch Model for the current active agent
  const handleModelChange = (newModelId: string) => {
    const matched = availableModels.find((m) => m.model.id === newModelId);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              modelId: newModelId,
              reasoningEnabled: matched?.model.capabilities.reasoning ?? true,
            }
          : s
      )
    );
  };

  // Toggle Reasoning mode ON / OFF for active session
  const handleToggleReasoning = () => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSessionId) return s;
        const currentVal = s.reasoningEnabled ?? currentCapabilities.reasoning ?? true;
        return { ...s, reasoningEnabled: !currentVal };
      })
    );
  };

  // Delete Agent session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert('At least one agent chat session must remain active.');
      return;
    }

    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setActiveSessionId(remaining[0]?.id || '');
    }
  };

  // Clear current agent chat history
  const handleClearHistory = () => {
    if (confirm(`Clear conversation history for ${currentSession.name}?`)) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, messages: [] } : s
        )
      );
    }
  };

  // Handle Image attachment
  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImageBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (currentSession?.abortController) {
      currentSession.abortController.abort();
    }
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, isGenerating: false, abortController: null }
          : s
      )
    );
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() && !attachedImageBase64) return;
    if (currentSession.isGenerating) return;

    const userMessageContent = attachedImageBase64
      ? [
          { type: 'text' as const, text: inputPrompt.trim() || 'Describe this image:' },
          { type: 'image_url' as const, image_url: { url: attachedImageBase64 } },
        ]
      : inputPrompt.trim();

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      images: attachedImageBase64 ? [attachedImageBase64] : undefined,
      timestamp: Date.now(),
    };

    const assistantMsgId = `asst-${Date.now() + 1}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      modelId: currentSession.modelId,
      timestamp: Date.now() + 1,
      status: 'streaming',
    };

    const updatedMessages = [...currentSession.messages, userMessage];

    // Reset input
    setInputPrompt('');
    setAttachedImageBase64(null);

    const abortController = new AbortController();

    // Update state with user message and empty streaming assistant bubble
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...updatedMessages, initialAssistantMsg],
              isGenerating: true,
              abortController,
            }
          : s
      )
    );

    // Auto open reasoning if model supports it
    if (currentCapabilities.reasoning) {
      setOpenReasoningMap((prev) => ({ ...prev, [assistantMsgId]: true }));
    }

    try {
      const isReasoningActive = currentSession.reasoningEnabled ?? currentCapabilities.reasoning ?? true;
      await dispatchChat({
        modelId: currentSession.modelId,
        messages: updatedMessages,
        stream: true,
        reasoningEnabled: isReasoningActive,
        signal: abortController.signal,
        onChunk: (contentChunk, reasoningChunk) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== activeSessionId) return s;
              const msgs = [...s.messages];
              const targetIdx = msgs.findIndex((m) => m.id === assistantMsgId);
              if (targetIdx >= 0) {
                const target = msgs[targetIdx];
                msgs[targetIdx] = {
                  ...target,
                  content: (typeof target.content === 'string' ? target.content : '') + contentChunk,
                  reasoning: (target.reasoning || '') + reasoningChunk,
                };
              }
              return { ...s, messages: msgs };
            })
          );
        },
      });

      // Mark done
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const msgs = s.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, status: 'done' as const } : m
          );
          return { ...s, messages: msgs, isGenerating: false, abortController: null };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'Request aborted') {
        // aborted cleanly
      } else {
        const errorMsg = err.message || 'Error occurred while contacting provider gateway.';
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const msgs = s.messages.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: m.content || `[Error: ${errorMsg}]`,
                    status: 'error' as const,
                    error: errorMsg,
                  }
                : m
            );
            return { ...s, messages: msgs, isGenerating: false, abortController: null };
          })
        );
      }
    } finally {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, isGenerating: false, abortController: null } : s
        )
      );
    }
  };

  const toggleReasoningCollapse = (msgId: string) => {
    setOpenReasoningMap((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const renderMessageText = (content: any): string => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter((part: any) => part.type === 'text' || typeof part === 'string')
        .map((part: any) => (typeof part === 'string' ? part : part.text || ''))
        .filter(Boolean)
        .join('\n');
    }
    return String(content || '');
  };

  return (
    <div className="chat-sandbox-root">
      {/* Sandbox Safe-to-Delete Warning Header */}
      <div className="chat-sandbox-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={14} />
          <span>
            <strong>TEMPORARY SANDBOX TESTING CHAT</strong> (/src/temp-test-chat): Deleting this folder will NOT affect the core Gateway.
          </span>
        </div>
        <span style={{ fontSize: '11px', opacity: 0.8 }}>
          Multi-Agent Sandbox Active
        </span>
      </div>

      <div className="chat-main-layout">
        {/* Left Sidebar: Concurrent Agent Sessions */}
        <div className="chat-agent-sidebar">
          <div className="chat-sidebar-header">
            <span className="chat-sidebar-title">
              <Bot size={15} color="#60a5fa" />
              <span>Agents ({sessions.length})</span>
            </span>
            <button
              type="button"
              className="chat-new-agent-btn"
              onClick={handleCreateAgent}
              title="Add a new concurrent testing agent"
            >
              <Plus size={13} />
              <span>New Agent</span>
            </button>
          </div>

          <div className="chat-agent-list">
            {sessions.map((sess) => {
              const modelMatch = availableModels.find((m) => m.model.id === sess.modelId);
              const cleanModelName = modelMatch ? getCleanModelDisplayName(modelMatch.model) : sess.modelId;

              return (
                <div
                  key={sess.id}
                  className={`chat-agent-tab ${sess.id === activeSessionId ? 'active' : ''}`}
                  onClick={() => setActiveSessionId(sess.id)}
                >
                  <div className="chat-agent-tab-info">
                    <span className="chat-agent-tab-name">{sess.name}</span>
                    <span className="chat-agent-tab-model">{cleanModelName}</span>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      className="chat-agent-tab-delete"
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      title="Remove agent session"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Active Agent Chat */}
        <div className="chat-pane">
          {/* Topbar: Model Selection & Capabilities */}
          <div className="chat-pane-header">
            <div className="chat-pane-header-left">
              <div className="chat-model-selector-wrap">
                <span className="chat-model-selector-label">Model:</span>
                <select
                  className="chat-model-dropdown"
                  value={currentSession?.modelId}
                  onChange={(e) => handleModelChange(e.target.value)}
                  disabled={currentSession?.isGenerating}
                >
                  {availableModels.length === 0 ? (
                    <option value="">No models available in Gateway</option>
                  ) : (
                    availableModels.map(({ model, provider }) => {
                      const isLocal = provider.id === 'local-gguf-engine' || model.isLocal || provider.apiType === 'local-gguf';
                      const cleanName = getCleanModelDisplayName(model);
                      const providerTag = isLocal ? '— [offline]' : `— [${provider.id}]`;
                      return (
                        <option key={`${provider.id}-${model.id}`} value={model.id}>
                          {cleanName} {providerTag}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {/* Clickable Reasoning Toggle & Capabilities Badges */}
              <div className="chat-capabilities-pill-wrap">
                <button
                  type="button"
                  onClick={handleToggleReasoning}
                  className={`chat-reasoning-toggle-pill ${(currentSession?.reasoningEnabled ?? currentCapabilities.reasoning ?? true) ? 'active' : 'inactive'}`}
                  title={(currentSession?.reasoningEnabled ?? currentCapabilities.reasoning ?? true) ? 'Reasoning is ON: click to turn OFF (skip <think> and reply in 1-2s)' : 'Reasoning is OFF: click to turn ON (enable deep thinking monologue)'}
                >
                  <Brain size={12} />
                  <span>Reasoning: {(currentSession?.reasoningEnabled ?? currentCapabilities.reasoning ?? true) ? 'ON' : 'OFF'}</span>
                </button>
                {currentCapabilities.image && (
                  <span className="chat-cap-pill image">
                    <ImageIcon size={12} />
                    <span>Vision Ready</span>
                  </span>
                )}
              </div>
            </div>

            {/* Actions: Clear History */}
            <button
              type="button"
              className="chat-icon-action-btn"
              onClick={handleClearHistory}
              title="Clear conversation history"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="chat-messages-container">
            {(!currentSession || currentSession.messages.length === 0) ? (
              <div className="chat-empty-state">
                <Bot size={36} color="#3b82f6" style={{ opacity: 0.6 }} />
                <p>No messages yet in this session.</p>
                <span style={{ fontSize: '12px' }}>Type a message below to test model routing.</span>
              </div>
            ) : (
              currentSession.messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                const hasReasoning = Boolean(msg.reasoning && msg.reasoning.trim().length > 0);
                const isReasoningOpen = openReasoningMap[msg.id];

                return (
                  <div key={msg.id} className={`chat-msg-row ${msg.role}`}>
                    <div className="chat-msg-bubble">
                      {isAssistant && msg.modelId && (
                        <div className="chat-msg-model-tag">
                          <Sparkles size={11} />
                          <span>
                            {getCleanModelDisplayName(availableModels.find((m) => m.model.id === msg.modelId)?.model) || msg.modelId}
                          </span>
                        </div>
                      )}

                      {/* Reasoning Collapse */}
                      {hasReasoning && (
                        <div className="chat-reasoning-wrap">
                          <button
                            type="button"
                            className="chat-reasoning-toggle"
                            onClick={() => toggleReasoningCollapse(msg.id)}
                          >
                            <Brain size={12} />
                            <span>Thinking Process</span>
                            <span style={{ fontSize: '10px' }}>{isReasoningOpen ? '▲' : '▼'}</span>
                          </button>
                          {isReasoningOpen && (
                            <div className="chat-reasoning-content">{msg.reasoning}</div>
                          )}
                        </div>
                      )}

                      {/* Attached images */}
                      {msg.images && msg.images.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {msg.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Attachment"
                              style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid #334155' }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="chat-msg-text">
                        {renderMessageText(msg.content)}
                      </div>

                      {msg.error && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
                          {msg.error}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <form className="chat-input-wrap" onSubmit={handleSendMessage}>
            {attachedImageBase64 && (
              <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#0a0f1d', borderBottom: '1px solid #1e293b' }}>
                <img
                  src={attachedImageBase64}
                  alt="Preview"
                  style={{ height: '40px', borderRadius: '4px', border: '1px solid #334155' }}
                />
                <button
                  type="button"
                  onClick={() => setAttachedImageBase64(null)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕ Remove
                </button>
              </div>
            )}

            <div className="chat-input-row">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageAttach}
              />
              <button
                type="button"
                className="chat-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Image"
              >
                <ImageIcon size={16} />
              </button>

              <textarea
                className="chat-textarea"
                placeholder={
                  currentSession?.isGenerating
                    ? 'Model is streaming response...'
                    : `Message ${currentSession.name} (${currentSession.modelId})... (Press Enter to send, Shift+Enter for new line)`
                }
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={currentSession?.isGenerating}
                rows={1}
              />

              <div className="chat-input-actions">
                {currentSession?.isGenerating ? (
                  <button
                    type="button"
                    className="chat-stop-btn"
                    onClick={handleStopGeneration}
                    title="Stop streaming response"
                  >
                    <Square size={13} fill="currentColor" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!inputPrompt.trim() && !attachedImageBase64}
                    title="Send message"
                  >
                    <Send size={14} />
                    <span>Send</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};