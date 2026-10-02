import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileCode, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Cpu, 
  Boxes, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';

import api from '../services/api';

export function NodeDetailDrawer({
  repoId,
  nodeData,
  onClose,
  onSelectNodeById,
  onAskAIAboutFile
}) {
  const [loadingCode, setLoadingCode] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [formattedLang, setFormattedLang] = useState('javascript');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (nodeData && repoId) {
      fetchDetails();
    }
  }, [nodeData, repoId]);

  useEffect(() => {
    if (sourceCode) {
      Prism.highlightAll();
    }
  }, [sourceCode, formattedLang]);

  const fetchDetails = async () => {
    setLoadingCode(true);
    try {
      const res = await api.getNodeDetail(repoId, nodeData.id);
      setSourceCode(res.source_code || '');
      setFormattedLang(res.formatted_language || 'javascript');
      setLoadingCode(false);
    } catch (err) {
      setSourceCode(`// Error loading source code: ${err.message}`);
      setLoadingCode(false);
    }
  };

  const handleCopy = () => {
    if (sourceCode) {
      navigator.clipboard.writeText(sourceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!nodeData) return null;

  return (
    <div className="flat-panel-elevated" style={{
      position: 'fixed',
      top: '56px',
      right: '12px',
      bottom: '12px',
      width: '480px',
      maxWidth: 'calc(100vw - 24px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 30,
      overflow: 'hidden',
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <FileCode size={16} color="var(--color-frontend)" style={{ flexShrink: 0 }} />
          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ fontSize: '14px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nodeData.label}
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {nodeData.relative_path}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            className="btn-primary" 
            onClick={() => onAskAIAboutFile(nodeData)}
            style={{ padding: '4px 10px', fontSize: '12px' }}
            title="Ask AI questions about this component"
          >
            <Sparkles size={12} />
            <span>Ask AI</span>
          </button>
          <button className="btn-icon" onClick={onClose} style={{ padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Purpose Overview Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
            Role & Purpose
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {nodeData.purpose_summary || 'Component module within the system.'}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span className={`flat-badge badge-${nodeData.layer}`} style={{ fontSize: '10px' }}>
              {nodeData.layer}
            </span>
            <span className="flat-badge" style={{ fontSize: '10px' }}>
              {nodeData.language}
            </span>
            <span className="flat-badge" style={{ fontSize: '10px' }}>
              {nodeData.line_count} lines
            </span>
          </div>
        </div>


        {/* Exposed Endpoints (if any) */}
        {nodeData.endpoints && nodeData.endpoints.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} color="var(--emerald)" />
              <span>Exposed API Endpoints ({nodeData.endpoints.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {nodeData.endpoints.map((ep, idx) => (
                <div key={idx} style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--emerald)' }}>{ep.method}</span>
                    <span style={{ color: '#fff' }}>{ep.path}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>L{ep.line_number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Defined Symbols */}
        {nodeData.symbols && nodeData.symbols.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Boxes size={14} color="var(--purple)" />
              <span>Defined Symbols ({nodeData.symbols.length})</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {nodeData.symbols.map((sym, idx) => (
                <div key={idx} className="glass-pill" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--purple)', fontWeight: 600 }}>{sym.symbol_type}:</span>
                  <span style={{ color: '#fff' }}>{sym.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architecture Dependencies & Callers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Dependencies (Outgoing) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={13} color="var(--cyan)" />
              <span>Calls / Uses ({nodeData.dependencies?.length || 0})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
              {nodeData.dependencies && nodeData.dependencies.length > 0 ? (
                nodeData.dependencies.map((dep) => (
                  <button
                    key={dep}
                    onClick={() => onSelectNodeById(dep)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--cyan)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      padding: '2px 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={dep}
                  >
                    → {dep.split('/').pop()}
                  </button>
                ))
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>None</span>
              )}
            </div>
          </div>

          {/* Callers (Incoming) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownLeft size={13} color="var(--purple)" />
              <span>Called By ({nodeData.callers?.length || 0})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
              {nodeData.callers && nodeData.callers.length > 0 ? (
                nodeData.callers.map((caller) => (
                  <button
                    key={caller}
                    onClick={() => onSelectNodeById(caller)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--purple)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      padding: '2px 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={caller}
                  >
                    ← {caller.split('/').pop()}
                  </button>
                ))
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>None</span>
              )}
            </div>
          </div>
        </div>

        {/* Live Source Code Preview with Prism */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '220px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Source Code Preview
            </span>
            <button 
              className="btn-icon" 
              onClick={handleCopy} 
              style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
              title="Copy code to clipboard"
            >
              {copied ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div style={{
            flex: 1,
            background: '#0d1117',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflow: 'auto',
            maxHeight: '300px',
            fontSize: '12px',
            position: 'relative'
          }}>
            {loadingCode ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading code...
              </div>
            ) : (
              <pre style={{ margin: 0, padding: '12px', background: 'transparent' }}>
                <code className={`language-${formattedLang}`}>
                  {sourceCode}
                </code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NodeDetailDrawer;
