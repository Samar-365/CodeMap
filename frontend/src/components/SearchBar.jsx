import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  FileCode, 
  Cpu, 
  Boxes, 
  Database, 
  Code2, 
  ArrowRight,
  Filter
} from 'lucide-react';
import api from '../services/api';

export function SearchBar({
  isOpen,
  onClose,
  repoId,
  onSelectSearchResult
}) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'file' | 'route' | 'symbol' | 'model'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (repoId && !query) {
        // Initial search to show available files
        performSearch('a');
      }
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen, repoId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const performSearch = async (searchQuery) => {
    if (!repoId) return;
    setLoading(true);
    try {
      const data = await api.searchCodebase(repoId, searchQuery);
      setResults(data.results || []);
      setLoading(false);
    } catch (err) {
      console.error('Search error:', err);
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      performSearch(val);
    } else {
      setResults([]);
    }
  };

  const filteredResults = results.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'file') return item.match_type === 'file';
    if (filterType === 'route') return item.match_type === 'route';
    if (filterType === 'symbol') return ['function', 'component', 'class'].includes(item.match_type);
    if (filterType === 'model') return ['model', 'interface'].includes(item.match_type);
    return true;
  });

  const getMatchIcon = (type) => {
    switch (type) {
      case 'file': return <FileCode size={15} color="var(--cyan)" />;
      case 'route': return <Cpu size={15} color="var(--emerald)" />;
      case 'model': return <Database size={15} color="var(--purple)" />;
      case 'component': return <Boxes size={15} color="#38bdf8" />;
      default: return <Code2 size={15} color="#60a5fa" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 100,
      paddingTop: '80px',
    }}>
      <div className="flat-panel-elevated" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Search Header Input */}
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search files, routes, classes, symbols..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'var(--font-heading)'
            }}
          />
          <kbd style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '3px',
            padding: '1px 5px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            ESC
          </kbd>
        </div>

        {/* Filter Pills */}
        <div style={{
          padding: '6px 16px',
          display: 'flex',
          gap: '6px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-app)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'file', label: 'Files' },
            { id: 'route', label: 'API Routes' },
            { id: 'symbol', label: 'Functions/Components' },
            { id: 'model', label: 'Data Models' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className="flat-badge"
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                background: filterType === f.id ? 'var(--bg-surface-elevated)' : 'transparent',
                borderColor: filterType === f.id ? 'var(--border-medium)' : 'transparent',
                color: filterType === f.id ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <span>{f.label}</span>
            </button>
          ))}
        </div>


        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', maxHeight: '400px' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Searching symbols & routes...
            </div>
          ) : filteredResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectSearchResult(item);
                    onClose();
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div style={{ flexShrink: 0 }}>
                      {getMatchIcon(item.match_type)}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>
                          {item.name}
                        </span>
                        <span className="glass-pill" style={{ fontSize: '10px', padding: '1px 5px' }}>
                          {item.match_type}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {item.relative_path}:L{item.line_number}
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={14} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {query ? `No matching code components found for "${query}"` : 'Type to search codebase symbols and files.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
