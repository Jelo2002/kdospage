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
  ExternalLink,
  Search
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenBackupModal?: () => void;
}

export default function Navbar({ onToggleMobileSidebar, onOpenBackupModal }: NavbarProps) {
  const pathname = usePathname();
  const { role, isOwnerOrDev, user, staffName, logout } = useRole();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const displayName = user?.ign || staffName || 'StaffMember';

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
    <header className="sticky top-0 z-30 w-full h-16 bg-white/85 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
          title="Open Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline-block">
            {breadcrumbs.section}
          </span>
          <span className="text-slate-300 hidden sm:inline-block">/</span>
          <span className="font-semibold text-slate-800 tracking-tight flex items-center gap-2">
            {breadcrumbs.title}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action: New Scorecard */}
        <Link
          href="/interview"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Scorecard</span>
        </Link>

        {/* User Profile & Role Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 transition-colors shadow-xs"
          >
            <SkinAvatar ign={displayName} size={24} />
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block max-w-[100px] truncate">
              {displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs animate-fade-in divide-y divide-slate-100">
                {/* User Summary */}
                <div className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <SkinAvatar ign={displayName} size={32} />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{displayName}</div>
                      <div className="text-[10px] font-mono text-emerald-700 uppercase font-semibold">{role}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    KDOS Operations • Verified Session
                  </div>
                </div>

                {/* Action Items */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition-colors"
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
