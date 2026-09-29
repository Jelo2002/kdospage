'use client';

import React, { useState, useEffect } from 'react';
import { StaffMember, StaffRole, StaffStatus, DepartmentHealth } from '@/lib/types';
import SkinAvatar from './SkinAvatar';
import { 
  X, 
  Trash2, 
  KeyRound, 
  RotateCcw, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle,
  ArrowLeft,
  Check,
  User,
  Briefcase,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-[#f8fafc] overflow-y-auto animate-fade-in flex flex-col">
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to Workforce</span>
          </button>
          
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-slate-900">
                {isEditing ? `Edit Staff Member: ${staffMember.ign}` : 'Create New Staff Member'}
              </h1>
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
            <p className="text-[11px] text-slate-500 hidden sm:block">
              KDOS Operations • Workforce Profile & Credential Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Staff Member'}</span>
          </button>
        </div>
      </header>

      {/* Main Full-Page Form Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Staff Profile Preview Card (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Live Identity Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center text-center">
              <div className="relative mb-3">
                <SkinAvatar ign={ign || 'User'} size={88} className="ring-4 ring-slate-100 shadow-md rounded-2xl" />
                <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-white ${
                  status === 'Active' ? 'bg-emerald-500' : status === 'LOA' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
              </div>

              <h2 className="font-bold text-base text-slate-900 truncate max-w-full">
                {ign.trim() || 'Staff IGN'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {discordTag.trim() || 'discord#0000'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {role}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200">
                  {department}
                </span>
              </div>

              <div className="w-full border-t border-slate-100 mt-5 pt-4 text-xs space-y-2 text-left">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Duty Availability:</span>
                  <span className={`font-semibold ${
                    status === 'Active' ? 'text-emerald-700' : status === 'LOA' ? 'text-amber-700' : 'text-slate-600'
                  }`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Security PIN:</span>
                  <span className={`font-mono font-semibold ${hasPin ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {hasPin ? 'PIN Active' : 'No PIN Assigned'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Permissions:</span>
                  <span className="font-semibold text-slate-700">
                    {role === 'Owner' || role === 'Developer' || role === 'Admin' ? 'Administrative Access' : 'Evaluator Access'}
                  </span>
                </div>
              </div>
            </div>

            {/* Department Quota Impact Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Department Staffing Quota</span>
                {currentDeptInfo?.is_lacking ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Deficit: -{currentDeptInfo.deficiency_count}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Quota Met
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {currentDeptInfo?.is_lacking 
                  ? `Assigning ${ign || 'this member'} to ${department} addresses the staffing shortage in this division.`
                  : `${department} currently maintains sufficient active staffing.`}
              </p>
            </div>

            {/* Danger Zone: Delete Staff (if editing) */}
            {isEditing && onDelete && (
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 shadow-xs space-y-2 text-xs">
                <span className="font-semibold text-rose-900 block">Remove Staff Member</span>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Permanently remove this team member from the KDOS workforce roster and revoke system credentials.
                </p>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Removing...' : 'Remove from Roster'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Organized Form Panels (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Panel 1: Identity & Credentials */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Staff Identity & Credentials</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Minecraft In-Game Name is used to fetch official skins and verify server permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-medium transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Live skin preview updates automatically on the left</span>
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
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-mono transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Used for sign in and Discord authentication</span>
                </div>
              </div>
            </div>

            {/* Panel 2: Role & Department Assignment */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Role & Department Assignment</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Assign administrative responsibilities and allocate this member to a specific departmental quota.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Assigned Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="Interviewer">Interviewer (Admissions Scorecards)</option>
                    <option value="Moderator">Moderator (Server Enforcement)</option>
                    <option value="Builder">Builder (World Architecture)</option>
                    <option value="Developer">Developer (Technical & Systems)</option>
                    <option value="Admin">Admin (Workforce Management)</option>
                    <option value="Owner">Owner (Executive Administration)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Department Assignment
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
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
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
            </div>

            {/* Panel 3: Availability & Duty Status */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Availability & Duty Status</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Set whether this team member is currently active, on official leave, on hiatus, or inactive.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Active', 'LOA', 'Hiatus', 'Inactive'] as StaffStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      status === s
                        ? s === 'Active'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-300 font-bold shadow-xs'
                          : s === 'LOA'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-300 font-bold shadow-xs'
                          : s === 'Hiatus'
                          ? 'bg-slate-100 border-slate-300 text-slate-800 ring-2 ring-slate-300 font-bold shadow-xs'
                          : 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-300 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-bold">{s}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {s === 'Active' ? 'On Duty' : s === 'LOA' ? 'Leave' : s === 'Hiatus' ? 'Paused' : 'Archived'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Conditional LOA & Hiatus Details */}
              {(status === 'LOA' || status === 'Hiatus') && (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3.5 animate-fade-in mt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                    <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      Leave of Absence Documentation & Return Target
                    </span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setLoaPresetDays(7)}
                        className="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer text-[11px] shadow-2xs"
                      >
                        +7 Days (1 Wk)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoaPresetDays(14)}
                        className="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer text-[11px] shadow-2xs"
                      >
                        +14 Days (2 Wks)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoaPresetDays(30)}
                        className="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer text-[11px] shadow-2xs"
                      >
                        +30 Days (1 Mo)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Expected Return Date
                      </label>
                      <input
                        type="date"
                        value={loaReturnDate}
                        onChange={(e) => setLoaReturnDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Absence Reason / Context
                      </label>
                      <input
                        type="text"
                        value={loaReason}
                        onChange={(e) => setLoaReason(e.target.value)}
                        placeholder="e.g. University exams, holiday, hardware upgrade..."
                        className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 4: Security PIN Administration */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Security PIN Administration</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Staff sign in using their Discord handle and a 4+ digit security PIN.
                  </p>
                </div>
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold ${
                  hasPin 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {hasPin ? 'PIN Active' : 'No PIN Assigned'}
                </span>
              </div>

              {pinStatusMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{pinStatusMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    {isEditing ? 'Direct PIN Override (Optional)' : 'Assign Custom PIN (Optional)'}
                  </label>
                  <input
                    type="password"
                    value={pinOverride}
                    onChange={(e) => setPinOverride(e.target.value)}
                    placeholder="Leave blank to let user choose their own PIN"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">If blank, user is prompted to set their PIN on first sign in</span>
                </div>

                {isEditing && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <span className="font-semibold text-slate-800 block">Reset PIN for Staff</span>
                    <p className="text-[11px] text-slate-500">
                      Clears their current PIN so they can configure a fresh one upon next login.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetPin}
                      disabled={isResettingPin}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isResettingPin ? 'Resetting PIN...' : 'Reset Security PIN'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ← Discard & Return to Workforce
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Staff Member'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
