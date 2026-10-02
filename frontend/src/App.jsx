import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GraphView from './components/GraphView';
import NodeDetailDrawer from './components/NodeDetailDrawer';
import AIChatDrawer from './components/AIChatDrawer';
import SearchBar from './components/SearchBar';
import RepoInputModal from './components/RepoInputModal';
import api from './services/api';

import { 
  Compass, 
  Sparkles, 
  UploadCloud, 
  Layers, 
  Cpu, 
  Globe, 
  Database,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export function App() {
  const [currentRepo, setCurrentRepo] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState('LR'); // 'LR' | 'TB'
  const [systemInfo, setSystemInfo] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load system info & sample repo on first startup
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const health = await api.checkHealth();
      setSystemInfo(health);

      // Auto-ingest sample project for instant visual demonstration
      const sampleRes = await api.ingestRepo({
        input_type: 'sample',
        sample_name: 'task_flow_app'
      });
      const gData = await api.getGraphData(sampleRes.repo_id);
      setCurrentRepo(sampleRes.summary);
      setGraphData(gData);
      setInitialLoading(false);
    } catch (err) {
      console.warn('Backend startup connection:', err.message);
      setInitialLoading(false);
    }
  };

  const handleRepoLoaded = (summary, graph) => {
    setCurrentRepo(summary);
    setGraphData(graph);
    setSelectedNode(null);
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
  };

  const handleSelectNodeById = (nodeId) => {
    if (!graphData || !graphData.nodes) return;
    const target = graphData.nodes.find(n => n.id === nodeId || n.data?.relative_path === nodeId);
    if (target) {
      setSelectedNode(target.data);
    }
  };

  const handleSelectSearchResult = (searchItem) => {
    handleSelectNodeById(searchItem.node_id);
  };

  const handleAskAIAboutFile = (node) => {
    setSelectedNode(node);
    setIsChatOpen(true);
  };

  const toggleLayout = () => {
    setLayoutDirection(prev => prev === 'LR' ? 'TB' : 'LR');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top Navbar */}
      <Navbar
        currentRepo={currentRepo}
        onOpenRepoModal={() => setIsRepoModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleChat={() => setIsChatOpen(prev => !prev)}
        isChatOpen={isChatOpen}
        layoutDirection={layoutDirection}
        onToggleLayout={toggleLayout}
        systemInfo={systemInfo}
      />

      {/* Main Canvas Area */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {graphData && graphData.nodes && graphData.nodes.length > 0 ? (
          <GraphView
            graphData={graphData}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNode?.id}
            layoutDirection={layoutDirection}
          />
        ) : (
          /* Empty / Welcome Hero State */
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px',
            gap: '24px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Compass size={36} color="var(--accent-primary)" />
            </div>

            <div style={{ maxWidth: '540px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Explore Any Codebase Visually with AI
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                CodeMap AI scans repositories, extracts multi-tier architecture components, traces client-to-backend flows, and enables local line-cited AI explanations.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <button 
                className="btn-primary" 
                onClick={() => setIsRepoModalOpen(true)}
                style={{ padding: '10px 20px', fontSize: '14px' }}
              >
                <UploadCloud size={16} />
                <span>Load a Repository</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Architecture Highlights */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              maxWidth: '700px',
              marginTop: '10px'
            }}>
              <div className="panel-flat" style={{ padding: '16px', textAlign: 'left', borderRadius: 'var(--radius-md)' }}>
                <Globe size={18} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>Frontend UI</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Extracts React components, JSX props, and state hooks.</div>
              </div>
              <div className="panel-flat" style={{ padding: '16px', textAlign: 'left', borderRadius: 'var(--radius-md)' }}>
                <Cpu size={18} color="var(--emerald)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>API Routes</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Detects endpoints and links client fetch requests to backend handlers.</div>
              </div>
              <div className="panel-flat" style={{ padding: '16px', textAlign: 'left', borderRadius: 'var(--radius-md)' }}>
                <Database size={18} color="var(--purple)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>Models & RAG</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>Identifies data entities and enables line-cited AI explanations.</div>
              </div>
            </div>
          </div>
        )}

        {/* Node Detail Drawer */}
        {selectedNode && (
          <NodeDetailDrawer
            repoId={currentRepo?.repo_id}
            nodeData={selectedNode}
            onClose={() => setSelectedNode(null)}
            onSelectNodeById={handleSelectNodeById}
            onAskAIAboutFile={handleAskAIAboutFile}
          />
        )}

        {/* AI Chat Assistant Drawer */}
        <AIChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          repoId={currentRepo?.repo_id}
          repoSummary={currentRepo}
          selectedNode={selectedNode}
          onSelectNodeById={handleSelectNodeById}
        />
      </main>

      {/* Global Search Bar Modal (Ctrl + K) */}
      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        repoId={currentRepo?.repo_id}
        onSelectSearchResult={handleSelectSearchResult}
      />

      {/* Repository Ingestion Modal */}
      <RepoInputModal
        isOpen={isRepoModalOpen}
        onClose={() => setIsRepoModalOpen(false)}
        onRepoLoaded={handleRepoLoaded}
        currentRepoId={currentRepo?.repo_id}
      />
    </div>
  );
}

export default App;
