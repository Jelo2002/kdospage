'use client';

import React from 'react';
import { DepartmentHealth } from '@/lib/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface DepartmentCardProps {
  department: DepartmentHealth;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function DepartmentCard({
  department,
  isSelected = false,
  onSelect,
}: DepartmentCardProps) {
  const { name, min_required_staff, total_staff, active_staff, loa_staff, hiatus_staff, is_lacking, deficiency_count } = department;
  const percentActive = Math.min(100, Math.round((active_staff / Math.max(1, min_required_staff)) * 100));

  return (
    <div
      onClick={onSelect}
      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
        isSelected
          ? 'bg-clivax-card border-clivax-primary/60 shadow-lg shadow-clivax-primary/5 ring-1 ring-clivax-primary/40'
          : 'bg-clivax-card/70 border-clivax-border hover:bg-clivax-card hover:border-slate-700'
      }`}
    >
      {/* Title & Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-xs text-slate-200 line-clamp-1">
          {name}
        </h3>

        {is_lacking ? (
          <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400">
            -{deficiency_count} Deficit
          </span>
        ) : (
          <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Healthy
          </span>
        )}
      </div>

      {/* Headcount metrics */}
      <div className="flex items-baseline justify-between my-2">
        <div className="text-xl font-bold font-mono text-slate-100">
          {active_staff}{' '}
          <span className="text-xs font-normal text-slate-500">/ {min_required_staff} Min</span>
        </div>
        <div className={`text-xs font-mono font-semibold ${is_lacking ? 'text-rose-400' : 'text-emerald-400'}`}>
          {percentActive}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden mb-2.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            is_lacking ? 'bg-rose-500' : percentActive >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: `${percentActive}%` }}
        />
      </div>

      {/* Breakdown footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-clivax-border">
        <span>Active: <strong className="text-emerald-400 font-mono">{active_staff}</strong></span>
        <span>LOA: <strong className="text-amber-400 font-mono">{loa_staff}</strong></span>
        <span>Hiatus: <strong className="text-slate-400 font-mono">{hiatus_staff}</strong></span>
      </div>
    </div>
  );
}
