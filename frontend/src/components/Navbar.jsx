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
    <header className="navbar glass-panel" style={{
      margin: '12px 16px 0 16px',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 20,
      borderRadius: 'var(--radius-md)',
      position: 'relative'
    }}>
      {/* Brand & Active Repo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={onOpenRepoModal}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
          }}>
            <Compass size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', color: '#fff', letterSpacing: '-0.02em' }}>
                CodeMap <span style={{ color: 'var(--cyan)' }}>AI</span>
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--cyan)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                2026
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Visual Codebase Navigator
            </div>
          </div>
        </div>

        {/* Active Repo Badge */}
        {currentRepo && (
          <div className="glass-pill" style={{ marginLeft: '8px', cursor: 'pointer' }} onClick={onOpenRepoModal} title="Click to switch repository">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald)' }}></span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentRepo.repo_name}</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span>{currentRepo.file_count} files</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span>{currentRepo.total_lines} lines</span>
          </div>
        )}
      </div>

      {/* Middle: Search Trigger */}
      <div style={{ flex: '1', maxWidth: '380px', margin: '0 20px' }}>
        <button 
          onClick={onOpenSearch}
          style={{
            width: '100%',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 14px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '13px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--cyan)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={15} color="var(--cyan)" />
            <span>Search files, routes, classes, functions...</span>
          </div>
          <kbd style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}>
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Layout Orientation Toggle */}
        <button 
          className="btn-icon" 
          onClick={onToggleLayout}
          title={`Switch to ${layoutDirection === 'LR' ? 'Top-to-Bottom' : 'Left-to-Right'} Layout`}
        >
          {layoutDirection === 'LR' ? <ArrowRightLeft size={16} /> : <ArrowUpDown size={16} />}
        </button>

        {/* Repository Switcher Button */}
        <button className="btn-secondary" onClick={onOpenRepoModal} style={{ padding: '7px 12px', fontSize: '13px' }}>
          <UploadCloud size={15} color="var(--cyan)" />
          <span>Load Repo</span>
        </button>

        {/* AI Explainer Chat Drawer Toggle */}
        <button 
          className={`btn-primary ${isChatOpen ? 'selected' : ''}`} 
          onClick={onToggleChat}
          style={{ 
            padding: '7px 14px', 
            fontSize: '13px',
            background: isChatOpen ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)' : undefined 
          }}
        >
          <Sparkles size={15} />
          <span>AI Explainer</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
