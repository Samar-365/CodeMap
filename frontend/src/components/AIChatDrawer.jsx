import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FileCode, 
  RotateCcw, 
  Loader2, 
  ExternalLink,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import api from '../services/api';

export function AIChatDrawer({
  isOpen,
  onClose,
  repoId,
  repoSummary,
  selectedNode,
  onSelectNodeById
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your **CodeMap AI Assistant**. Ask me anything about this repository's architecture, data flows, APIs, or specific files!`,
      references: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeContextNode, setActiveContextNode] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedNode) {
      setActiveContextNode(selectedNode);
    }
  }, [selectedNode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || loading || !repoId) return;

    const userMsg = {
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await api.askAI({
        repo_id: repoId,
        question: q,
        selected_node_id: activeContextNode ? activeContextNode.id : undefined,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.answer,
        references: res.references || [],
        model_used: res.model_used,
        latency_ms: res.latency_ms,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    } catch (err) {
      const errAnswer = err.response?.data?.detail || err.message || 'Failed to get explanation from AI.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error**: ${errAnswer}`,
          references: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Chat cleared. Ask me anything about **${repoSummary?.repo_name || 'the codebase'}**!`,
        references: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="flat-panel-elevated" style={{
      position: 'fixed',
      top: '56px',
      right: '12px',
      bottom: '12px',
      width: '450px',
      maxWidth: 'calc(100vw - 24px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 35,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={14} color="var(--color-model)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>CodeMap AI</span>
              <span className="flat-badge badge-model" style={{ fontSize: '9px', padding: '1px 5px' }}>
                Local RAG
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Context-Grounded Explainer
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn-icon" onClick={clearChat} title="Clear conversation" style={{ padding: '4px' }}>
            <RotateCcw size={13} />
          </button>
          <button className="btn-icon" onClick={onClose} style={{ padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
      </div>


      {/* Active Node Context Banner */}
      {activeContextNode && (
        <div style={{
          padding: '8px 16px',
          background: 'rgba(6, 182, 212, 0.08)',
          borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <FileCode size={14} color="var(--cyan)" />
            <span style={{ color: 'var(--text-secondary)' }}>Focus:</span>
            <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {activeContextNode.label}
            </span>
          </div>
          <button 
            onClick={() => setActiveContextNode(null)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
          >
            Clear Focus
          </button>
        </div>
      )}

      {/* Message History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                flexDirection: isUser ? 'row-reverse' : 'row',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: isUser ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                border: isUser ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isUser ? <User size={14} color="#60a5fa" /> : <Bot size={14} color="#c084fc" />}
              </div>

              {/* Message Bubble */}
              <div style={{
                maxWidth: '82%',
                background: isUser ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: isUser ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '13px',
                lineHeight: 1.5,
                color: '#fff',
              }}>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                </div>

                {/* References Badges (if any) */}
                {msg.references && msg.references.length > 0 && (
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Grounded References:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {msg.references.map((ref, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => onSelectNodeById(ref.relative_path)}
                          className="glass-pill"
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--cyan)',
                            cursor: 'pointer'
                          }}
                          title={`Click to inspect ${ref.relative_path}`}
                        >
                          <span>{ref.relative_path.split('/').pop()}:L{ref.line_start}-{ref.line_end}</span>
                          <ChevronRight size={10} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Model & Timestamp footer */}
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                  marginTop: '6px',
                  textAlign: isUser ? 'right' : 'left',
                  display: 'flex',
                  gap: '8px',
                  justifyContent: isUser ? 'flex-end' : 'flex-start'
                }}>
                  <span>{msg.timestamp}</span>
                  {msg.model_used && <span>• {msg.model_used} ({msg.latency_ms}ms)</span>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Loader2 size={14} color="#c084fc" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div className="glass-pill" style={{ fontSize: '12px', padding: '6px 12px' }}>
              <span>Synthesizing codebase architecture & citations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.15)',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {[
          'How does authentication work?',
          'Where are API endpoints defined?',
          'What data models are used?',
          'Explain the data flow',
        ].map((prompt, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleQuickPrompt(prompt)}
            disabled={loading}
            className="glass-pill"
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            <Lightbulb size={11} color="var(--amber)" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={activeContextNode ? `Ask about ${activeContextNode.label}...` : "Ask a question about this repository..."}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--cyan)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !inputQuestion.trim()}
          style={{ padding: '10px 14px' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

export default AIChatDrawer;
