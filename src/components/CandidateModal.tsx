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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <SkinAvatar ign={candidate.ign} size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-100">{candidate.ign}</span>
              </div>
              <span className="text-[11px] text-zinc-400">
                Evaluator: {candidate.interviewer_ign} • {new Date(candidate.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Admissions Decision */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
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
                  className={`py-2 rounded-md font-medium text-xs border transition-colors ${
                    status === s.id
                      ? s.id === 'accepted'
                        ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                        : s.id === 'pending'
                        ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                        : 'bg-rose-950/70 border-rose-700 text-rose-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Star Rating Adjuster */}
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Evaluation Score
            </label>
            <StarRating value={rating} onChange={setRating} size="md" />
          </div>

          {/* Assessment Log */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
              Assessment Log & Interview Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 leading-relaxed"
            />
          </div>

          {/* Tags */}
          {candidate.tags && candidate.tags.length > 0 && (
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
                Competency Badges
              </label>
              <div className="flex flex-wrap gap-1">
                {candidate.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 border border-zinc-700 text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition-colors shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
