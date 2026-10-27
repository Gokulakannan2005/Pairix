import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Play, Pause, RotateCcw, ChevronRight, Zap, CheckCircle2,
  AlertTriangle, Sparkles, Layers, DollarSign, Award, ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuctionState, TeamFitBreakdown, Student, Team } from '../types';
import { InitialsAvatar } from '../components/InitialsAvatar';
import { SkillRadarChart } from '../components/SkillRadarChart';
import { api } from '../services/api';

interface Props {
  auctionState: AuctionState | null;
  onRefresh: () => void;
  onOpenStudentProfile: (student: Student) => void;
}

export const AuctionArenaPage: React.FC<Props> = ({
  auctionState,
  onRefresh,
  onOpenStudentProfile,
}) => {
  const [teamFits, setTeamFits] = useState<TeamFitBreakdown[]>([]);
  const [activeLeaderTeamId, setActiveLeaderTeamId] = useState<string>('');
  const [customBidAmount, setCustomBidAmount] = useState<number>(0);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');
  
  // Clean, dedicated Timer state
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [timerLeft, setTimerLeft] = useState<number>(25);
  const previousStudentIdRef = useRef<string | null>(null);

  const currentStudent = auctionState?.current_student || null;
  const currentBid = auctionState?.current_bid || 0;
  const highestBidderName = auctionState?.highest_bidder_team_name;
  const teams = auctionState?.teams || [];

  // Default active bidding team
  useEffect(() => {
    if (teams.length > 0 && !activeLeaderTeamId) {
      setActiveLeaderTeamId(teams[0].id);
    }
  }, [teams, activeLeaderTeamId]);

  // When candidate changes: reset bid amount, reset timer, and auto-start timer
  useEffect(() => {
    if (currentStudent) {
      const minNext = auctionState?.highest_bidder_team_id
        ? currentBid + 5
        : currentStudent.base_price;
      setCustomBidAmount(minNext);

      // Only reset timer when a DIFFERENT candidate arrives on the block
      if (previousStudentIdRef.current !== currentStudent.id) {
        setTimerLeft(25);
        setIsTimerRunning(true);
        previousStudentIdRef.current = currentStudent.id;
      }
    } else {
      setIsTimerRunning(false);
      previousStudentIdRef.current = null;
    }
  }, [currentStudent?.id]);

  // Fetch ML team fits whenever active student changes
  useEffect(() => {
    if (!currentStudent) {
      setTeamFits([]);
      return;
    }
    const loadFits = async () => {
      try {
        const fits = await api.getAuctionFits();
        setTeamFits(fits);
      } catch (err) {
        console.error('Failed to load team fits:', err);
      }
    };
    loadFits();
  }, [currentStudent?.id]);

  // Clean timer countdown: depends solely on isTimerRunning
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimerLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Timer controls
  const handleToggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      // If timer is at 0, reset to 25s before restarting
      if (timerLeft <= 0) {
        setTimerLeft(25);
      }
      setIsTimerRunning(true);
    }
  };

  const handleResetTimer = (seconds: number = 25) => {
    setTimerLeft(seconds);
    setIsTimerRunning(false);
  };

  // Place Bid Handler
  const handlePlaceBid = async (amount: number) => {
    if (!activeLeaderTeamId) return;
    setLoadingAction(true);
    setActionError('');
    try {
      await api.placeBid(activeLeaderTeamId, amount);
      // Give 15 seconds after a new bid so other teams can respond
      setTimerLeft(prev => Math.max(prev, 15));
      setIsTimerRunning(true);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Bid rejected');
    } finally {
      setLoadingAction(false);
    }
  };

  // Simulate Counter-Bid from AI Team
  const handleSimulateBid = async () => {
    setLoadingAction(true);
    setActionError('');
    try {
      const res = await api.simulateCompetingBid();
      if (!res.success) {
        setActionError(res.message);
      } else {
        setTimerLeft(prev => Math.max(prev, 15));
        setIsTimerRunning(true);
        onRefresh();
      }
    } catch (err: any) {
      setActionError(err.message || 'Simulation failed');
    } finally {
      setLoadingAction(false);
    }
  };

  // Award / Sold Handler with Confetti
  const handleMarkSold = async () => {
    setLoadingAction(true);
    setActionError('');
    try {
      const res = await api.soldCurrentStudent();
      if (res.success && res.team_name) {
        try {
          confetti({
            particleCount: 110,
            spread: 85,
            origin: { y: 0.55 },
            colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'],
          });
        } catch {
          // safety fallback
        }
      }
      setIsTimerRunning(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to complete acquisition');
    } finally {
      setLoadingAction(false);
    }
  };

  // Pass Candidate Handler
  const handlePass = async () => {
    setLoadingAction(true);
    setActionError('');
    try {
      await api.passCurrentStudent();
      setIsTimerRunning(false);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to pass student');
    } finally {
      setLoadingAction(false);
    }
  };

  // Nominate candidate from queue
  const handleNominate = async (studentId: string) => {
    try {
      await api.nominateStudent(studentId);
      setTimerLeft(25);
      setIsTimerRunning(true);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to nominate student');
    }
  };

  const activeLeaderObj = teams.find(t => t.id === activeLeaderTeamId);

  return (
    <div className="space-y-6">
      {/* Error alert if any */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-600 hover:text-rose-900 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP SECTION: CANDIDATE ON AUCTION BLOCK & AUCTIONEER DESK                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Top Header Bar with Timer & Status */}
        <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Live Draft Room &bull; Auction Block
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentStudent ? `Bidding open for ${currentStudent.name}` : 'Awaiting candidate nomination'}
              </p>
            </div>
          </div>

          {/* Teacher Timer Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Countdown Badge */}
            <div
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm border shadow-xs transition-colors ${
                timerLeft === 0
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : timerLeft <= 5
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : timerLeft <= 10
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-800 border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-600" />
              <span>{timerLeft}s</span>
              <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-slate-600">
                {timerLeft === 0
                  ? auctionState?.highest_bidder_team_id
                    ? "Time's Up - Award"
                    : "Time's Up"
                  : timerLeft <= 5
                  ? 'Going Twice!'
                  : timerLeft <= 10
                  ? 'Going Once!'
                  : isTimerRunning
                  ? 'Active'
                  : 'Paused'}
              </span>
            </div>

            {/* Start / Pause / Restart Button */}
            <button
              onClick={handleToggleTimer}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors ${
                timerLeft === 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : isTimerRunning
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={timerLeft === 0 ? 'Restart timer' : isTimerRunning ? 'Pause countdown' : 'Start countdown'}
            >
              {timerLeft === 0 ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Timer</span>
                </>
              ) : isTimerRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{timerLeft < 25 ? 'Resume' : 'Start Timer'}</span>
                </>
              )}
            </button>

            {/* Reset to 25s Button */}
            <button
              onClick={() => handleResetTimer(25)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
              title="Reset timer to 25s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Auction Arena Body */}
        {currentStudent ? (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Player Identity, Skills & Hexagonal Radar Chart (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <InitialsAvatar name={currentStudent.name} size="xl" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {currentStudent.name}
                      </h3>
                      {currentStudent.archetype && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                          {currentStudent.archetype}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {currentStudent.register_no} &bull; {currentStudent.department}
                    </p>
                    <div className="mt-1.5 flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-xs">
                        {currentStudent.preferred_role}
                      </span>
                      {currentStudent.cgpa && (
                        <span className="text-xs text-slate-500 font-medium">
                          CGPA: <strong className="text-slate-800">{currentStudent.cgpa}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenStudentProfile(currentStudent)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center space-x-1"
                >
                  <span>Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Technical Expertise
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentStudent.technical_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hexagonal Skill Distribution Chart & Experience Grid */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    6-Axis Capability Radar
                  </span>
                  <SkillRadarChart
                    dimensions={currentStudent.radar_dimensions}
                    size="md"
                    color="#2563eb"
                  />
                </div>

                <div className="w-full sm:w-auto flex-1 space-y-2.5 text-xs text-slate-600 pl-0 sm:pl-4 sm:border-l border-slate-200">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Starting Base Value:</span>
                    <strong className="text-slate-900 font-bold">{currentStudent.base_price} Credits</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Hackathons Won/Entered:</span>
                    <strong className="text-slate-900 font-semibold">{currentStudent.hackathons} events</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Communication Score:</span>
                    <strong className="text-slate-900 font-semibold">{currentStudent.communication} / 10</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Leadership Rating:</span>
                    <strong className="text-slate-900 font-semibold">{currentStudent.leadership} / 10</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Auctioneer Settings & Bidding Desk (6 cols) */}
            <div className="lg:col-span-6 space-y-5 lg:pl-6 lg:border-l border-slate-200">
              
              {/* Current Highest Bid Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Current Highest Bid
                  </span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                      {currentBid}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">Credits</span>
                  </div>
                </div>

                <div className="text-right sm:text-right w-full sm:w-auto">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Highest Bidder
                  </span>
                  <span className="inline-block mt-1 px-3 py-1 rounded-lg bg-white/10 text-white font-bold text-xs border border-white/15">
                    {highestBidderName ? highestBidderName : 'Base Opening Price'}
                  </span>
                </div>
              </div>

              {/* Bidding On Behalf Of: Team Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    Bid On Behalf Of Team:
                  </span>
                  <span className="text-slate-500 font-medium">
                    Available: <strong className="text-slate-900">{activeLeaderObj?.credits_remaining ?? 0}c</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {teams.map(t => {
                    const isSelected = activeLeaderTeamId === t.id;
                    const isFull = t.members.length >= t.max_members;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveLeaderTeamId(t.id)}
                        disabled={isFull}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        } ${isFull ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color_accent }} />
                          <span className="text-xs font-bold truncate">{t.name}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 block mt-1">
                          {t.credits_remaining}c
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Increment Controls */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Bid Increments
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 25, 50].map(inc => {
                    const targetAmt = (auctionState?.highest_bidder_team_id ? currentBid : (currentStudent?.base_price || 100)) + inc;
                    const canAfford = (activeLeaderObj?.credits_remaining || 0) >= targetAmt;
                    return (
                      <button
                        key={inc}
                        onClick={() => handlePlaceBid(targetAmt)}
                        disabled={loadingAction || !canAfford}
                        className="py-2.5 px-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-98 text-xs font-bold text-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-center"
                      >
                        +{inc} ({targetAmt}c)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Bid Input (Clean Addon Layout without Text Overlap) */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 flex rounded-xl border border-slate-300 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 shadow-xs">
                  <span className="bg-slate-50 text-slate-500 px-3 py-2 text-xs font-bold border-r border-slate-200 flex items-center select-none">
                    Credits
                  </span>
                  <input
                    type="number"
                    value={customBidAmount}
                    onChange={e => setCustomBidAmount(Number(e.target.value))}
                    min={currentBid + 1}
                    max={activeLeaderObj?.credits_remaining || 1000}
                    className="w-full px-3 py-2 text-sm font-bold bg-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => handlePlaceBid(customBidAmount)}
                  disabled={
                    loadingAction ||
                    customBidAmount <= currentBid ||
                    (activeLeaderObj?.credits_remaining || 0) < customBidAmount
                  }
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
                >
                  <span>PLACE BID</span>
                </button>
              </div>

              {/* Strategic Actions: Simulate Bid, Pass, Sold / Award */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                <button
                  onClick={handleSimulateBid}
                  disabled={loadingAction}
                  className="py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
                  title="Simulates an intelligent counter-bid from one of the other franchises based on ML fit"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Simulate Bid</span>
                </button>

                <button
                  onClick={handlePass}
                  disabled={loadingAction}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                >
                  PASS
                </button>

                <button
                  onClick={handleMarkSold}
                  disabled={loadingAction || !auctionState?.highest_bidder_team_id}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AWARD / SOLD</span>
                </button>
              </div>

              {/* Compact Live Activity Ticker */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Draft Room Log
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1 text-xs pr-1">
                  {auctionState?.recent_activities.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">Awaiting first bid activity...</p>
                  ) : (
                    auctionState?.recent_activities.slice().reverse().slice(0, 4).map(act => (
                      <div
                        key={act.id}
                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                      >
                        <span className="truncate text-slate-700">{act.commentary}</span>
                        {act.bid_amount > 0 && (
                          <span className="font-bold text-slate-900 shrink-0 ml-2">{act.bid_amount}c</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <p className="text-base font-bold text-slate-700">No candidate currently on the block.</p>
            <p className="text-xs text-slate-500">
              Select any candidate from the queue below to start the bidding round.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: THE 4 TEAMS (LISTED BELOW WITH REAL-TIME CAPABILITIES)     */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Franchise Teams &bull; Live Roster &amp; Balance</span>
            </h3>
            <p className="text-xs text-slate-500">
              Teams update instantly upon each bid and acquisition
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {teams.length} Franchises Competing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map(team => {
            const fit = teamFits.find(f => f.team_id === team.id);
            const isLeadingBidder = auctionState?.highest_bidder_team_id === team.id;
            const isFull = team.members.length >= team.max_members;

            return (
              <div
                key={team.id}
                className={`card-base p-4 bg-white flex flex-col justify-between space-y-3 transition-all ${
                  isLeadingBidder
                    ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/20 shadow-sm'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Team Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color_accent }} />
                      <h4 className="font-bold text-sm text-slate-900 truncate">{team.name}</h4>
                    </div>
                    {isLeadingBidder && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Leading Bid
                      </span>
                    )}
                  </div>

                  {/* Credits & Roster Slots */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Credits</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {team.credits_remaining} <span className="text-[10px] font-normal text-slate-500">c</span>
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Roster</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {team.members.length} / {team.max_members}
                      </span>
                    </div>
                  </div>

                  {/* Team Balance Score */}
                  <div className="mt-2.5">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-500 font-medium">Balance Score:</span>
                      <strong className="text-slate-900 font-bold">{team.balance_score} pts</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, team.balance_score)}%`,
                          backgroundColor: team.color_accent,
                        }}
                      />
                    </div>
                  </div>

                  {/* Candidate ML Fit Preview for this specific team */}
                  {fit && (
                    <div className="mt-3 p-2 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-blue-700">Fit Compatibility:</span>
                        <span className="font-black text-blue-900">{fit.fit_score}%</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-600">
                        <span>Projected Balance:</span>
                        <strong className="text-emerald-700 font-bold">
                          +{fit.delta_balance_score} pts
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Member Avatars */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Current Roster
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {team.members.map(member => (
                        <div
                          key={member.id}
                          onClick={() => onOpenStudentProfile(member)}
                          className="cursor-pointer group relative"
                          title={`${member.name} (${member.preferred_role})`}
                        >
                          <InitialsAvatar name={member.name} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Action: Bid as this team */}
                <button
                  onClick={() => {
                    setActiveLeaderTeamId(team.id);
                    const nextBid = currentBid + 5;
                    if (team.credits_remaining >= nextBid) {
                      handlePlaceBid(nextBid);
                    }
                  }}
                  disabled={loadingAction || isFull || team.credits_remaining < currentBid + 5}
                  className="w-full py-1.5 px-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                >
                  <span>Quick Bid (+5c)</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUEUE: REMAINING CANDIDATES WAITING TO ENTER THE BLOCK                   */}
      {/* ========================================================================= */}
      <div className="card-base p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Candidate Queue ({auctionState?.available_students.length || 0} Candidates Available)
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Click any candidate to bring them to the top auction block
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {auctionState?.available_students.slice(0, 12).map(s => {
            const isCurrent = s.id === currentStudent?.id;
            return (
              <div
                key={s.id}
                onClick={() => handleNominate(s.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <InitialsAvatar name={s.name} size="sm" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{s.preferred_role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">{s.base_price}c</span>
                  <span className="text-blue-600 font-bold hover:underline">Select &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
