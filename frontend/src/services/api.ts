import { Student, Team, AuctionState, TeamFitBreakdown, MLInsights } from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Sample downloads
  getSampleDownloadUrl: (format: 'csv' | 'xlsx') => `${API_BASE}/sample/download?format=${format}`,

  // Dataset upload
  uploadDataset: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/dataset/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // Students
  getStudents: async (params?: { search?: string; role?: string; skill?: string; archetype?: string }): Promise<Student[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.skill) query.append('skill', params.skill);
    if (params?.archetype) query.append('archetype', params.archetype);
    const res = await fetch(`${API_BASE}/students?${query.toString()}`);
    return res.json();
  },

  getStudentDetail: async (studentId: string): Promise<{ student: Student; similar_students: any[] }> => {
    const res = await fetch(`${API_BASE}/students/${studentId}`);
    if (!res.ok) throw new Error('Student not found');
    return res.json();
  },

  // Setup
  getSuggestedLeaders: async (count: number = 4): Promise<Student[]> => {
    const res = await fetch(`${API_BASE}/setup/suggest-leaders?count=${count}`);
    return res.json();
  },

  configureTeams: async (payload: { num_teams: number; team_size: number; starting_credits: number; leader_ids: string[] }) => {
    const res = await fetch(`${API_BASE}/setup/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Configuration failed');
    }
    return res.json();
  },

  // Auction
  getAuctionState: async (): Promise<AuctionState> => {
    const res = await fetch(`${API_BASE}/auction/state`);
    return res.json();
  },

  getAuctionFits: async (): Promise<TeamFitBreakdown[]> => {
    const res = await fetch(`${API_BASE}/auction/fits`);
    return res.json();
  },

  placeBid: async (teamId: string, amount: number) => {
    const res = await fetch(`${API_BASE}/auction/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: teamId, amount }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to place bid');
    }
    return res.json();
  },

  simulateCompetingBid: async () => {
    const res = await fetch(`${API_BASE}/auction/simulate-competing-bid`, {
      method: 'POST',
    });
    return res.json();
  },

  soldCurrentStudent: async () => {
    const res = await fetch(`${API_BASE}/auction/sold`, {
      method: 'POST',
    });
    return res.json();
  },

  passCurrentStudent: async () => {
    const res = await fetch(`${API_BASE}/auction/pass`, {
      method: 'POST',
    });
    return res.json();
  },

  nominateStudent: async (studentId: string) => {
    const res = await fetch(`${API_BASE}/auction/nominate/${studentId}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to nominate student');
    }
    return res.json();
  },

  resetAuctionDemo: async () => {
    const res = await fetch(`${API_BASE}/auction/reset`, {
      method: 'POST',
    });
    return res.json();
  },

  // Teams
  getTeams: async (): Promise<Team[]> => {
    const res = await fetch(`${API_BASE}/teams`);
    return res.json();
  },

  // ML Insights
  getMLInsights: async (): Promise<MLInsights> => {
    const res = await fetch(`${API_BASE}/ml/insights`);
    return res.json();
  },

  calculateCustomFit: async (teamId: string, studentId: string) => {
    const res = await fetch(`${API_BASE}/ml/calculate-fit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: teamId, student_id: studentId }),
    });
    return res.json();
  },

  // Results
  getResults: async () => {
    const res = await fetch(`${API_BASE}/results`);
    return res.json();
  },

  // Trading Round
  evaluateTrade: async (payload: {
    team_a_id: string;
    team_b_id: string;
    player_a_id: string;
    player_b_id: string;
    credit_sweetener: number;
  }) => {
    const res = await fetch(`${API_BASE}/trade/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  executeTrade: async (payload: {
    team_a_id: string;
    team_b_id: string;
    player_a_id: string;
    player_b_id: string;
    credit_sweetener: number;
  }) => {
    const res = await fetch(`${API_BASE}/trade/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getTradeHistory: async () => {
    const res = await fetch(`${API_BASE}/trade/history`);
    return res.json();
  },

  // Database & Session Persistence
  saveSessionToDatabase: async (sessionId: string, sessionName: string, config?: any) => {
    const res = await fetch(`${API_BASE}/database/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, session_name: sessionName, config }),
    });
    return res.json();
  },

  getSavedSessions: async () => {
    const res = await fetch(`${API_BASE}/database/sessions`);
    return res.json();
  },

  loadSessionFromDatabase: async (sessionId: string) => {
    const res = await fetch(`${API_BASE}/database/load/${sessionId}`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to load session');
    }
    return res.json();
  },

  getDossierExportUrl: () => `${API_BASE}/database/export/dossier`,
  getCSVExportUrl: () => `${API_BASE}/database/export/csv`,

  // Cohort Intelligence & Analysis Mode
  getCohortIntelligence: async () => {
    const res = await fetch(`${API_BASE}/analysis/cohort-intelligence`);
    return res.json();
  },

  importAndAnalyzeDossier: async (dossier: any) => {
    const res = await fetch(`${API_BASE}/analysis/import-dossier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dossier }),
    });
    return res.json();
  },
};

