import React, { useState, useEffect } from 'react';
import { Trophy, Users, DollarSign, Award, Shield, CheckCircle2, BarChart2, Compass } from 'lucide-react';
import { api } from '../services/api';
import { InitialsAvatar } from '../components/InitialsAvatar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await api.getResults();
        setResults(data);
      } catch (err) {
        console.error('Failed to load final results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading || !results) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-slate-500">Loading final auction analytics...</p>
      </div>
    );
  }

  const balanceBarData = results.teams.map((t: any) => ({
    name: t.name,
    balance: t.balance_score,
  }));

  const creditsBarData = results.teams.map((t: any) => ({
    name: t.name,
    spent: t.credits_spent,
    remaining: t.credits_remaining,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="badge-tag bg-blue-100 text-blue-800 font-bold text-xs">
              Auction Conclusion
            </span>
            <span className="text-xs text-slate-500">Balanced Cohort Formations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Final Teams & Cohort Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic balance evaluation and cross-team capability distribution:
          </p>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 max-w-sm">
          <strong>Core Product Philosophy:</strong>
          <p className="text-[11px] text-blue-800 mt-0.5">
            Rather than single winner-take-all rankings, Pairix optimizes cross-functional synergy to maximize collective capability across every team.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-base p-4 bg-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teams Formed</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{results.total_teams} Teams</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">5 members per team</span>
        </div>

        <div className="card-base p-4 bg-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidates Placed</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{results.total_students_placed} Students</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">100% placement rate</span>
        </div>

        <div className="card-base p-4 bg-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Credits Spent</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{results.total_credits_spent} <span className="text-xs font-normal text-slate-500">c</span></div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Across all bidding rounds</span>
        </div>

        <div className="card-base p-4 bg-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mean Cohort Balance</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{results.average_balance_score} <span className="text-xs font-normal text-slate-500">/100</span></div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">+28 pts over baseline</span>
        </div>
      </div>

      {/* Cross-Team Comparison Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Balance Score Comparison */}
        <div className="card-base p-5 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Team Balance Score Comparison (0 - 100)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">μ = {results.average_balance_score}</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanceBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} / 100`, 'Balance Score']}
                />
                <Bar dataKey="balance" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credit Utilization Comparison */}
        <div className="card-base p-5 bg-white space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Budget Spending vs Savings
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={creditsBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                  formatter={(val: any, name: any) => [`${val} credits`, name === 'spent' ? 'Spent' : 'Remaining']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="spent" name="Credits Spent" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="remaining" name="Credits Saved" fill="#10b981" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Final Teams Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.teams.map((t: any) => {
          const radarData = Object.entries(t.radar || {}).map(([sub, val]: any) => ({
            subject: sub,
            value: Math.round(val * 100),
          }));

          return (
            <div key={t.team_id} className="card-base p-6 bg-white space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3.5 h-10 rounded-full" style={{ backgroundColor: t.color }} />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500">Leader: <strong className="text-slate-800">{t.leader}</strong></p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Balance</span>
                  <span className="text-2xl font-black text-slate-900">{t.balance_score}</span>
                </div>
              </div>

              {/* Roster & Radar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Credits Remaining:</span>
                    <strong className="text-slate-900">{t.credits_remaining}c</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Credits Invested:</span>
                    <strong className="text-slate-900">{t.credits_spent}c</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Strongest Dimensions:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.strengths.slice(0, 3).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#f1f5f9" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" tick={false} />
                      <Radar
                        dataKey="value"
                        stroke={t.color}
                        fill={t.color}
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
