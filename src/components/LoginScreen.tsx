'use client';

import React, { useState } from 'react';
import { useRole } from './RoleContext';
import { AuthUser, ActiveRole } from '@/lib/types';
import SkinAvatar from './SkinAvatar';
import { Shield, KeyRound, Lock, ArrowRight, UserCheck, Check, Sparkles, UserPlus, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginScreen() {
  const { loginSession } = useRole();
  const router = useRouter();

  // Mode: 'login' | 'set_pin' | 'register'
  const [mode, setMode] = useState<'login' | 'set_pin' | 'register'>('login');

  // Login form state
  const [discordTag, setDiscordTag] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set PIN state (for existing staff without PIN or whose PIN was reset)
  const [pendingStaff, setPendingStaff] = useState<any | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Register state (for new staff joining)
  const [regDiscord, setRegDiscord] = useState('');
  const [regIgn, setRegIgn] = useState('');
  const [regRole, setRegRole] = useState<ActiveRole>('Staff/Interviewer');
  const [regPin, setRegPin] = useState('');

  // Step 1: Normal Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!discordTag.trim()) {
      setErrorMsg('Please enter your Discord handle.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discord_tag: discordTag.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Case: Staff exists, but has not assigned a PIN yet
        if (data.needPinSetup && data.staff) {
          setPendingStaff(data.staff);
          setMode('set_pin');
          setIsSubmitting(false);
          return;
        }

        // Case: Discord handle not in staff roster
        if (data.notFound) {
          setErrorMsg(data.error || 'Discord handle not found in roster.');
          setIsSubmitting(false);
          return;
        }

        setErrorMsg(data.error || 'Authentication failed');
        setIsSubmitting(false);
        return;
      }

      // Success: Cache session
      loginSession(data.user, rememberMe);

      // Route based on role
      if (data.user.role === 'Staff/Interviewer') {
        router.push('/interview');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Assign Unique PIN (when staff has no PIN yet)
  const handleSetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPin.trim().length < 4) {
      setErrorMsg('Your PIN must be at least 4 digits/characters.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('PIN confirmation does not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pendingStaff?.id,
          discord_tag: pendingStaff?.discord_tag || discordTag.trim(),
          pin: newPin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign PIN');
      }

      // Automatically log in and cache session
      loginSession(data.user, rememberMe);

      if (data.user.role === 'Staff/Interviewer') {
        router.push('/interview');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error setting PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Register new staff profile with unique PIN
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regDiscord.trim() || !regIgn.trim() || !regPin.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (regPin.trim().length < 4) {
      setErrorMsg('PIN must be at least 4 digits/characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discord_tag: regDiscord.trim(),
          ign: regIgn.trim(),
          role: regRole,
          department: regRole === 'Staff/Interviewer' ? 'Recruitment & Interviews' : 'Management & Leadership',
          pin: regPin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      loginSession(data.user, rememberMe);

      if (data.user.role === 'Staff/Interviewer') {
        router.push('/interview');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden mx-auto shadow-md ring-2 ring-emerald-500/20 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kdos-logo.png"
              alt="KDOS SMP"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
              <span>KDOS</span>
              <span className="text-emerald-600 font-semibold">Operations</span>
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {mode === 'set_pin'
                ? 'Assign Your Personal Security PIN'
                : mode === 'register'
                ? 'New Staff Profile Registration'
                : 'Production SMP Management & Admissions'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* MODE 1: Standard Login */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
            {/* Discord Name */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Discord Username
              </label>
              <input
                type="text"
                required
                autoFocus
                value={discordTag}
                onChange={(e) => setDiscordTag(e.target.value)}
                placeholder="e.g. username or username#0000"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-mono transition-all"
              />
            </div>

            {/* Personal PIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Unique PIN
                </label>
                <span className="text-[10px] text-slate-400">4-6 digits</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 font-mono tracking-widest transition-all"
                />
              </div>
            </div>

            {/* Remember Me Cache Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-600 cursor-pointer select-none">
                Remember session on this device
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-3 rounded-lg font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Toggle to Register */}
            <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-100">
              New team member?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className="text-emerald-700 hover:text-emerald-800 hover:underline font-semibold"
              >
                Register your profile & PIN
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: Set Unique PIN (First time setup or after Admin Reset) */}
        {mode === 'set_pin' && (
          <form onSubmit={handleSetPinSubmit} className="space-y-3.5 text-left animate-fade-in">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <SkinAvatar ign={pendingStaff?.ign || 'User'} size={34} />
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {pendingStaff?.ign}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {pendingStaff?.discord_tag} • {pendingStaff?.role}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              No security PIN is currently linked to your account. Assign your unique PIN below:
            </p>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Choose Your Unique PIN (4+ digits)
              </label>
              <input
                type="password"
                required
                autoFocus
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="e.g. 1234"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono tracking-widest transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Confirm Your PIN
              </label>
              <input
                type="password"
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono tracking-widest transition-all"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMeSet"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
              />
              <label htmlFor="rememberMeSet" className="text-xs text-slate-600 cursor-pointer select-none">
                Remember session on this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-3 rounded-lg font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving PIN...' : 'Save PIN & Enter Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* MODE 3: Self-Registration for new team members */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left animate-fade-in">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Discord Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={regDiscord}
                onChange={(e) => setRegDiscord(e.target.value)}
                placeholder="e.g. username or username#0000"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Minecraft In-Game Name (IGN) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <SkinAvatar ign={regIgn || 'User'} size={30} />
                <input
                  type="text"
                  required
                  value={regIgn}
                  onChange={(e) => setRegIgn(e.target.value)}
                  placeholder="Minecraft username"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Assigned Role
              </label>
              <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between">
                <span className="font-medium">Staff / Interviewer</span>
                <span className="text-[10px] text-slate-400 font-mono">Evaluator</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Leadership roles (Admin, Developer, Owner) are strictly provisioned by leadership.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Create Your Unique PIN <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={regPin}
                onChange={(e) => setRegPin(e.target.value)}
                placeholder="Choose 4+ digit PIN"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono tracking-widest transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-3 rounded-lg font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating Profile...' : 'Complete Registration'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Already have an account? Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
