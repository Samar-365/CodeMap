import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  FolderArchive, 
  FolderGit2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Code2,
  Database,
  Layers
} from 'lucide-react';

import api from '../services/api';

export function RepoInputModal({ isOpen, onClose, onRepoLoaded, currentRepoId }) {
  const [activeTab, setActiveTab] = useState('sample'); // 'sample' | 'github' | 'zip' | 'local'
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('task_flow_app');
  const [githubUrl, setGithubUrl] = useState('https://github.com/Samar-365/CodeMap.git');
  const [localPath, setLocalPath] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [loading, setLoading] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSamples();
      setError(null);
    }
  }, [isOpen]);

  const loadSamples = async () => {
    try {
      const data = await api.getSampleRepos();
      setSamples(data);
      if (data.length > 0) {
        setSelectedSample(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load sample repos:', err);
    }
  };

  const handleIngest = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setProgressStage('Ingesting repository files...');

    try {
      let res;
      if (activeTab === 'sample') {
        setProgressStage('Scanning sample project and architecture...');
        res = await api.ingestRepo({
          input_type: 'sample',
          sample_name: selectedSample,
        });
      } else if (activeTab === 'github') {
        setProgressStage('Cloning repository from GitHub (shallow clone)...');
        res = await api.ingestRepo({
          input_type: 'github',
          url: githubUrl,
        });
      } else if (activeTab === 'local') {
        setProgressStage('Scanning local folder and detecting AST symbols...');
        res = await api.ingestRepo({
          input_type: 'local',
          local_path: localPath,
        });
      } else if (activeTab === 'zip') {
        if (!zipFile) {
          throw new Error('Please select a ZIP file to upload.');
        }
        setProgressStage('Uploading and extracting ZIP archive...');
        res = await api.uploadZipRepo(zipFile, (pct) => {
          setUploadProgress(pct);
        });
      }

      setProgressStage('Parsing AST, routes, and building interactive graph...');
      const graphData = await api.getGraphData(res.repo_id);

      setLoading(false);
      onRepoLoaded(res.summary, graphData);
      onClose();
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.detail || err.message || 'Failed to ingest repository.';
      setError(errMsg);
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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="flat-panel-elevated" style={{
        width: '100%',
        maxWidth: '580px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--color-frontend)" />
            <div>
              <h2 style={{ fontSize: '15px', margin: 0 }}>Load Codebase</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Select a sample demo or provide your own repository
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={loading} style={{ padding: '4px' }}>
            <X size={15} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div style={{
          display: 'flex',
          padding: '6px 16px 0 16px',
          gap: '6px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-app)'
        }}>
          {[
            { id: 'sample', label: 'Preset Samples', icon: Sparkles },
            { id: 'github', label: 'GitHub URL', icon: GitBranch },
            { id: 'zip', label: 'ZIP Archive', icon: FolderArchive },
            { id: 'local', label: 'Local Directory', icon: FolderGit2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(null); }}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--text-primary)' : '2px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>


        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              color: '#fda4af',
              fontSize: '13px'
            }}>
              <AlertCircle size={18} color="var(--rose)" style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* Loading Progress State */}
          {loading ? (
            <div style={{
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-glow-cyan)'
              }}>
                <Loader2 size={32} color="var(--cyan)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>Analyzing Repository</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{progressStage}</p>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ width: '100%', maxWidth: '300px', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--cyan)', transition: 'width 0.2s ease' }}></div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tab 1: Sample Projects */}
              {activeTab === 'sample' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Instant offline demonstration fixtures ready to explore:
                  </p>
                  {samples.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSample(s.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: selectedSample === s.id ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: selectedSample === s.id ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>{s.name}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {s.languages.map((l) => (
                            <span key={l} className="glass-pill" style={{ fontSize: '10px', padding: '2px 8px' }}>{l}</span>
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {s.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: GitHub URL */}
              {activeTab === 'github' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    GitHub Repository Clone URL:
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository.git"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--cyan)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    💡 Uses fast shallow cloning (<code>--depth 1</code>) to analyze components and relationships without heavy git history.
                  </div>
                </div>
              )}

              {/* Tab 3: ZIP Archive Upload */}
              {activeTab === 'zip' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '30px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: 'rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease',
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--cyan)'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setZipFile(e.dataTransfer.files[0]);
                    }
                  }}
                  >
                    <input
                      type="file"
                      accept=".zip"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setZipFile(e.target.files[0]);
                        }
                      }}
                    />
                    <FolderArchive size={36} color="var(--cyan)" style={{ marginBottom: '10px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                      {zipFile ? zipFile.name : 'Click to select or drag & drop ZIP codebase'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {zipFile ? `${(zipFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Max size: 150 MB (Supports JS/TS, Python, Java projects)'}
                    </span>
                  </label>
                </div>
              )}

              {/* Tab 4: Local Directory */}
              {activeTab === 'local' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Absolute Local Directory Path:
                  </label>
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="e.g. C:\Users\samar\Desktop\projects\MyProject"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--cyan)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    🔒 Code files remain 100% on your machine for privacy.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!loading && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleIngest}>
              <span>Analyze & Build Map</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default RepoInputModal;
