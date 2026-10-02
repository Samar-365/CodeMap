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
  UploadCloud
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

  // Load system info on startup without loading preset workflows
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const health = await api.checkHealth();
      setSystemInfo(health);
    } catch (err) {
      console.warn('Backend startup connection:', err.message);
    }
  };

  const handleResetWorkflow = () => {
    setCurrentRepo(null);
    setGraphData(null);
    setSelectedNode(null);
    setIsChatOpen(false);
    setIsSearchOpen(false);
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
        onResetWorkflow={handleResetWorkflow}
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
          /* Empty State: Centered CodeMap Logo & Name */
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px',
            gap: '18px'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.36)'
            }}>
              <Compass size={40} color="var(--text-primary)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                CodeMap
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', margin: 0, lineHeight: 1.5 }}>
                AI-powered visual codebase navigator
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                className="btn-primary"
                onClick={() => setIsRepoModalOpen(true)}
                style={{ padding: '10px 22px', fontSize: '14px' }}
              >
                <UploadCloud size={16} />
                <span>Load Project</span>
              </button>
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
          isNodeDetailOpen={!!selectedNode}
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
