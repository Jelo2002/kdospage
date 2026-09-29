'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRole } from '@/components/RoleContext';
import { Candidate, StaffStatus } from '@/lib/types';
import SkinAvatar from '@/components/SkinAvatar';
import { 
  ClipboardCheck, 
  ArrowRight, 
  UserCheck, 
  Clock, 
  Calendar,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export default function StaffPortalPage() {
  const { staffName, setStaffName } = useRole();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // My Status state
  const [currentStatus, setCurrentStatus] = useState<StaffStatus>('Active');
  const [loaReason, setLoaReason] = useState('');
  const [loaReturnDate, setLoaReturnDate] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetch('/api/candidates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.candidates)) {
          setCandidates(data.candidates.slice(0, 10));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [staffName]);

  const handleUpdateMyStatus = (newStatus: StaffStatus) => {
    setCurrentStatus(newStatus);
    setStatusMessage(`Availability updated to ${newStatus}.`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <SkinAvatar ign={staffName || 'User'} size={44} />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Evaluator Workspace
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Welcome back, <span className="font-mono text-emerald-700">{staffName}</span>
            </h1>
            <p className="text-xs text-slate-500">
              Status: <span className="text-emerald-700 font-semibold">{currentStatus}</span>
            </p>
          </div>
        </div>

        <Link
          href="/interview"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Launch Candidate Scorecard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Evaluations (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recent Evaluations Index
            </h2>
            <Link href="/interview" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold">
              + New Scorecard
            </Link>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading recent evaluations...
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No evaluations recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SkinAvatar ign={c.ign} size={28} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {c.ign}
                          </span>
                          <span className="font-mono text-[11px] text-amber-600 font-semibold">
                            {c.rating}.0 ★
                          </span>
                          <span
                            className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                              c.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5 max-w-sm">
                          {c.notes || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment Standards */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-800">Standardized Scoring Rubric</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div>
                <strong className="text-slate-900">5.0 ★ Strong Hire</strong>: Outstanding portfolio, leadership maturity.
              </div>
              <div>
                <strong className="text-slate-900">4.0 ★ Recommended</strong>: Strong candidate, clear microphone, rule-aligned.
              </div>
              <div>
                <strong className="text-slate-900">3.0 ★ Baseline</strong>: Satisfactory baseline, requires consensus.
              </div>
              <div>
                <strong className="text-slate-900">1.0-2.0 ★ Disqualified</strong>: Inappropriate conduct, rule defiance.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Duty & Leave Scheduling */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
            <span className="font-bold text-slate-800 block text-xs">Duty & Availability</span>

            {statusMessage && (
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                {statusMessage}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Evaluator Identifier
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Current Availability Status
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['Active', 'LOA', 'Hiatus'] as StaffStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateMyStatus(st)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      currentStatus === st
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {currentStatus === 'LOA' && (
              <div className="space-y-2 pt-2 border-t border-slate-100 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Return Date</label>
                  <input
                    type="date"
                    value={loaReturnDate}
                    onChange={(e) => setLoaReturnDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Reason for Absence</label>
                  <textarea
                    rows={2}
                    value={loaReason}
                    onChange={(e) => setLoaReason(e.target.value)}
                    placeholder="e.g. Travel, exams..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
