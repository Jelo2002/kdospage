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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <div className="flex items-center gap-3.5">
          <SkinAvatar ign={staffName || 'User'} size={44} />
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Evaluator Workspace
            </div>
            <h1 className="text-lg font-semibold text-zinc-100">
              Welcome back, <span className="font-mono">{staffName}</span>
            </h1>
            <p className="text-xs text-zinc-500">
              Status: <span className="text-emerald-400 font-medium">{currentStatus}</span>
            </p>
          </div>
        </div>

        <Link
          href="/interview"
          className="px-3.5 py-2 rounded-md text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition-colors flex items-center justify-center gap-1.5 shadow-sm self-start sm:self-auto"
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
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Recent Evaluations Index
            </h2>
            <Link href="/interview" className="text-xs text-zinc-400 hover:text-zinc-200">
              + New Scorecard
            </Link>
          </div>

          <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Loading recent evaluations...
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No evaluations recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60 text-xs">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 hover:bg-zinc-900/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SkinAvatar ign={c.ign} size={28} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">
                            {c.ign}
                          </span>
                          <span className="font-mono text-[11px] text-amber-300">
                            {c.rating}.0 ★
                          </span>
                          <span
                            className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                              c.status === 'accepted'
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                : c.status === 'rejected'
                                ? 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                                : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5 max-w-sm">
                          {c.notes || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment Standards */}
          <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800 space-y-2 text-xs">
            <span className="font-semibold text-zinc-300">Standardized Scoring Rubric</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1">
              <div>
                <strong className="text-zinc-200">5.0 ★ Strong Hire</strong>: Outstanding portfolio, leadership maturity.
              </div>
              <div>
                <strong className="text-zinc-200">4.0 ★ Recommended</strong>: Strong candidate, clear microphone, rule-aligned.
              </div>
              <div>
                <strong className="text-zinc-200">3.0 ★ Baseline</strong>: Satisfactory baseline, requires consensus.
              </div>
              <div>
                <strong className="text-zinc-200">1.0-2.0 ★ Disqualified</strong>: Inappropriate conduct, rule defiance.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Duty & Leave Scheduling */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 space-y-3 text-xs">
            <span className="font-semibold text-zinc-200 block">Duty & Availability</span>

            {statusMessage && (
              <div className="p-2 rounded bg-zinc-800 text-zinc-200 text-xs">
                {statusMessage}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Evaluator Identifier
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                Current Availability Status
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['Active', 'LOA', 'Hiatus'] as StaffStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateMyStatus(st)}
                    className={`py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      currentStatus === st
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {currentStatus === 'LOA' && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/60 animate-fade-in">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-0.5">Return Date</label>
                  <input
                    type="date"
                    value={loaReturnDate}
                    onChange={(e) => setLoaReturnDate(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-0.5">Reason for Absence</label>
                  <textarea
                    rows={2}
                    value={loaReason}
                    onChange={(e) => setLoaReason(e.target.value)}
                    placeholder="e.g. Travel, exams..."
                    className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs placeholder-zinc-600"
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
