import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, Award, ArrowUpRight, Compass, LayoutGrid, List } from 'lucide-react';
import { Student } from '../types';
import { InitialsAvatar } from '../components/InitialsAvatar';
import { SkillRadarChart } from '../components/SkillRadarChart';
import { api } from '../services/api';

interface Props {
  onOpenProfile: (student: Student) => void;
  onNominateToAuction: (studentId: string) => void;
}

export const StudentExplorerPage: React.FC<Props> = ({
  onOpenProfile,
  onNominateToAuction,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedArchetype, setSelectedArchetype] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents({
        search,
        role: selectedRole === 'All' ? undefined : selectedRole,
        archetype: selectedArchetype === 'All' ? undefined : selectedArchetype,
      });
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedRole, selectedArchetype]);

  const ROLES = ['All', 'AI / ML Engineer', 'Frontend', 'Backend', 'UI/UX', 'Cybersecurity', 'Mobile', 'Data Analyst', 'DevOps'];
  const ARCHETYPES = ['All', 'ML & Data Specialist', 'Full-Stack Developer', 'UI/UX Designer', 'Security Specialist', 'Product & Team Leader', 'Hackathon Builder'];

  // Helper to determine skill tier badge
  const getTier = (student: Student) => {
    if (student.base_price >= 135 || (student.hackathons >= 3 && (student.cgpa || 0) >= 8.8)) {
      return { label: 'Class S (Elite)', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    if (student.base_price >= 115 || student.hackathons >= 2) {
      return { label: 'Class A (Core)', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
    }
    return { label: 'Class B (Developing)', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Ribbon */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Player Capability Explorer</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Browse candidate capability vectors with 6-axis hexagonal skill distribution charts
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="badge-tag bg-slate-100 text-slate-700 border border-slate-200 text-xs">
              {students.length} Candidates Listed
            </span>
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Structured Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by character name, reg no, or skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {ROLES.map(r => (
              <option key={r} value={r}>Role Filter: {r}</option>
            ))}
          </select>

          <select
            value={selectedArchetype}
            onChange={e => setSelectedArchetype(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {ARCHETYPES.map(a => (
              <option key={a} value={a}>Archetype: {a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= GRID VIEW ================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {students.map(student => {
            const tier = getTier(student);
            return (
              <div
                key={student.id}
                className="card-base card-hover p-4 bg-white border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top: Avatar, Name & Tier */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <InitialsAvatar name={student.name} size="md" />
                      <div>
                        <h3
                          onClick={() => onOpenProfile(student)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate max-w-[140px]"
                        >
                          {student.name}
                        </h3>
                        <p className="text-[10px] text-slate-500">{student.register_no}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.bg}`}>
                      {tier.label.split(' ')[0]}
                    </span>
                  </div>

                  {/* Role & Base Price */}
                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                      {student.preferred_role}
                    </span>
                    <span className="font-bold text-slate-900">
                      {student.base_price} <span className="text-[10px] font-normal text-slate-500">c</span>
                    </span>
                  </div>

                  {/* Hexagonal Radar Chart for Skill Distribution */}
                  <div className="mt-3 p-2 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Skill Distribution
                    </span>
                    <SkillRadarChart
                      dimensions={student.radar_dimensions}
                      size="sm"
                      color="#2563eb"
                      showLabels={true}
                    />
                  </div>

                  {/* Technical Skills */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {student.technical_skills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {student.technical_skills.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 text-[10px]">
                          +{student.technical_skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onOpenProfile(student)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Dossier
                  </button>
                  <button
                    onClick={() => onNominateToAuction(student.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center space-x-1 shadow-xs"
                    title="Nominate candidate into the auction arena"
                  >
                    <span>Nominate</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TABLE VIEW ================= */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase">Player</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase">Role</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase">Skill Radar</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase">Tier</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase">Core Skills</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase">Base Value</th>
                <th className="px-4 py-3 text-right font-bold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(student => {
                const tier = getTier(student);
                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <InitialsAvatar name={student.name} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900 cursor-pointer hover:underline" onClick={() => onOpenProfile(student)}>
                            {student.name}
                          </p>
                          <p className="text-[10px] text-slate-500">{student.register_no}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {student.preferred_role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <SkillRadarChart dimensions={student.radar_dimensions} size="sm" showLabels={false} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.bg}`}>
                        {tier.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {student.technical_skills.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {student.base_price}c
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => onOpenProfile(student)}
                        className="px-2.5 py-1 rounded border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => onNominateToAuction(student.id)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold"
                      >
                        Nominate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
