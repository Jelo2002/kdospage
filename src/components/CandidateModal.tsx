'use client';

import React, { useState } from 'react';
import { Candidate, CandidateStatus } from '@/lib/types';
import SkinAvatar from './SkinAvatar';
import StarRating from './StarRating';
import { X, Check, Trash2 } from 'lucide-react';

interface CandidateModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Candidate>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CandidateModal({
  candidate,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: CandidateModalProps) {
  if (!isOpen || !candidate) return null;

  const [rating, setRating] = useState<number>(candidate.rating);
  const [notes, setNotes] = useState<string>(candidate.notes);
  const [status, setStatus] = useState<CandidateStatus>(candidate.status);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(candidate.id, {
        rating,
        notes,
        status,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete evaluation record for ${candidate.ign}?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(candidate.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <SkinAvatar ign={candidate.ign} size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{candidate.ign}</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Evaluator: {candidate.interviewer_ign} • {new Date(candidate.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Admissions Decision */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Admissions Determination
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'accepted', label: 'Admit to SMP' },
                { id: 'pending', label: 'Under Review' },
                { id: 'rejected', label: 'Disqualified' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as CandidateStatus)}
                  className={`py-2 rounded-lg font-semibold text-xs border transition-colors ${
                    status === s.id
                      ? s.id === 'accepted'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-300'
                        : s.id === 'pending'
                        ? 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-300'
                        : 'bg-rose-50 border-rose-300 text-rose-800 ring-1 ring-rose-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Star Rating Adjuster */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Evaluation Score
            </label>
            <StarRating value={rating} onChange={setRating} size="md" />
          </div>

          {/* Assessment Log */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Assessment Log & Interview Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 leading-relaxed placeholder-slate-400"
            />
          </div>

          {/* Tags */}
          {candidate.tags && candidate.tags.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Competency Badges
              </label>
              <div className="flex flex-wrap gap-1">
                {candidate.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
