'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Check,
  User,
  Briefcase,
  Clock,
  Maximize2,
  Minimize2
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
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

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
    setMounted(true);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 lg:p-8 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`w-full ${
          isMaximized 
            ? 'max-w-none h-full rounded-2xl' 
            : 'max-w-5xl xl:max-w-6xl max-h-[92vh] rounded-2xl'
        } bg-white border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden transition-all duration-200`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <SkinAvatar ign={ign || 'User'} size={40} className="ring-2 ring-slate-200 shadow-xs rounded-xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-slate-900">
                  {isEditing ? `Edit Staff Member: ${staffMember.ign}` : 'Create New Staff Member'}
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

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title={isMaximized ? 'Restore Default Size' : 'Maximize to Full Screen'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Staff Profile Preview Card (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 shadow-xs flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <SkinAvatar ign={ign || 'User'} size={80} className="ring-4 ring-white shadow-md rounded-2xl" />
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                    status === 'Active' ? 'bg-emerald-500' : status === 'LOA' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                </div>

                <h3 className="font-bold text-sm text-slate-900 truncate max-w-full">
                  {ign.trim() || 'Staff IGN'}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {discordTag.trim() || 'discord#0000'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {role}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600 bg-white border border-slate-200 shadow-2xs">
                    {department}
                  </span>
                </div>

                <div className="w-full border-t border-slate-200/80 mt-4 pt-3 text-xs space-y-2 text-left">
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
                </div>
              </div>

              {/* Department Quota Impact Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5 text-xs">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Department Quota</span>
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
                    : `${department} currently maintains sufficient active duty staffing.`}
                </p>
              </div>

              {/* Danger Zone: Delete Staff (if editing) */}
              {isEditing && onDelete && (
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 shadow-xs space-y-2 text-xs">
                  <span className="font-semibold text-rose-900 block">Remove Staff Member</span>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Permanently remove this team member from the KDOS workforce roster and revoke credentials.
                  </p>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full mt-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Removing...' : 'Remove from Roster'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Organized Form Panels (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Panel 1: Identity & Server Account */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Staff Identity & Credentials</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Minecraft In-Game Name is used to fetch official player skins and verify server access.
                  </p>
                </div>

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
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-medium transition-all"
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
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-mono transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Used for sign in and Discord authentication</span>
                  </div>
                </div>
              </div>

              {/* Panel 2: Role & Department Assignment */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Role & Department Allocation</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Assigned Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as StaffRole)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
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
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
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
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Availability & Duty Status</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Active', 'LOA', 'Hiatus', 'Inactive'] as StaffStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
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
                      <span className="text-xs font-bold">{s}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {s === 'Active' ? 'On Duty' : s === 'LOA' ? 'Leave' : s === 'Hiatus' ? 'Paused' : 'Archived'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Conditional LOA & Hiatus Details */}
                {(status === 'LOA' || status === 'Hiatus') && (
                  <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3 animate-fade-in mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                      <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        Leave of Absence Schedule
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setLoaPresetDays(7)}
                          className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer text-[10px]"
                        >
                          +1 Wk
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoaPresetDays(14)}
                          className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer text-[10px]"
                        >
                          +2 Wks
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoaPresetDays(30)}
                          className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer text-[10px]"
                        >
                          +1 Mo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Return Target Date
                        </label>
                        <input
                          type="date"
                          value={loaReturnDate}
                          onChange={(e) => setLoaReturnDate(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono font-medium"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Absence Reason / Documentation
                        </label>
                        <input
                          type="text"
                          value={loaReason}
                          onChange={(e) => setLoaReason(e.target.value)}
                          placeholder="e.g. College exams, holiday, PC repairs..."
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Panel 4: Security PIN Administration */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
                <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Security PIN Administration</span>
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    hasPin 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {hasPin ? 'PIN Active' : 'No PIN Assigned'}
                  </span>
                </div>

                {pinStatusMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{pinStatusMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      {isEditing ? 'Direct PIN Override (Optional)' : 'Assign Custom PIN (Optional)'}
                    </label>
                    <input
                      type="password"
                      value={pinOverride}
                      onChange={(e) => setPinOverride(e.target.value)}
                      placeholder="Leave blank to let user choose their PIN"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Staff member will set their PIN on first sign in if left blank</span>
                  </div>

                  {isEditing && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <span className="font-semibold text-slate-800 block text-[11px]">Reset Security PIN</span>
                      <p className="text-[10px] text-slate-500">
                        Clears existing PIN so the user assigns a new one upon next login.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetPin}
                        disabled={isResettingPin}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-600" />
                        <span>{isResettingPin ? 'Resetting...' : 'Reset PIN'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Staff Member'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
