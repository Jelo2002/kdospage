'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number; // 1 to 5
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SCORE_CRITERIA: Record<number, { label: string; desc: string; tone: string }> = {
  1: { label: '1.0 — Strong No', desc: 'Severe rule violation, disruptive conduct, or disqualifying technical issues.', tone: 'text-rose-400' },
  2: { label: '2.0 — Below Standard', desc: 'Inconsistent interview responses, questionable reliability, or inadequate setup.', tone: 'text-amber-400' },
  3: { label: '3.0 — Meets Baseline', desc: 'Satisfactory responses, adheres to baseline rules, requires secondary consensus.', tone: 'text-zinc-300' },
  4: { label: '4.0 — Recommended', desc: 'Strong candidate, solid communication, verified experience, positive culture addition.', tone: 'text-emerald-400' },
  5: { label: '5.0 — Strong Hire / Exceptional', desc: 'Top-tier portfolio, outstanding technical and collaborative maturity. Immediate acceptance.', tone: 'text-emerald-300' },
};

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = true,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const activeVal = hoverRating !== null ? hoverRating : value;

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeVal;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => onChange && onChange(star)}
              onMouseEnter={() => !readOnly && setHoverRating(star)}
              onMouseLeave={() => !readOnly && setHoverRating(null)}
              className={`p-0.5 rounded transition-colors ${
                readOnly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-zinc-850 focus:outline-none focus:ring-1 focus:ring-zinc-500'
              }`}
              title={`${star}.0`}
              aria-label={`Score ${star}`}
            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              />
            </button>
          );
        })}

        <span className="ml-2 font-mono text-xs font-semibold text-zinc-300">
          {activeVal ? `${activeVal}.0` : '0.0'}
          <span className="text-zinc-500 font-normal"> / 5.0</span>
        </span>
      </div>

      {showLabel && activeVal > 0 && SCORE_CRITERIA[activeVal] && (
        <div className="text-left pt-0.5">
          <span className={`text-xs font-medium ${SCORE_CRITERIA[activeVal].tone}`}>
            {SCORE_CRITERIA[activeVal].label}
          </span>
          {!readOnly && (
            <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              {SCORE_CRITERIA[activeVal].desc}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
