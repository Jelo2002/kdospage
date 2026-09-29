'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import LoginScreen from '@/components/LoginScreen';
import BackupModal from '@/components/BackupModal';
import { useRole } from '@/components/RoleContext';
import { Candidate } from '@/lib/types';
import { Shield } from 'lucide-react';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoadingAuth, staffName } = useRole();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalStaffCount, setTotalStaffCount] = useState(0);

  // Poll counts for sidebar badges
  useEffect(() => {
    if (!isAuthenticated) return;

    fetch('/api/candidates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.candidates)) {
          setCandidates(data.candidates);
        }
      })
      .catch((e) => console.warn('Sidebar candidate count error:', e));

    fetch('/api/staff')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.staff)) {
          setTotalStaffCount(data.staff.length);
        }
      })
      .catch((e) => console.warn('Sidebar staff count error:', e));
  }, [isAuthenticated]);

  // Loading state while checking localStorage session
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f17] text-zinc-400 space-y-4">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-xl ring-1 ring-emerald-500/40 animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kdos-logo.png"
            alt="KDOS Loading"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <p className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
          Initializing KDOS Operations...
        </p>
      </div>
    );
  }

  // Not authenticated: Render Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#0b0f17] text-zinc-100">
        <header className="py-4 border-b border-[#1e293b] text-center bg-[#0d131f]/50">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">
              KDOS Operations System • Secure Gateway
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <LoginScreen />
        </main>

        <footer className="py-3 border-t border-[#1e293b] text-center text-[11px] text-zinc-400 bg-[#0d131f]/50">
          KDOS Operations System • Production SMP Administration
        </footer>
      </div>
    );
  }

  // Authenticated: Render full application with Sidebar, Navbar and main layout canvas
  return (
    <div className="min-h-screen bg-[#0b0f17] text-zinc-100 flex">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        totalCandidatesCount={candidates.length}
        totalStaffCount={totalStaffCount}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          onToggleMobileSidebar={() => setIsMobileOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-[#1e293b] py-4 px-6 text-center text-xs text-zinc-400 bg-[#0d131f]/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1600px] mx-auto">
            <span className="text-[11px]">
              KDOS Operations • Candidate Pipeline & Workforce Supervision
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Production SMP Build • Cloud Persisted
            </span>
          </div>
        </footer>
      </div>

      {/* Global Backup & Bulk Import Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        candidates={candidates}
        onImportComplete={(imported) => {
          setCandidates(imported);
          // Dispatch custom event or reload if needed
          window.location.reload();
        }}
        currentStaffName={staffName}
      />
    </div>
  );
}
