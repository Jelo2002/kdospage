'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRole } from './RoleContext';
import SkinAvatar from './SkinAvatar';
import { 
  Users, 
  ClipboardCheck, 
  UserCheck, 
  Calendar, 
  Activity, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Briefcase,
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
  const searchParams = useSearchParams();
  const { role, isOwnerOrDev, user, staffName, logout } = useRole();

  const displayName = user?.ign || staffName || 'StaffMember';

  const isHrefActive = (href: string) => {
    if (!href) return false;
    if (href.includes('?')) {
      const [itemPath, itemQuery] = href.split('?');
      if (pathname !== itemPath) return false;
      const itemTab = new URLSearchParams(itemQuery).get('tab');
      const currentTab = searchParams ? searchParams.get('tab') : null;
      return itemTab === currentTab;
    }
    if (pathname === '/staff-management' && href === '/staff-management') {
      const currentTab = searchParams ? searchParams.get('tab') : null;
      return !currentTab || currentTab === 'directory';
    }
    return pathname === href;
  };

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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 shadow-xs transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-3 overflow-hidden group"
          >
            {/* 3D KDOS Logo Image */}
            <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-slate-200 group-hover:border-emerald-300 transition-all">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kdos-logo.png"
                alt="KDOS Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-slate-900 font-sans group-hover:text-emerald-600 transition-colors">
                    KDOS
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    SMP
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  Operations Portal
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
                  <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {group.group}
                  </div>
                )}

                {visibleItems.map((item: any, iIdx: number) => {
                  const Icon = item.icon;
                  const isActive = item.href ? isHrefActive(item.href) : false;

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
                        } text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 group cursor-pointer`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0 group-hover:scale-105 transition-transform" />
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between text-left">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                  item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
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
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      } group`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isActive
                            ? 'text-emerald-700'
                            : 'text-slate-400 group-hover:text-slate-700 group-hover:scale-105'
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
                                  ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200')
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
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <SkinAvatar ign={displayName} size={isCollapsed ? 32 : 34} />
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {displayName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="truncate uppercase font-mono font-medium">{role}</span>
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
