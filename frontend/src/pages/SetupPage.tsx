import React, { useState, useEffect } from 'react';
import { Upload, Download, CheckCircle2, Settings, Users, Sparkles, ArrowRight, FileText, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { api } from '../services/api';
import { InitialsAvatar } from '../components/InitialsAvatar';

interface Props {
  onStartAuction: () => void;
}

export const SetupPage: React.FC<Props> = ({ onStartAuction }) => {
  const [step, setStep] = useState<number>(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [uploadStats, setUploadStats] = useState<any>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Configuration State
  const [numTeams, setNumTeams] = useState<number>(4);
  const [teamSize, setTeamSize] = useState<number>(5);
  const [startingCredits, setStartingCredits] = useState<number>(1000);
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<string[]>([]);
  const [suggestedLeaders, setSuggestedLeaders] = useState<Student[]>([]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const list = await api.getStudents();
        setStudents(list);
        if (list.length >= 4) {
          // Default leaders: 0, 2, 9, 5
          setSelectedLeaderIds([list[0].id, list[2].id, list[9]?.id || list[3].id, list[5]?.id || list[1].id]);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      }
    };
    loadInitial();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    try {
      const res = await api.uploadDataset(file);
      setUploadStats(res.summary);
      const updatedStudents = await api.getStudents();
      setStudents(updatedStudents);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleFetchSuggestedLeaders = async () => {
    try {
      const sugg = await api.getSuggestedLeaders(numTeams);
      setSuggestedLeaders(sugg);
      setSelectedLeaderIds(sugg.map(s => s.id));
    } catch (err) {
      console.error('Failed to fetch suggested leaders:', err);
    }
  };

  const toggleLeaderSelection = (studentId: string) => {
    if (selectedLeaderIds.includes(studentId)) {
      setSelectedLeaderIds(selectedLeaderIds.filter(id => id !== studentId));
    } else {
      if (selectedLeaderIds.length < numTeams) {
        setSelectedLeaderIds([...selectedLeaderIds, studentId]);
      }
    }
  };

  const handleFinishSetup = async () => {
    if (selectedLeaderIds.length < numTeams) {
      setErrorMsg(`Please select ${numTeams} leaders (one for each team).`);
      return;
    }
    try {
      await api.configureTeams({
        num_teams: numTeams,
        team_size: teamSize,
        starting_credits: startingCredits,
        leader_ids: selectedLeaderIds,
      });
      onStartAuction();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize auction setup.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>Auction Configuration & Dataset Setup</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload class rosters, define team budgets, and designate team leaders before starting live draft.
        </p>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100">
          {[
            { num: 1, title: 'Upload & Parse' },
            { num: 2, title: 'Budget & Size' },
            { num: 3, title: 'Select Leaders' },
          ].map(s => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`p-3 rounded-xl border text-left transition-all ${
                step === s.num
                  ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-400'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {s.num}
                </span>
                <span className="text-xs font-bold text-slate-800">{s.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-900">Dismiss</button>
        </div>
      )}

      {/* STEP 1: UPLOAD DATASET */}
      {step === 1 && (
        <div className="card-base p-6 bg-white space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 1: Ingest Student Dataset</h2>
              <p className="text-xs text-slate-500">Upload your college class dataset in .csv or .xlsx format:</p>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={api.getSampleDownloadUrl('csv')}
                download
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Sample CSV</span>
              </a>
              <a
                href={api.getSampleDownloadUrl('xlsx')}
                download
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Sample Excel</span>
              </a>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 text-center transition-colors">
            <Upload className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <p className="text-xs font-bold text-slate-800">
              {uploading ? 'Parsing and extracting ML features...' : 'Drag and drop .csv or .xlsx file, or click to browse'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports columns: name, register_no, technical_skills, projects, achievements, hackathons, communication
            </p>
            <label className="mt-4 inline-block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
              Choose File
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {/* Current Ingested Stats */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Ingested Dataset</span>
              <span className="badge-tag bg-emerald-100 text-emerald-800 font-bold text-xs">
                Ready for Auction
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Total Candidates</span>
                <strong className="text-slate-900 text-sm">{students.length} students</strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Unique Skills</span>
                <strong className="text-slate-900 text-sm">{uploadStats?.unique_skills_count || '18+'} detected</strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Hackathon Builders</span>
                <strong className="text-slate-900 text-sm">{uploadStats?.hackathon_participants || '14'} students</strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Average CGPA</span>
                <strong className="text-slate-900 text-sm">{uploadStats?.average_cgpa || '8.6'}</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <span>Next: Configure Teams</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIGURE TEAMS */}
      {step === 2 && (
        <div className="card-base p-6 bg-white space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Step 2: Auction Parameters & Team Quotas</h2>
            <p className="text-xs text-slate-500">Configure virtual credit caps and team roster dimensions:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Number of Teams</label>
              <input
                type="number"
                min={2}
                max={6}
                value={numTeams}
                onChange={e => setNumTeams(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500">Recommended: 4 teams</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Members per Team</label>
              <input
                type="number"
                min={3}
                max={8}
                value={teamSize}
                onChange={e => setTeamSize(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500">Includes leader (default: 5)</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Starting Virtual Credits</label>
              <input
                type="number"
                min={500}
                max={3000}
                step={100}
                value={startingCredits}
                onChange={e => setStartingCredits(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500">Equal allotment per leader</span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <span>Next: Select Leaders</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SELECT LEADERS */}
      {step === 3 && (
        <div className="card-base p-6 bg-white space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 3: Assign Team Leaders</h2>
              <p className="text-xs text-slate-500">
                Select exactly {numTeams} leaders ({selectedLeaderIds.length} of {numTeams} selected):
              </p>
            </div>

            <button
              onClick={handleFetchSuggestedLeaders}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Suggest Leaders (ML Ranking)</span>
            </button>
          </div>

          {/* Leaders Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {students.map(s => {
              const isSelected = selectedLeaderIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleLeaderSelection(s.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <InitialsAvatar name={s.name} size="sm" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{s.preferred_role}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Lead: {s.leadership}/10</span>
                        <span>Comm: {s.communication}/10</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleFinishSetup}
              disabled={selectedLeaderIds.length < numTeams}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <span>Launch Live Auction Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
