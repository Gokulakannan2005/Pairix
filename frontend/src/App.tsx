import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuctionArenaPage } from './pages/AuctionArenaPage';
import { TeamDashboardPage } from './pages/TeamDashboardPage';
import { StudentExplorerPage } from './pages/StudentExplorerPage';
import { TradingRoundPage } from './pages/TradingRoundPage';
import { GuidePage } from './pages/GuidePage';
import { StudentProfileModal } from './components/StudentProfileModal';
import { AuctionState, Student } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('arena');
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const fetchAuctionState = async () => {
    try {
      const state = await api.getAuctionState();
      setAuctionState(state);
    } catch (err) {
      console.error('Failed to load auction state:', err);
    }
  };

  useEffect(() => {
    fetchAuctionState();
    // Poll state periodically for live updates
    const interval = setInterval(fetchAuctionState, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetAuctionDemo();
      await fetchAuctionState();
      setActiveTab('arena');
    } catch (err) {
      console.error('Failed to reset demo:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleNominateStudent = async (studentId: string) => {
    try {
      await api.nominateStudent(studentId);
      await fetchAuctionState();
      setActiveTab('arena');
    } catch (err) {
      console.error('Failed to nominate student:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
        activeStudentName={auctionState?.current_student?.name}
        teamsCount={auctionState?.teams.length || 4}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'arena' && (
          <AuctionArenaPage
            auctionState={auctionState}
            onRefresh={fetchAuctionState}
            onOpenStudentProfile={s => setSelectedStudent(s)}
          />
        )}

        {activeTab === 'teams' && (
          <TeamDashboardPage
            onNominateToAuction={handleNominateStudent}
            onOpenStudentProfile={s => setSelectedStudent(s)}
          />
        )}

        {activeTab === 'trading' && (
          <TradingRoundPage
            teams={auctionState?.teams || []}
            onRefresh={fetchAuctionState}
            onOpenStudentProfile={s => setSelectedStudent(s)}
          />
        )}

        {activeTab === 'students' && (
          <StudentExplorerPage
            onOpenProfile={s => setSelectedStudent(s)}
            onNominateToAuction={handleNominateStudent}
          />
        )}

        {activeTab === 'guide' && <GuidePage />}
      </main>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onNominate={handleNominateStudent}
          isAvailable={auctionState?.available_students.some(s => s.id === selectedStudent.id)}
        />
      )}

      {/* Clean, Simple Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Pairix</span>
            <span>&bull; Algorithmic Team Formation Platform</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
            <span>6-Axis Skill Radar</span>
            <span>&bull;</span>
            <span>Parity Trading</span>
            <span>&bull;</span>
            <span>SQLite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
