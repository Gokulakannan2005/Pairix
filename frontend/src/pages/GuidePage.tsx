import React, { useState } from 'react';
import { BookOpen, Gavel, Cpu, ArrowLeftRight, Database, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';

export const GuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'auction' | 'radar' | 'trading' | 'database'>('quickstart');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pairix Operational Guide &amp; Tutorial</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive reference manual for teachers, tournament adjudicators, and students
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'quickstart', label: '1. Quick Start & Tutorial', icon: BookOpen },
          { id: 'auction', label: '2. Auction Protocol', icon: Gavel },
          { id: 'radar', label: '3. 6-Axis Skill Radar', icon: Cpu },
          { id: 'trading', label: '4. Trading & Class Rules', icon: ArrowLeftRight },
          { id: 'database', label: '5. Data & Storage', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= SECTION 1: QUICK START ================= */}
      {activeTab === 'quickstart' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Overview of Pairix</h2>
            <p>
              Pairix is an algorithmic team formation and skill auction platform designed for university capstone courses, hackathons, and research cohorts. Rather than forming teams through subjective social familiarity, Pairix structures team assembly into an algorithmic draft where franchises allocate virtual credits based on multi-dimensional skill complementarity.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Step-by-Step Tutorial for Teachers</h3>
            <ol className="list-decimal pl-5 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-800">Review Candidate Roster:</strong> Navigate to the <em>Talent</em> tab to inspect candidates, their core skills, experience, and their 6-axis hexagonal capability radars.
              </li>
              <li>
                <strong className="text-slate-800">Launch Draft in Auction Room:</strong> Open the <em>Auction</em> tab. The top block features the candidate currently on the block along with auctioneer controls.
              </li>
              <li>
                <strong className="text-slate-800">Start the Countdown Timer:</strong> Press the <em>Start Timer</em> button (or select any candidate from the queue). A 25-second countdown begins.
              </li>
              <li>
                <strong className="text-slate-800">Place Bids:</strong> Choose which franchise is bidding using the team selector pills, then click <em>+5</em>, <em>+10</em>, <em>+25</em>, or type a custom credit bid.
              </li>
              <li>
                <strong className="text-slate-800">Simulate Counter-Bids:</strong> Optionally click <em>Simulate Bid</em> to let AI franchises test market competition based on machine learning fit.
              </li>
              <li>
                <strong className="text-slate-800">Award Candidate:</strong> When bidding concludes, press <em>AWARD / SOLD</em>. A confetti celebration confirms acquisition, credits are deducted, rosters update immediately, and the next candidate is loaded.
              </li>
              <li>
                <strong className="text-slate-800">Engage Trading Round:</strong> After initial placements, switch to the <em>Trading</em> tab to allow teams to balance skill gaps according to institutional class rules.
              </li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <strong className="font-bold block">Teacher Note:</strong>
            <p>
              All session progress is automatically persisted. If you ever need to reset the tournament to baseline state, simply click the <strong>Reset</strong> button in the top navigation bar.
            </p>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: AUCTION PROTOCOL ================= */}
      {activeTab === 'auction' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Live Auction Rules &amp; Protocol</h2>
            <p>
              The auction room operates under English ascending bid mechanics with dynamic machine learning complementarity tracking.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Core Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">Opening Base Price</h4>
                <p className="text-xs text-slate-600">
                  Every candidate begins with a calculated Base Price (typically 90-140 credits) derived from CGPA, hackathon accolades, certifications, and communication scores. Opening bids cannot be lower than the base price.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">Bid Minimum Increment</h4>
                <p className="text-xs text-slate-600">
                  Subsequent bids must exceed the current highest bid by at least 5 credits. Teams cannot bid more credits than their currently remaining balance.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">Roster Capacity Limit</h4>
                <p className="text-xs text-slate-600">
                  Each franchise has a maximum roster capacity (default: 5 members, including the team leader). Once a team reaches capacity, it is automatically locked from placing further bids.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">Uncontested Pass</h4>
                <p className="text-xs text-slate-600">
                  If no team places a bid on an active candidate within the countdown window, the teacher can click <em>PASS</em>. The candidate moves to the deferred pool and the next student is queued.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: 6-AXIS RADAR ================= */}
      {activeTab === 'radar' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. 6-Axis Hexagonal Capability Formulation</h2>
            <p>
              To eliminate bias and quantify capability across diverse computing sub-disciplines, Pairix projects every candidate onto a normalized 6-dimensional vector space represented as a regular hexagon:
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900">1. Technical (Algorithms &amp; Core Systems):</strong> Measures data structures, C++, Go, competitive programming, and systems programming depth.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900">2. AI &amp; Machine Learning:</strong> Measures PyTorch, Scikit-learn, Computer Vision (OpenCV/YOLO), NLP, transformers, and data science.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900">3. Development (Full-Stack &amp; Engineering):</strong> Measures React, Node.js, Next.js, APIs, WebSockets, and end-to-end web architecture.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900">4. Design &amp; UI/UX:</strong> Measures Figma, Tailwind CSS, accessibility, micro-interactions, motion design, and user journey prototyping.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900">5. Communication:</strong> Assessed via interview/presentation benchmarks, hackathon pitching, and peer collaboration metrics (1-10 scale).
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900">6. Leadership &amp; Experience:</strong> Quantifies project management (Agile/Scrum), student chapter roles, hackathon wins, and mentorship history.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 4: TRADING & CLASS RULES ================= */}
      {activeTab === 'trading' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Player Trading &amp; Institutional Class Rules</h2>
            <p>
              Trading allows teams to resolve post-auction skill bottlenecks through mutual exchanges. To prevent predatory trades or collusion, Pairix enforces strict institutional class rules:
            </p>
          </div>

          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-800">Tier S</span>
                <h4 className="font-bold text-sm text-amber-950 mt-1">Class S (Elite)</h4>
                <p className="text-xs text-amber-900 mt-1">
                  High-specialist or multi-hackathon winners with advanced domain depth (Valuation: 140c+).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-800">Tier A</span>
                <h4 className="font-bold text-sm text-blue-950 mt-1">Class A (Core)</h4>
                <p className="text-xs text-blue-900 mt-1">
                  Solid performers with proven project deliveries and dependable engineering skills (115c - 139c).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-600">Tier B</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">Class B (Moderate)</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Developing engineers and emerging contributors building foundational capabilities (&lt; 115c).
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-sm text-slate-900">Exchange Fairness Constraints</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong className="text-slate-800">Same-Class Trade:</strong> Direct 1-to-1 exchanges within the same class (Class A for Class A) require zero or minimal credit offset.
                </li>
                <li>
                  <strong className="text-slate-800">Cross-Class Disparity Compensation:</strong> If a team seeks to acquire an Elite player in exchange for a Moderate player, they <em>must</em> compensate the point gap with credit sweetener from their team budget.
                </li>
                <li>
                  <strong className="text-slate-800">Institutional Parity Veto:</strong> Any trade with a net value disparity exceeding 40 credits despite sweetener is automatically blocked by the system.
                </li>
                <li>
                  <strong className="text-slate-800">Franchise Anchor Rule:</strong> Team leaders cannot be traded under any circumstances.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 5: DATABASE & PERSISTENCE ================= */}
      {activeTab === 'database' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-sm text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. Data Persistence &amp; Session Management</h2>
            <p>
              Pairix uses an embedded SQLite database located at <code>backend/data/pairix.db</code> for session history, transaction audit trails, and cohort analytics.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Portable &amp; Zero-Config Setup</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-800">Local Execution:</strong> Pairix does not require external cloud services, API keys, or remote database servers. Everything runs entirely on the host machine.
              </li>
              <li>
                <strong className="text-slate-800">GitHub Portability:</strong> A teammate or evaluator can clone the repository, run <code>run_pairix.bat</code>, and all dependencies are verified and launched automatically.
              </li>
              <li>
                <strong className="text-slate-800">Export Formats:</strong> Sample candidate pools can be downloaded directly in CSV or Excel (XLSX) format from the <em>Analysis &amp; DB</em> tab.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
