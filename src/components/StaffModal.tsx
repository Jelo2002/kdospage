'use client';

import React, { useState, useEffect } from 'react';
import { StaffMember, StaffRole, StaffStatus, DepartmentHealth } from '@/lib/types';
import SkinAvatar from './SkinAvatar';
import { X, Trash2, KeyRound, RotateCcw, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';

interface StaffModalProps {
  staffMember: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<StaffMember>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  departments?: DepartmentHealth[];
}

export default function StaffModal({
  staffMember,
  isOpen,
  onClose,
  onSave,
  onDelete,
  departments = [],
}: StaffModalProps) {
  if (!isOpen) return null;

  const isEditing = !!staffMember;

  const [ign, setIgn] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [role, setRole] = useState<StaffRole>('Interviewer');
  const [department, setDepartment] = useState('Recruitment & Interviews');
  const [status, setStatus] = useState<StaffStatus>('Active');
  const [pinOverride, setPinOverride] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [loaReason, setLoaReason] = useState('');
  const [loaReturnDate, setLoaReturnDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [pinStatusMsg, setPinStatusMsg] = useState('');

  useEffect(() => {
    if (staffMember) {
      setIgn(staffMember.ign);
      setDiscordTag(staffMember.discord_tag || '');
      setRole(staffMember.role);
      setDepartment(staffMember.department);
      setStatus(staffMember.status);
      setHasPin(!!staffMember.pin);
      setPinOverride('');
      setPinStatusMsg('');
      setLoaReason(staffMember.loa_reason || '');
      setLoaReturnDate(staffMember.loa_return_date ? staffMember.loa_return_date.substring(0, 10) : '');
    } else {
      setIgn('');
      setDiscordTag('');
      setRole('Interviewer');
      setDepartment('Recruitment & Interviews');
      setStatus('Active');
      setHasPin(false);
      setPinOverride('');
      setPinStatusMsg('');
      setLoaReason('');
      setLoaReturnDate('');
    }
  }, [staffMember, isOpen]);

  const handleResetPin = async () => {
    if (!staffMember) return;
    setIsResettingPin(true);
    setPinStatusMsg('');
    try {
      const res = await fetch('/api/auth/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: staffMember.id }),
      });
      const data = await res.json();
      if (data.success) {
        setHasPin(false);
        setPinStatusMsg('PIN successfully reset. User will assign a new PIN on next sign in.');
      } else {
        setPinStatusMsg('Failed to reset PIN.');
      }
    } catch (e) {
      setPinStatusMsg('Error resetting PIN.');
    } finally {
      setIsResettingPin(false);
    }
  };

  const setLoaPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setLoaReturnDate(d.toISOString().substring(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ign.trim()) return;

    setIsSaving(true);
    try {
      const updates: Partial<StaffMember> = {
        ign: ign.trim(),
        discord_tag: discordTag.trim(),
        role,
        department,
        status,
        loa_reason: status === 'Active' ? null : loaReason,
        loa_return_date: status === 'Active' ? null : (loaReturnDate || null),
      };

      if (pinOverride.trim()) {
        updates.pin = pinOverride.trim();
      }

      await onSave(updates);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!staffMember || !onDelete) return;
    if (!confirm(`Are you sure you want to remove ${staffMember.ign} from the KDOS workforce roster?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(staffMember.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const currentDeptInfo = departments.find(
    (d) => d.name.toLowerCase() === department.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header with Live Skin Preview */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <SkinAvatar ign={ign || 'User'} size={44} className="ring-2 ring-slate-200 shadow-xs" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900">
                  {ign ? ign : 'New Staff Member'}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : status === 'LOA'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="font-medium text-slate-700">{role}</span>
                <span>•</span>
                <span className="text-slate-500">{department}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                In-Game Name (IGN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                placeholder="e.g. Zenku8258"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Discord Tag / Handle <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={discordTag}
                onChange={(e) => setDiscordTag(e.target.value)}
                placeholder="e.g. zenku or zenku#1234"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-mono"
              />
            </div>
          </div>

          {/* Role and Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="Interviewer">Interviewer</option>
                <option value="Moderator">Moderator</option>
                <option value="Builder">Builder</option>
                <option value="Developer">Developer</option>
                <option value="Admin">Admin</option>
                <option value="Owner">Owner</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Department
                </label>
                {currentDeptInfo?.is_lacking && (
                  <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Needs +{currentDeptInfo.deficiency_count}
                  </span>
                )}
              </div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="Recruitment & Interviews">Recruitment & Interviews</option>
                <option value="Server Moderation">Server Moderation</option>
                <option value="Development & Tech">Development & Tech</option>
                <option value="Building & World Design">Building & World Design</option>
                <option value="Community & Events">Community & Events</option>
                <option value="Management & Leadership">Management & Leadership</option>
              </select>
            </div>
          </div>

          {/* Availability Status Selection */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Availability & Duty Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Active', 'LOA', 'Hiatus', 'Inactive'] as StaffStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                    status === s
                      ? s === 'Active'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-300'
                        : s === 'LOA'
                        ? 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-300'
                        : 'bg-slate-100 border-slate-300 text-slate-800 ring-1 ring-slate-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional LOA & Hiatus Details */}
          {(status === 'LOA' || status === 'Hiatus') && (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Leave of Absence Documentation
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-slate-500">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setLoaPresetDays(3)}
                    className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium"
                  >
                    +3d
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoaPresetDays(7)}
                    className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium"
                  >
                    +1w
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoaPresetDays(14)}
                    className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium"
                  >
                    +2w
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Expected Return Date
                </label>
                <input
                  type="date"
                  value={loaReturnDate}
                  onChange={(e) => setLoaReturnDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Absence Context / Reason
                </label>
                <textarea
                  rows={2}
                  value={loaReason}
                  onChange={(e) => setLoaReason(e.target.value)}
                  placeholder="e.g. College exams, vacation, hardware repairs..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Security PIN Administration */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-800 flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                Staff Access PIN
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                hasPin 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {hasPin ? 'PIN Active' : 'No PIN Assigned'}
              </span>
            </div>

            {pinStatusMsg && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                {pinStatusMsg}
              </p>
            )}

            {isEditing && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500">
                  Resetting clears their PIN so they can configure a new one on sign in.
                </p>
                <button
                  type="button"
                  onClick={handleResetPin}
                  disabled={isResettingPin}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3 h-3 text-amber-600" />
                  {isResettingPin ? 'Resetting...' : 'Reset PIN'}
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                {isEditing ? 'Direct PIN Override (Optional)' : 'Assign Custom PIN (Optional)'}
              </label>
              <input
                type="password"
                value={pinOverride}
                onChange={(e) => setPinOverride(e.target.value)}
                placeholder="Leave blank to let user choose their own PIN"
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-rose-50 transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Staff</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Staff Member'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
