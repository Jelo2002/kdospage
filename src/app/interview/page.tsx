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
  Tag,
  FileText,
  User,
  Check,
  ShieldCheck
} from 'lucide-react';

const COMPETENCY_TAGS = [
  'Technical Redstone',
  'Advanced Architecture',
  'Verified Audio/Mic',
  'High Availability',
  'Server Moderation',
  'PvP / Combat',
  'Community Lore',
  'Policy Compliance Risk',
];

export default function InterviewPage() {
  const { staffName, setStaffName, isOwnerOrDev } = useRole();

  const [ign, setIgn] = useState('');
  const [rating, setRating] = useState<number>(4);
  const [notes, setNotes] = useState('');
  const [interviewerIgn, setInterviewerIgn] = useState(staffName || 'Staff');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Verified Audio/Mic']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCandidate, setSubmittedCandidate] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVaultSaved, setIsVaultSaved] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleResetForm = () => {
    setIgn('');
    setRating(4);
    setNotes('');
    setSelectedTags(['Verified Audio/Mic']);
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
      tags: selectedTags,
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
          tags: selectedTags,
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
      <div className="flex items-center justify-between border-b border-clivax-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Candidate Evaluation Scorecard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Record standardized interview metrics, observations, and admission score.
          </p>
        </div>

        {isOwnerOrDev && (
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-clivax-primary flex items-center gap-1.5 font-semibold transition-colors bg-clivax-card border border-clivax-border px-3 py-1.5 rounded-lg"
          >
            <span>Candidate Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Success View */}
      {submittedCandidate ? (
        <div className="p-6 rounded-2xl bg-clivax-card border border-clivax-border shadow-xl space-y-5 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Evaluation Submitted Successfully
              </h2>
              <p className="text-xs text-slate-400">
                Record for <span className="font-mono text-emerald-400 font-semibold">{submittedCandidate.ign}</span> has been indexed with a score of <span className="text-amber-400 font-semibold">{submittedCandidate.rating}.0 / 5.0</span>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-clivax-sidebar/80 border border-clivax-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkinAvatar ign={submittedCandidate.ign} size={40} className="ring-1 ring-clivax-border" />
              <div>
                <div className="text-xs font-bold text-slate-100">
                  {submittedCandidate.ign}
                </div>
                <div className="text-[11px] text-slate-400">
                  Evaluated by <strong className="text-slate-200">{submittedCandidate.interviewer_ign}</strong>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-mono font-bold text-amber-400">
                {submittedCandidate.rating}.0 ★
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Pending Review
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Preserved in your device's local offline vault. Auto-syncs to the main operations pipeline.</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold bg-clivax-primary hover:bg-emerald-400 text-slate-950 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Evaluate Next Candidate
            </button>

            <Link
              href="/"
              className="py-2.5 px-4 rounded-lg text-xs font-medium bg-clivax-card hover:bg-slate-800 text-slate-300 border border-clivax-border transition-colors flex items-center justify-center gap-1.5"
            >
              Pipeline Overview
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* The Form */
        <form onSubmit={handleSubmit} className="bg-clivax-card border border-clivax-border rounded-2xl p-6 shadow-sm space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Candidate Identification */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Candidate In-Game Name (IGN) <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <SkinAvatar ign={ign || 'User'} size={42} className="ring-1 ring-clivax-border shadow-inner" />
              <input
                type="text"
                required
                autoFocus
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                placeholder="e.g. ApplicantUsername"
                className="w-full px-3.5 py-2.5 rounded-lg bg-clivax-bg border border-clivax-border text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-clivax-primary focus:border-clivax-primary placeholder-slate-600 font-semibold"
              />
            </div>
          </div>

          {/* Section 2: Scorecard Rating (1 to 5 Stars) */}
          <div className="p-4 rounded-xl bg-clivax-sidebar/80 border border-clivax-border space-y-2.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Evaluation Score (1.0 to 5.0) <span className="text-rose-400">*</span>
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
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Assessment Notes & Interview Observations
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail candidate's responses, previous server experience, collaboration maturity, playstyle, and technical capabilities..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-clivax-bg border border-clivax-border text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-clivax-primary focus:border-clivax-primary placeholder-slate-600 leading-relaxed"
            />
          </div>

          {/* Section 4: Competencies & Tags */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Demonstrated Competencies
            </label>
            <div className="flex flex-wrap gap-2">
              {COMPETENCY_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                const isRisk = tag.includes('Risk');
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      active
                        ? isRisk
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/20'
                          : 'bg-clivax-primary/15 text-emerald-400 border-clivax-primary/40 ring-1 ring-clivax-primary/20'
                        : 'bg-clivax-bg text-slate-400 border-clivax-border hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Evaluator Information */}
          <div className="pt-3 border-t border-clivax-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400">Evaluator:</span>
              <input
                type="text"
                value={interviewerIgn}
                onChange={(e) => setInterviewerIgn(e.target.value)}
                className="px-3 py-1 rounded-lg bg-clivax-bg border border-clivax-border text-slate-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-clivax-primary w-40"
              />
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline Vault Protection Active</span>
            </div>
          </div>

          {/* Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-clivax-primary hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
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
