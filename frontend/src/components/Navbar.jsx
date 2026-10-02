import React from 'react';
import { 
  Compass, 
  Search, 
  MessageSquare, 
  UploadCloud, 
  Layers, 
  Sparkles, 
  ArrowRightLeft, 
  ArrowUpDown,
  Cpu,
  GitBranch
} from 'lucide-react';


export function Navbar({ 
  currentRepo, 
  onOpenRepoModal, 
  onOpenSearch, 
  onToggleChat, 
  isChatOpen,
  layoutDirection, 
  onToggleLayout,
  systemInfo 
}) {
  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 20,
      position: 'relative'
    }}>
      {/* Brand & Active Repo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} 
          onClick={onOpenRepoModal}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Compass size={16} color="var(--text-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
              CodeMap AI
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              padding: '1px 5px',
              borderRadius: 'var(--radius-xs)'
            }}>
              v1.0
            </span>
          </div>
        </div>

        {/* Active Repo Badge */}
        {currentRepo && (
          <div 
            className="flat-badge" 
            style={{ cursor: 'pointer', background: 'var(--bg-card)' }} 
            onClick={onOpenRepoModal} 
            title="Click to switch repository"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-api)' }}></span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentRepo.repo_name}</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span>{currentRepo.file_count} files</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span>{currentRepo.total_lines} lines</span>
          </div>
        )}
      </div>

      {/* Middle: Search Trigger */}
      <div style={{ flex: '1', maxWidth: '360px', margin: '0 16px' }}>
        <button 
          onClick={onOpenSearch}
          style={{
            width: '100%',
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
            fontSize: '12px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-medium)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={13} color="var(--text-muted)" />
            <span>Search files, routes, symbols...</span>
          </div>
          <kbd style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '3px',
            padding: '1px 5px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Layout Orientation Toggle */}
        <button 
          className="btn-icon" 
          onClick={onToggleLayout}
          title={`Switch layout orientation (Current: ${layoutDirection})`}
        >
          {layoutDirection === 'LR' ? <ArrowRightLeft size={14} /> : <ArrowUpDown size={14} />}
        </button>

        {/* Repository Switcher Button */}
        <button className="btn-secondary" onClick={onOpenRepoModal}>
          <UploadCloud size={14} />
          <span>Load Repo</span>
        </button>

        {/* AI Explainer Chat Toggle */}
        <button 
          className="btn-primary"
          onClick={onToggleChat}
          style={{
            backgroundColor: isChatOpen ? 'var(--color-model)' : '#fafafa',
            color: isChatOpen ? '#fff' : '#09090b',
            borderColor: isChatOpen ? 'var(--color-model)' : '#fafafa'
          }}
        >
          <Sparkles size={14} />
          <span>AI Explainer</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;

