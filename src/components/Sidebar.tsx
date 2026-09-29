'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from './RoleContext';
import SkinAvatar from './SkinAvatar';
import { 
  Users, 
  ClipboardCheck, 
  ShieldCheck, 
  UserCheck, 
  Calendar, 
  Activity, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Database,
  Briefcase,
  Sparkles,
  BarChart3,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  totalCandidatesCount?: number;
  totalStaffCount?: number;
  onOpenBackupModal?: () => void;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  totalCandidatesCount = 0,
  totalStaffCount = 0,
  onOpenBackupModal,
}: SidebarProps) {
  const pathname = usePathname();
  const { role, isOwnerOrDev, user, staffName, logout } = useRole();

  const displayName = user?.ign || staffName || 'StaffMember';

  const navItems = [
    {
      group: 'OPERATIONS & ADMISSIONS',
      items: [
        {
          label: 'Candidate Pipeline',
          href: '/',
          icon: Users,
          badge: totalCandidatesCount > 0 ? `${totalCandidatesCount}` : undefined,
          roles: ['Owner', 'Developer', 'Admin', 'Staff/Interviewer'],
        },
        {
          label: 'Interview Scorecard',
          href: '/interview',
          icon: ClipboardCheck,
          badge: 'Active',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          roles: ['Owner', 'Developer', 'Admin', 'Staff/Interviewer'],
        },
        {
          label: 'My Evaluator Space',
          href: '/staff',
          icon: UserCheck,
          roles: ['Staff/Interviewer'],
        },
      ],
    },
    {
      group: 'STAFF & WORKFORCE',
      roles: ['Owner', 'Developer', 'Admin'],
      items: [
        {
          label: 'Staff Directory',
          href: '/staff-management',
          icon: Briefcase,
          badge: totalStaffCount > 0 ? `${totalStaffCount}` : undefined,
          roles: ['Owner', 'Developer', 'Admin'],
        },
        {
          label: 'Department Capacity',
          href: '/staff-management?tab=departments',
          icon: Activity,
          roles: ['Owner', 'Developer', 'Admin'],
        },
        {
          label: 'Leave & LOA Schedule',
          href: '/staff-management?tab=leave',
          icon: Calendar,
          roles: ['Owner', 'Developer', 'Admin'],
        },
      ],
    },
    {
      group: 'DATA & SYSTEM',
      items: [
        {
          label: 'Backup & Restore Vault',
          action: onOpenBackupModal,
          icon: ShieldCheck,
          badge: 'Fail-Safe',
          badgeColor: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
          roles: ['Owner', 'Developer', 'Admin', 'Staff/Interviewer'],
        },
      ],
    },
  ];

  const handleLinkClick = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0d131f] border-r border-[#1e293b] transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1e293b] bg-[#0a0f18]/80">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-3 overflow-hidden group"
          >
            {/* 3D KDOS Logo Image */}
            <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 shadow-md ring-1 ring-emerald-500/30 group-hover:ring-emerald-500/60 transition-all">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kdos-logo.png"
                alt="KDOS Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to text box if image load fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-white font-sans group-hover:text-emerald-400 transition-colors">
                    KDOS
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    SMP
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-medium truncate">
                  Operations Portal
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-[#162032] transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navItems.map((group, gIdx) => {
            // Check if group is restricted by role
            if (group.roles && !group.roles.includes(role)) return null;

            // Filter items visible to current role
            const visibleItems = group.items.filter(
              (item) => !item.roles || item.roles.includes(role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400/80 mb-2">
                    {group.group}
                  </div>
                )}

                {visibleItems.map((item: any, iIdx: number) => {
                  const Icon = item.icon;
                  const isActive = item.href ? pathname === item.href : false;

                  if (item.action) {
                    return (
                      <button
                        key={iIdx}
                        type="button"
                        onClick={() => {
                          item.action();
                          handleLinkClick();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isCollapsed ? 'justify-center' : ''
                        } text-zinc-400 hover:text-zinc-100 hover:bg-[#162032]/80 group`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className="w-4 h-4 text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform" />
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between text-left">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                  item.badgeColor || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={iIdx}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#162032]'
                      } group`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isActive
                            ? 'text-emerald-400'
                            : 'text-zinc-400 group-hover:text-zinc-200 group-hover:scale-105'
                        }`}
                      />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                item.badgeColor ||
                                (isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60')
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Footnote Profile Card */}
        <div className="p-3 border-t border-[#1e293b] bg-[#0a0f18]/60">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#111827]/80 border border-[#1e293b]/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <SkinAvatar ign={displayName} size={isCollapsed ? 32 : 34} />
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-100 truncate">
                    {displayName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="truncate uppercase font-mono">{role}</span>
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                title="Log out of session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
