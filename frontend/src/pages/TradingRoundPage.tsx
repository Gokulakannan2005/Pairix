import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight, ShieldCheck, AlertTriangle, CheckCircle2,
  DollarSign, Scale, UserCheck, RefreshCw, Layers, History, Info, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Team, Student } from '../types';
import { api } from '../services/api';
import { InitialsAvatar } from '../components/InitialsAvatar';
import { SkillRadarChart } from '../components/SkillRadarChart';

interface Props {
  teams: Team[];
  onRefresh: () => void;
  onOpenStudentProfile: (student: Student) => void;
}

export const TradingRoundPage: React.FC<Props> = ({
  teams,
  onRefresh,
  onOpenStudentProfile,
}) => {
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [playerAId, setPlayerAId] = useState<string>('');
  const [playerBId, setPlayerBId] = useState<string>('');
  const [creditSweetener, setCreditSweetener] = useState<number>(0);

  const [evaluation, setEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);

  // Initialize selected teams (e.g. Team 1 and Team 2)
  useEffect(() => {
    if (teams.length >= 2) {
      if (!teamAId) setTeamAId(teams[0].id);
      if (!teamBId) setTeamBId(teams[1].id);
    }
  }, [teams, teamAId, teamBId]);

  const teamA = teams.find(t => t.id === teamAId);
  const teamB = teams.find(t => t.id === teamBId);

  // Franchise anchor rule: leaders cannot be traded
  const eligibleMembersA = teamA?.members.filter(m => !teamA.leader || teamA.leader.id !== m.id) || [];
  const eligibleMembersB = teamB?.members.filter(m => !teamB.leader || teamB.leader.id !== m.id) || [];

  const playerA = eligibleMembersA.find(m => m.id === playerAId) || eligibleMembersA[0] || null;
  const playerB = eligibleMembersB.find(m => m.id === playerBId) || eligibleMembersB[0] || null;

  // Sync player selection when teams change
  useEffect(() => {
    if (eligibleMembersA.length > 0 && (!playerAId || !eligibleMembersA.some(m => m.id === playerAId))) {
      setPlayerAId(eligibleMembersA[0].id);
    } else if (eligibleMembersA.length === 0) {
      setPlayerAId('');
    }
  }, [teamAId, eligibleMembersA.length]);

  useEffect(() => {
    if (eligibleMembersB.length > 0 && (!playerBId || !eligibleMembersB.some(m => m.id === playerBId))) {
      setPlayerBId(eligibleMembersB[0].id);
    } else if (eligibleMembersB.length === 0) {
      setPlayerBId('');
    }
  }, [teamBId, eligibleMembersB.length]);

  // Load trade history
  const loadTradeHistory = async () => {
    try {
      const history = await api.getTradeHistory();
      setTradeHistory(history);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadTradeHistory();
  }, []);

  // Real-time evaluation of proposed trade
  useEffect(() => {
    if (!teamAId || !teamBId || !playerAId || !playerBId || teamAId === teamBId) {
      setEvaluation(null);
      return;
    }

    const runEvaluation = async () => {
      setIsEvaluating(true);
      try {
        const res = await api.evaluateTrade({
          team_a_id: teamAId,
          team_b_id: teamBId,
          player_a_id: playerAId,
          player_b_id: playerBId,
          credit_sweetener: creditSweetener,
        });
        setEvaluation(res);
      } catch (err: any) {
        console.error('Failed to evaluate trade:', err);
      } finally {
        setIsEvaluating(false);
      }
    };

    runEvaluation();
  }, [teamAId, teamBId, playerAId, playerBId, creditSweetener]);

  // Execute trade
  const handleExecuteTrade = async () => {
    if (!evaluation || !evaluation.valid) return;
    setIsExecuting(true);
    setTradeMessage(null);

    try {
      const res = await api.executeTrade({
        team_a_id: teamAId,
        team_b_id: teamBId,
        player_a_id: playerAId,
        player_b_id: playerBId,
        credit_sweetener: creditSweetener,
      });

      if (res.success) {
        setTradeMessage({ type: 'success', text: res.message });
        try {
          confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
        setCreditSweetener(0);
        await onRefresh();
        await loadTradeHistory();
      } else {
        setTradeMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setTradeMessage({ type: 'error', text: err.message || 'Execution failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  // Helper to determine capability tier
  const getPlayerTier = (student?: Student | null) => {
    if (!student) return { label: 'Class B', desc: 'Moderate', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (student.base_price >= 135 || (student.hackathons >= 3 && (student.cgpa || 0) >= 8.8)) {
      return { label: 'Class S', desc: 'Elite Specialist', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    if (student.base_price >= 115 || student.hackathons >= 2) {
      return { label: 'Class A', desc: 'Core Proficient', color: 'bg-blue-100 text-blue-900 border-blue-300' };
    }
    return { label: 'Class B', desc: 'Moderate / Developing', color: 'bg-slate-100 text-slate-800 border-slate-300' };
  };

  const tierA = getPlayerTier(playerA);
  const tierB = getPlayerTier(playerB);
  const isTierMismatch = tierA.label !== tierB.label;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
              <ArrowLeftRight className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Player Trading &amp; Parity Window</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exchange players based on skills. Institutional class rules enforce that value disparities must be compensated with credit points.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Institutional Parity Rules Active
          </span>
        </div>
      </div>

      {tradeMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            tradeMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {tradeMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{tradeMessage.text}</span>
          </div>
          <button onClick={() => setTradeMessage(null)} className="text-slate-500 hover:text-slate-800 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN TRADING WORKSPACE: 2 FRANCHISES SIDE BY SIDE                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* TEAM A COLUMN (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Franchise 1
              </span>
              <span className="text-xs font-bold text-slate-700">
                Budget: <strong className="text-slate-900">{teamA?.credits_remaining ?? 0}c</strong>
              </span>
            </div>

            {/* Team A Select */}
            <select
              value={teamAId}
              onChange={e => setTeamAId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} disabled={t.id === teamBId}>
                  {t.name} ({t.members.length} members, {t.credits_remaining}c)
                </option>
              ))}
            </select>

            {/* Player Selection from Team A */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Select Player to Offer:
              </span>
              {eligibleMembersA.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                  No trade-eligible members (leader cannot be traded). Acquire members first.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {eligibleMembersA.map(member => {
                    const isSelected = (playerA?.id === member.id);
                    const tier = getPlayerTier(member);
                    return (
                      <button
                        key={member.id}
                        onClick={() => setPlayerAId(member.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <InitialsAvatar name={member.name} size="sm" />
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-900 truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{member.preferred_role}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tier.color}`}>
                            {tier.label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 block mt-0.5">
                            {member.base_price}c
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Player A Spotlight */}
            {playerA && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <InitialsAvatar name={playerA.name} size="md" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{playerA.name}</h4>
                      <p className="text-[11px] text-slate-500">{playerA.preferred_role}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tierA.color}`}>
                    {tierA.label} ({tierA.desc})
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    6-Axis Capability Distribution
                  </span>
                  <SkillRadarChart dimensions={playerA.radar_dimensions} size="sm" color="#2563eb" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE EXCHANGE & RULES COLUMN (2 cols) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col items-center justify-center pt-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
            <ArrowLeftRight className="w-6 h-6" />
          </div>

          {/* Sweetener Adjustment Input */}
          <div className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Credit Point Offset
            </span>
            <p className="text-[10px] text-slate-500">
              Positive: Team B pays Team A<br />Negative: Team A pays Team B
            </p>
            <div className="flex items-center space-x-1 justify-center">
              <input
                type="number"
                value={creditSweetener}
                onChange={e => setCreditSweetener(Number(e.target.value))}
                className="w-20 px-2 py-1.5 text-center text-xs font-bold border border-slate-300 rounded-lg bg-slate-50"
              />
              <span className="text-xs font-semibold text-slate-600">pts</span>
            </div>

            {/* Quick Auto-Balance Button */}
            {evaluation?.recommended_sweetener !== undefined && evaluation.recommended_sweetener !== 0 && (
              <button
                onClick={() => setCreditSweetener(evaluation.recommended_sweetener)}
                className="mt-1 w-full py-1 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200 transition-colors"
                title="Sets credit offset to perfectly balance the exchange value"
              >
                Auto-Balance ({evaluation.recommended_sweetener > 0 ? `+${evaluation.recommended_sweetener}` : evaluation.recommended_sweetener}c)
              </button>
            )}
          </div>

          {/* Execute Trade Button */}
          <button
            onClick={handleExecuteTrade}
            disabled={!evaluation?.valid || isExecuting}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
          >
            {isExecuting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>CONFIRM TRADE</span>
              </>
            )}
          </button>
        </div>

        {/* TEAM B COLUMN (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Franchise 2
              </span>
              <span className="text-xs font-bold text-slate-700">
                Budget: <strong className="text-slate-900">{teamB?.credits_remaining ?? 0}c</strong>
              </span>
            </div>

            {/* Team B Select */}
            <select
              value={teamBId}
              onChange={e => setTeamBId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} disabled={t.id === teamAId}>
                  {t.name} ({t.members.length} members, {t.credits_remaining}c)
                </option>
              ))}
            </select>

            {/* Player Selection from Team B */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Select Player to Offer:
              </span>
              {eligibleMembersB.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                  No trade-eligible members (leader cannot be traded). Acquire members first.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {eligibleMembersB.map(member => {
                    const isSelected = (playerB?.id === member.id);
                    const tier = getPlayerTier(member);
                    return (
                      <button
                        key={member.id}
                        onClick={() => setPlayerBId(member.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-purple-50/80 border-purple-400 ring-1 ring-purple-400'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <InitialsAvatar name={member.name} size="sm" />
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-900 truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{member.preferred_role}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tier.color}`}>
                            {tier.label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 block mt-0.5">
                            {member.base_price}c
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Player B Spotlight */}
            {playerB && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <InitialsAvatar name={playerB.name} size="md" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{playerB.name}</h4>
                      <p className="text-[11px] text-slate-500">{playerB.preferred_role}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tierB.color}`}>
                    {tierB.label} ({tierB.desc})
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    6-Axis Capability Distribution
                  </span>
                  <SkillRadarChart dimensions={playerB.radar_dimensions} size="sm" color="#8b5cf6" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INSTITUTIONAL PARITY & CLASS RULES STATUS BOX                             */}
      {/* ========================================================================= */}
      {evaluation && (
        <div className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
          evaluation.valid
            ? 'bg-white border-emerald-300'
            : 'bg-white border-rose-300'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              {evaluation.valid ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm text-slate-900">{evaluation.status}</h3>
                <p className="text-xs text-slate-500">{evaluation.reason}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="font-medium text-slate-500">Fairness Rating:</span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-900 font-black text-sm border border-slate-200">
                {evaluation.fairness_score}%
              </span>
            </div>
          </div>

          {/* Class Rule Explanation Note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-700">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Institutional Class Trading Rules:</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              &bull; <strong>Direct Match:</strong> Players in the same skill tier ({tierA.label} vs {tierB.label}) can trade with zero or minimal offset.<br />
              &bull; <strong>Disparity Compensation:</strong> If trading across tiers (e.g. Moderate player for Elite player), the team receiving the higher-tier player must compensate with credit points to satisfy fairness standards. Disparities over 40c without compensation are automatically vetoed.
            </p>
          </div>

          {/* Projected Impact on Team Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>{evaluation.team_a_impact.team_name} Impact:</span>
                <span className={evaluation.team_a_impact.delta_balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {evaluation.team_a_impact.delta_balance >= 0 ? `+${evaluation.team_a_impact.delta_balance}` : evaluation.team_a_impact.delta_balance} pts balance
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Credits: {evaluation.team_a_impact.credits_before}c &rarr; {evaluation.team_a_impact.credits_after}c
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>{evaluation.team_b_impact.team_name} Impact:</span>
                <span className={evaluation.team_b_impact.delta_balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {evaluation.team_b_impact.delta_balance >= 0 ? `+${evaluation.team_b_impact.delta_balance}` : evaluation.team_b_impact.delta_balance} pts balance
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Credits: {evaluation.team_b_impact.credits_before}c &rarr; {evaluation.team_b_impact.credits_after}c
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRADE AUDIT HISTORY                                                       */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Recorded Trades Audit Log ({tradeHistory.length} Exchanges)
          </h3>
        </div>

        {tradeHistory.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No trades executed yet during this session.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {tradeHistory.slice().reverse().map((t, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{t.team_a_name}</span>
                  <span className="text-slate-400">({t.player_a_name})</span>
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-bold text-slate-900">{t.team_b_name}</span>
                  <span className="text-slate-400">({t.player_b_name})</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-500">
                  {t.credit_sweetener !== 0 && (
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                      Offset: {t.credit_sweetener > 0 ? `+${t.credit_sweetener}` : t.credit_sweetener}c
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">{t.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
