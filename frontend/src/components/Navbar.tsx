import React from 'react';
import { Gavel, Users, ArrowLeftRight, ShieldCheck, BookOpen, RefreshCw } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetDemo: () => void;
  isResetting: boolean;
  activeStudentName?: string;
  teamsCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onResetDemo,
  isResetting,
  activeStudentName,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer shrink-0"
            onClick={() => setActiveTab('arena')}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">Pairix</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Draft
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Team Formation Platform</p>
            </div>
          </div>

          {/* Simple, Streamlined Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('arena')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'arena'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="relative">
                <Gavel className="w-3.5 h-3.5" />
                {activeStudentName && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span>Auction</span>
            </button>

            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'teams'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Teams</span>
            </button>

            <button
              onClick={() => setActiveTab('trading')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'trading'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
              <span>Trading</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'students'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Players</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'guide'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Guide</span>
            </button>
          </nav>

          {/* Right Action: Reset Session */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onResetDemo}
              disabled={isResetting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors disabled:opacity-50"
              title="Restores candidate pool, teams, credits, and draft history"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset Draft</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
