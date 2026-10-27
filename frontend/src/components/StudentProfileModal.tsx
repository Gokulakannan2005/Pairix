import React, { useEffect, useState } from 'react';
import { X, Award, Briefcase, Code, Sparkles, Compass, CheckCircle2, TrendingUp, Layers } from 'lucide-react';
import { Student } from '../types';
import { InitialsAvatar } from './InitialsAvatar';
import { api } from '../services/api';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Props {
  student: Student | null;
  onClose: () => void;
  onNominate?: (studentId: string) => void;
  isAvailable?: boolean;
}

export const StudentProfileModal: React.FC<Props> = ({
  student,
  onClose,
  onNominate,
  isAvailable = false,
}) => {
  const [similarStudents, setSimilarStudents] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (!student) return;
    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        const data = await api.getStudentDetail(student.id);
        setSimilarStudents(data.similar_students || []);
      } catch (err) {
        console.error('Failed to load similar students:', err);
      } finally {
        setLoadingSimilar(false);
      }
    };
    fetchSimilar();
  }, [student]);

  if (!student) return null;

  const radarData = student.radar_dimensions
    ? Object.entries(student.radar_dimensions).map(([key, val]) => ({
        subject: key,
        value: Math.round(val * 100),
      }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <InitialsAvatar name={student.name} size="lg" />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {student.archetype || 'Generalist'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                {student.register_no} • {student.department}
              </p>
              <div className="flex items-center space-x-3 mt-2 text-xs font-medium text-slate-500">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                  Role: <strong className="text-slate-800">{student.preferred_role}</strong>
                </span>
                {student.cgpa && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                    CGPA: <strong className="text-slate-800">{student.cgpa}</strong>
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Base Value: <strong>{student.base_price} Credits</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAvailable && onNominate && (
              <button
                onClick={() => {
                  onNominate(student.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Nominate to Auction
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Grid: Skills + Radar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technical Skills */}
            <div className="card-base p-5 bg-white">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-4">
                <Code className="w-4 h-4 text-blue-600" />
                <span>Technical Skills & Proficiency</span>
              </h3>
              <div className="space-y-3">
                {student.technical_skills.map((skill, i) => {
                  const level = student.skill_levels[skill] || 'Intermediate';
                  const pct = level.toLowerCase() === 'expert' ? 95 : level.toLowerCase() === 'advanced' ? 85 : 65;
                  return (
                    <div key={i} className="text-xs">
                      <div className="flex justify-between font-medium text-slate-700 mb-1">
                        <span>{skill}</span>
                        <span className="text-slate-500 font-normal">{level}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Base Price Breakdown */}
              {student.base_price_breakdown && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Base Valuation Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    {Object.entries(student.base_price_breakdown).map(([k, v]) => (
                      <div key={k} className="flex justify-between bg-slate-50 p-1.5 rounded-md">
                        <span>{k}</span>
                        <span className="font-semibold text-slate-800">+{v} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Radar Dimensions */}
            <div className="card-base p-5 bg-white flex flex-col items-center justify-center">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-2 self-start">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Multidimensional Skill Vector</span>
              </h3>
              <p className="text-xs text-slate-500 self-start mb-3">
                Aggregated 6-axis capability profile normalized for team complementarity
              </p>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" tick={false} />
                    <Radar
                      name={student.name}
                      dataKey="value"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Projects & Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Projects */}
            <div className="card-base p-5 bg-white">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-3">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Projects Portfolio</span>
              </h3>
              {student.projects.length === 0 ? (
                <p className="text-xs text-slate-400">No project details specified.</p>
              ) : (
                <ul className="space-y-2">
                  {student.projects.map((p, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start space-x-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Achievements & Certifications */}
            <div className="card-base p-5 bg-white">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-3">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Achievements & Hackathons</span>
              </h3>
              <div className="mb-3 flex items-center space-x-2">
                <span className="badge-tag bg-amber-50 text-amber-800 border border-amber-200">
                  {student.hackathons} Competitive Hackathons
                </span>
                <span className="badge-tag bg-slate-100 text-slate-700 border border-slate-200">
                  Comm: {student.communication}/10
                </span>
                <span className="badge-tag bg-slate-100 text-slate-700 border border-slate-200">
                  Lead: {student.leadership}/10
                </span>
              </div>
              <ul className="space-y-2">
                {student.achievements.map((a, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
                {student.certifications.map((c, idx) => (
                  <li key={`cert-${idx}`} className="text-xs text-slate-600 flex items-start space-x-2">
                    <Award className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cosine Similarity: Similar Students */}
          <div className="card-base p-5 bg-white border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Mathematically Similar Students (Cosine Similarity Analysis)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Identified using high-dimensional cosine similarity across 16 engineered skill features:
            </p>

            {loadingSimilar ? (
              <p className="text-xs text-slate-400">Computing vector similarities...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {similarStudents.map((sim, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center space-x-2.5 mb-1.5">
                      <InitialsAvatar name={sim.name} size="sm" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{sim.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{sim.preferred_role}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-purple-700 mt-2">
                      <span>Similarity</span>
                      <span>{sim.similarity_percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
