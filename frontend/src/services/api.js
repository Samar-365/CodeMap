import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for large repo analysis / LLM queries
});

export const api = {
  // System Health
  async checkHealth() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Sample Repositories
  async getSampleRepos() {
    const response = await apiClient.get('/repo/samples');
    return response.data;
  },

  // Ingest Repository (GitHub URL, Local Path, Sample)
  async ingestRepo(payload) {
    const response = await apiClient.post('/repo/ingest', payload);
    return response.data;
  },

  // Upload ZIP Repository
  async uploadZipRepo(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/repo/upload-zip', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  // Ingestion Status polling
  async getRepoStatus(repoId) {
    const response = await apiClient.get(`/repo/status/${repoId}`);
    return response.data;
  },

  // Architecture Graph
  async getGraphData(repoId) {
    const response = await apiClient.get(`/graph/${repoId}`);
    return response.data;
  },

  // Node & Code Inspection
  async getNodeDetail(repoId, nodeId) {
    const response = await apiClient.get(`/graph/${repoId}/node/${encodeURIComponent(nodeId)}`);
    return response.data;
  },

  // Symbol & File Search
  async searchCodebase(repoId, query) {
    const response = await apiClient.get(`/search/${repoId}`, {
      params: { q: query },
    });
    return response.data;
  },

  // AI Explainer & Chat
  async askAI(payload) {
    const response = await apiClient.post('/chat', payload);
    return response.data;
  },
};

export default api;
