import React, { useState, useEffect } from 'react';
import { Users, Shield, Sparkles, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, Award, PlusCircle, ArrowUpRight } from 'lucide-react';
import { Team, Student } from '../types';
import { InitialsAvatar } from '../components/InitialsAvatar';
import { api } from '../services/api';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Props {
  onNominateToAuction: (studentId: string) => void;
  onOpenStudentProfile: (student: Student) => void;
}

export const TeamDashboardPage: React.FC<Props> = ({
  onNominateToAuction,
  onOpenStudentProfile,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      const data = await api.getTeams();
      setTeams(data);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Team Rosters & Composition Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time radar vectors, skill gap detection, and dynamic candidate recommendations for every team
          </p>
        </div>

        <button
          onClick={fetchTeams}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors self-start sm:self-auto"
        >
          Refresh Analytics
        </button>
      </div>

      {/* Grid of Team Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {teams.map(team => {
          const radarData = Object.entries(team.radar_vector || {}).map(([dim, val]) => ({
            subject: dim,
            value: Math.round(val * 100),
          }));

          const slotsLeft = team.max_members - team.members.length;
          const budgetPct = Math.round((team.credits_remaining / team.credits_initial) * 100);

          return (
            <div key={team.id} className="card-base p-6 bg-white flex flex-col justify-between space-y-6">
              {/* Team Top Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-10 rounded-full"
                      style={{ backgroundColor: team.color_accent }}
                    />
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{team.name}</h2>
                      <p className="text-xs text-slate-500">
                        Leader: <strong className="text-slate-800">{team.leader.name}</strong> ({team.leader.preferred_role})
                      </p>
                    </div>
                  </div>

                  {/* Team Balance Score Badge */}
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Balance Score
                    </div>
                    <div className="text-2xl font-black text-slate-900 flex items-center justify-end space-x-1">
                      <span>{team.balance_score}</span>
                      <span className="text-xs font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                </div>

                {/* Credits & Slots Bar */}
                <div className="grid grid-cols-2 gap-4 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Credits Remaining:</span>
                      <strong className="text-slate-900 font-bold">{team.credits_remaining}c</strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Roster Capacity:</span>
                      <strong className="text-slate-900 font-bold">
                        {team.members.length} / {team.max_members} ({slotsLeft} open)
                      </strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${(team.members.length / team.max_members) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Radar + Roster Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  {/* Radar Chart */}
                  <div className="p-2 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider self-start px-2">
                      Team Skill Radar
                    </span>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" tick={false} />
                          <Radar
                            dataKey="value"
                            stroke={team.color_accent}
                            fill={team.color_accent}
                            fillOpacity={0.35}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Current Members List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Current Roster ({team.members.length})
                    </span>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {team.members.map((m, idx) => (
                        <div
                          key={m.id}
                          onClick={() => onOpenStudentProfile(m)}
                          className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <InitialsAvatar name={m.name} size="sm" />
                            <div className="truncate">
                              <p className="font-semibold text-slate-800 truncate">{m.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{m.preferred_role}</p>
                            </div>
                          </div>
                          {idx === 0 && (
                            <span className="badge-tag bg-amber-50 text-amber-800 border border-amber-200 text-[10px] shrink-0">
                              Leader
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skill Gaps: Strengths, Weaknesses, Missing */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                      Strengths (≥65%)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {team.strengths.length > 0 ? (
                        team.strengths.map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px]">None yet</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-700 block mb-1">
                      Weak Areas (35-65%)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {team.weaknesses.length > 0 ? (
                        team.weaknesses.map(w => (
                          <span key={w} className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold">
                            {w}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px]">None</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-rose-700 block mb-1">
                      Missing Dimensions
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {team.missing_skills.length > 0 ? (
                        team.missing_skills.map(m => (
                          <span key={m} className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 text-[10px] font-semibold">
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px]">Fully covered!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Top-3 Recommended Available Candidates */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Recommended Next Targets (ML Decision Support)
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-semibold">Updates dynamically</span>
                </div>

                <div className="space-y-2">
                  {team.recommendations && team.recommendations.length > 0 ? (
                    team.recommendations.map((rec, i) => (
                      <div
                        key={rec.student.id}
                        className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                          <InitialsAvatar name={rec.student.name} size="sm" />
                          <div className="truncate">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-slate-900">{rec.student.name}</span>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 rounded">
                                {rec.fit_score}% fit
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {rec.reasons?.[0] || 'Complementary skill profile'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onNominateToAuction(rec.student.id)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shrink-0 transition-colors flex items-center space-x-1"
                          title="Brings this candidate to the auction arena"
                        >
                          <span>Nominate</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No available candidates match criteria or team is full.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
