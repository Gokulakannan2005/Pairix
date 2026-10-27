import React, { useState, useEffect } from 'react';
import {
  Download, Upload, Save, Database, BarChart2, ShieldCheck,
  Sparkles, CheckCircle2, AlertTriangle, Layers, Cpu, Award, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const AnalysisModePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [intelligenceData, setIntelligenceData] = useState<any>(null);
  const [savedSessions, setSavedSessions] = useState<any[]>([]);
  const [saveSessionName, setSaveSessionName] = useState<string>('Fall 2026 Hackathon Draft');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('AI & Deep Learning');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const fetchCohortData = async () => {
    setLoading(true);
    try {
      const data = await api.getCohortIntelligence();
      setIntelligenceData(data);
      const sessions = await api.getSavedSessions();
      setSavedSessions(sessions);
    } catch (err) {
      console.error('Failed to load cohort intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohortData();
  }, []);

  const handleSaveToDatabase = async () => {
    try {
      const sessionId = `draft_${Date.now()}`;
      await api.saveSessionToDatabase(sessionId, saveSessionName);
      setSaveSuccessMsg(`Session "${saveSessionName}" successfully stored in SQLite!`);
      const sessions = await api.getSavedSessions();
      setSavedSessions(sessions);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      await api.loadSessionFromDatabase(sessionId);
      await fetchCohortData();
      alert('Session loaded successfully!');
    } catch (err: any) {
      alert(`Load failed: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        setIsImporting(true);
        const analyzed = await api.importAndAnalyzeDossier(jsonContent);
        setIntelligenceData(analyzed);
        setIsImporting(false);
      } catch (err: any) {
        alert('Invalid Pairix Dossier JSON file.');
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-sm font-semibold">Generating Deep Cohort Intelligence &amp; Analytics...</p>
      </div>
    );
  }

  const intel = intelligenceData?.intelligence;
  const dossier = intelligenceData?.dossier;

  // Radar deficit chart data
  const heatmapData = intel?.institutional_radar
    ? Object.entries(intel.institutional_radar).map(([dim, avg]) => ({
        dimension: dim,
        averageCoverage: Math.round(Number(avg) * 100),
        benchmark: 65,
        teamsPassing: intel.teams_meeting_benchmark[dim] || 0,
      }))
    : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="badge-tag bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              Draft Analysis &amp; Cohort Intelligence Mode
            </span>
            <span className="text-xs text-slate-500 font-medium">Persistent Database &amp; Dossier Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Institutional Talent Dossier &amp; Predictive Simulation
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Export finalized team profiles for LMS/project management, analyze cohort-wide skill deficiencies,
            and simulate head-to-head hackathon track competencies.
          </p>
        </div>

        {/* Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={api.getDossierExportUrl()}
            download="pairix_talent_dossier.json"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Dossier</span>
          </a>

          <a
            href={api.getCSVExportUrl()}
            download="pairix_team_rosters.csv"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1.5 border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Rosters CSV</span>
          </a>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Database Session Persistence Ribbon */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">SQLite Database Session Repository</h3>
            <p className="text-xs text-slate-400">Save session snapshots permanently or load past tournament states.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={saveSessionName}
            onChange={e => setSaveSessionName(e.target.value)}
            placeholder="Session Name"
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSaveToDatabase}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Snapshot</span>
          </button>

          {/* Import JSON File Input */}
          <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>{isImporting ? 'Analyzing...' : 'Load JSON Dossier'}</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* COOL ABILITY 1: Institutional Cohort Skill Shortage Heatmap */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="badge-tag bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
              Ability 1: Institutional Intelligence
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Cohort-Wide Skill Deficiency Heatmap vs Benchmark (65%)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluates whether the student body contains sufficient depth across core industry competencies.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {dossier?.export_metadata?.total_students_placed} Drafted Members
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heatmapData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${val}%`,
                  name === 'averageCoverage' ? 'Cohort Average Coverage' : 'Balanced Benchmark'
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="averageCoverage" name="Cohort Average Coverage" fill="#2563eb" radius={[6, 6, 0, 0]} />
              <Bar dataKey="benchmark" name="Balanced Benchmark (65%)" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* COOL ABILITY 2: Head-to-Head Hackathon Track Simulations */}
      {intel?.track_ratings && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="badge-tag bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase tracking-wider">
                Ability 2: Predictive Simulation
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Head-to-Head Hackathon Track Competency Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Simulates which drafted team possesses the optimal cross-functional capability to win specific project tracks.
              </p>
            </div>

            {/* Track Switcher */}
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(intel.track_ratings).map(tr => (
                <button
                  key={tr}
                  onClick={() => setSelectedTrack(tr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTrack === tr
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tr}
                </button>
              ))}
            </div>
          </div>

          {/* Track Leaderboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {intel.track_ratings[selectedTrack]?.map((ts: any, rank: number) => (
              <div key={ts.team_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ts.color }} />
                    <span className="font-bold text-xs text-slate-900">{ts.team_name}</span>
                  </div>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    rank === 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    Rank #{rank + 1}
                  </span>
                </div>

                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-purple-700">{ts.competency}%</span>
                  <span className="text-[11px] text-slate-500 font-medium">readiness</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                  <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, ts.competency)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COOL ABILITY 3: Project Suitability & Tech Stack Recommendations */}
      {intel?.project_recommendations && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <span className="badge-tag bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
              Ability 3: Solution Architect
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Project Domain Suitability &amp; Recommended Tech Stacks
            </h3>
            <p className="text-xs text-slate-500">
              Tailors engineering architectures directly to each team's collective strengths and gap coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {Object.entries(intel.project_recommendations).map(([tname, recs]: [string, any]) => (
              <div key={tname} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wider block">{tname}</span>
                {recs.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{rec.domain}</span>
                      <span className="text-emerald-700 font-semibold">{rec.match}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      <strong className="text-slate-700">Recommended Stack:</strong> {rec.recommended_stack}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COOL ABILITY 4: Draft Economy ROI & Efficiency Metric */}
      {intel?.roi_metrics && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <span className="badge-tag bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
              Ability 4: Draft Economy ROI
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Credit Capital Efficiency (Balance Points per 100 Credits)
            </h3>
            <p className="text-xs text-slate-500">
              Identifies which team drafted the highest collective balance score per credit spent.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3">Credits Spent</th>
                  <th className="py-2.5 px-3">Final Balance Score</th>
                  <th className="py-2.5 px-3">ROI Ratio</th>
                  <th className="py-2.5 px-3">Efficiency Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {intel.roi_metrics.map((r: any) => (
                  <tr key={r.team_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                      <span>{r.team_name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{r.credits_spent}c</td>
                    <td className="py-2.5 px-3 font-bold text-blue-700">{r.balance_score}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{r.roi_ratio} pts/100c</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black">
                        {r.efficiency_grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
