'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from './RoleContext';
import SkinAvatar from './SkinAvatar';
import { 
  Menu, 
  ChevronDown, 
  Plus, 
  LogOut, 
  Shield, 
  ShieldCheck, 
  Check, 
  Database,
  ExternalLink,
  Search,
  Sparkles
} from 'lucide-react';
import { ActiveRole } from '@/lib/types';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenBackupModal?: () => void;
}

export default function Navbar({ onToggleMobileSidebar, onOpenBackupModal }: NavbarProps) {
  const pathname = usePathname();
  const { role, setRole, isOwnerOrDev, user, staffName, logout } = useRole();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const displayName = user?.ign || staffName || 'StaffMember';

  const rolesList: { role: ActiveRole; label: string; desc: string }[] = [
    { role: 'Owner', label: 'Owner Mode', desc: 'Full executive administration' },
    { role: 'Developer', label: 'Developer Mode', desc: 'Technical & operational access' },
    { role: 'Admin', label: 'Admin Mode', desc: 'Workforce & admissions review' },
    { role: 'Staff/Interviewer', label: 'Staff Mode', desc: 'Evaluator & scorecard focus' },
  ];

  // Dynamic breadcrumb labels based on route
  const getBreadcrumbs = () => {
    if (pathname === '/') {
      return { section: 'Operations', title: 'Candidate Pipeline' };
    }
    if (pathname === '/staff-management') {
      return { section: 'Workforce', title: 'Staff Directory & Capacity' };
    }
    if (pathname === '/interview') {
      return { section: 'Admissions', title: 'Interview Scorecard' };
    }
    if (pathname === '/staff') {
      return { section: 'Portal', title: 'My Evaluator Space' };
    }
    return { section: 'System', title: 'KDOS Dashboard' };
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-[#0a0f18]/90 backdrop-blur-md border-b border-[#1e293b] px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg bg-[#111827] border border-[#1e293b] text-zinc-300 hover:text-white transition-colors"
          title="Open Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400 font-medium hidden sm:inline-block">
            {breadcrumbs.section}
          </span>
          <span className="text-zinc-500 hidden sm:inline-block">/</span>
          <span className="font-semibold text-white tracking-tight flex items-center gap-2">
            {breadcrumbs.title}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System Health Status Pill */}
        <div 
          onClick={onOpenBackupModal}
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#111827] border border-[#1e293b] text-[11px] text-zinc-300 cursor-pointer hover:border-emerald-500/40 transition-colors"
          title="Decentralized Client Vault & Cloud DB Sync active"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[10px] text-zinc-400">VAULT: <strong className="text-emerald-400">ACTIVE</strong></span>
        </div>

        {/* Quick Action: New Scorecard */}
        <Link
          href="/interview"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-950/50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Scorecard</span>
        </Link>

        {/* User Profile & Role Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-lg bg-[#111827] border border-[#1e293b] hover:border-zinc-700 text-zinc-300 transition-colors"
          >
            <SkinAvatar ign={displayName} size={24} />
            <span className="text-xs font-medium text-zinc-200 hidden sm:inline-block max-w-[100px] truncate">
              {displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0d131f] border border-[#1e293b] shadow-2xl py-1.5 z-50 text-xs animate-fade-in divide-y divide-[#1e293b]">
                {/* User Summary */}
                <div className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <SkinAvatar ign={displayName} size={32} />
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-100 truncate">{displayName}</div>
                      <div className="text-[10px] font-mono text-emerald-400 uppercase">{role}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    KDOS Operations • Verified Session
                  </div>
                </div>

                {/* Role Switcher (For leadership) */}
                {isOwnerOrDev && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Switch Role View
                    </div>
                    {rolesList.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => {
                          setRole(r.role);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#162032] transition-colors ${
                          role === r.role ? 'text-emerald-400 font-semibold' : 'text-zinc-300'
                        }`}
                      >
                        <div>
                          <div>{r.label}</div>
                          <div className="text-[9px] text-zinc-500">{r.desc}</div>
                        </div>
                        {role === r.role && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Items */}
                <div className="py-1">
                  {onOpenBackupModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenBackupModal();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-zinc-300 hover:text-zinc-100 hover:bg-[#162032] transition-colors"
                    >
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Data Vault & Backups</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
