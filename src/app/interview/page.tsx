'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRole } from '@/components/RoleContext';
import StarRating from '@/components/StarRating';
import SkinAvatar from '@/components/SkinAvatar';
import { saveCandidateToVault } from '@/lib/backup';
import { 
  ClipboardCheck, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw, 
  ExternalLink,
  FileText,
  User,
  Check,
  ShieldCheck
} from 'lucide-react';

export default function InterviewPage() {
  const { staffName, setStaffName, isOwnerOrDev } = useRole();

  const [ign, setIgn] = useState('');
  const [rating, setRating] = useState<number>(4);
  const [notes, setNotes] = useState('');
  const [interviewerIgn, setInterviewerIgn] = useState(staffName || 'Staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCandidate, setSubmittedCandidate] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVaultSaved, setIsVaultSaved] = useState(false);

  const handleResetForm = () => {
    setIgn('');
    setRating(4);
    setNotes('');
    setSubmittedCandidate(null);
    setErrorMsg('');
    setIsVaultSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!ign.trim()) {
      setErrorMsg('Candidate In-Game Name (IGN) is required.');
      return;
    }

    const evaluator = interviewerIgn.trim() || staffName || 'Staff';
    if (interviewerIgn.trim()) {
      setStaffName(interviewerIgn.trim());
    }

    // Tier 1 Fail-Safe: Immediately secure to client device's persistent local vault
    const localCandidate = {
      id: `c-local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ign: ign.trim(),
      rating,
      notes: notes.trim(),
      interviewer_ign: evaluator,
      status: 'pending' as const,
      tags: [] as string[],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveCandidateToVault(localCandidate);
    setIsVaultSaved(true);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ign: ign.trim(),
          rating,
          notes: notes.trim(),
          interviewer_ign: evaluator,
          tags: [],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Even if server failed, the candidate is saved in local vault!
        setSubmittedCandidate(localCandidate);
        return;
      }

      if (data.candidate) {
        saveCandidateToVault(data.candidate);
        setSubmittedCandidate(data.candidate);
      } else {
        setSubmittedCandidate(localCandidate);
      }
    } catch (err: any) {
      console.warn('Network error during candidate submit, falling back to local vault:', err);
      // Fail-safe: Candidate is secured in browser storage
      setSubmittedCandidate(localCandidate);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Candidate Evaluation Scorecard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record standardized interview metrics, observations, and admission score.
          </p>
        </div>

        {isOwnerOrDev && (
          <Link
            href="/"
            className="text-xs text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 font-semibold transition-colors bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs"
          >
            <span>Candidate Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Success View */}
      {submittedCandidate ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Evaluation Submitted Successfully
              </h2>
              <p className="text-xs text-slate-500">
                Record for <span className="font-mono text-emerald-700 font-semibold">{submittedCandidate.ign}</span> has been indexed with a score of <span className="text-amber-700 font-semibold">{submittedCandidate.rating}.0 / 5.0</span>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkinAvatar ign={submittedCandidate.ign} size={40} className="ring-1 ring-slate-200" />
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {submittedCandidate.ign}
                </div>
                <div className="text-[11px] text-slate-500">
                  Evaluated by <strong className="text-slate-800">{submittedCandidate.interviewer_ign}</strong>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-mono font-bold text-amber-600">
                {submittedCandidate.rating}.0 ★
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                Pending Review
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Preserved in your device&apos;s local offline vault. Auto-syncs to the main operations pipeline.</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Evaluate Next Candidate
            </button>

            <Link
              href="/"
              className="py-2.5 px-4 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              Pipeline Overview
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* The Form */
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Candidate Identification */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Candidate In-Game Name (IGN) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <SkinAvatar ign={ign || 'User'} size={42} className="ring-1 ring-slate-200 shadow-xs" />
              <input
                type="text"
                required
                autoFocus
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                placeholder="e.g. ApplicantUsername"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-semibold transition-all"
              />
            </div>
          </div>

          {/* Section 2: Scorecard Rating (1 to 5 Stars) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Evaluation Score (1.0 to 5.0) <span className="text-rose-500">*</span>
            </label>
            <StarRating
              value={rating}
              onChange={setRating}
              size="md"
              showLabel={true}
            />
          </div>

          {/* Section 3: Assessment Notes */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Assessment Notes & Interview Observations
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail candidate's responses, previous server experience, collaboration maturity, playstyle, and technical capabilities..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 leading-relaxed transition-all"
            />
          </div>

          {/* Section 4: Evaluator Information */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-slate-500">Evaluator:</span>
              <input
                type="text"
                value={interviewerIgn}
                onChange={(e) => setInterviewerIgn(e.target.value)}
                className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 w-40"
              />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Offline Vault Protection Active</span>
            </div>
          </div>

          {/* Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Submitting Scorecard...</span>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                <span>Submit Candidate Scorecard</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
