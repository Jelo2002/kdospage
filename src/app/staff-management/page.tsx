'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StaffMember, DepartmentHealth, StaffStatus, Candidate } from '@/lib/types';
import SkinAvatar from '@/components/SkinAvatar';
import DepartmentCard from '@/components/DepartmentCard';
import StaffModal from '@/components/StaffModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Calendar, 
  Clock, 
  AlertCircle,
  Edit2, 
  CheckCircle2, 
  KeyRound,
  LayoutGrid,
  List,
  Award,
  TrendingUp,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<DepartmentHealth[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'cards' | 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [staffRes, deptRes, candRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/staff/departments'),
        fetch('/api/candidates'),
      ]);

      const staffData = await staffRes.json();
      const deptData = await deptRes.json();
      const candData = await candRes.json();

      if (staffData.success && Array.isArray(staffData.staff)) {
        setStaff(staffData.staff);
      }
      if (deptData.success && Array.isArray(deptData.departments)) {
        setDepartments(deptData.departments);
      }
      if (candData.success && Array.isArray(candData.candidates)) {
        setCandidates(candData.candidates);
      }
    } catch (err) {
      console.error('Failed to load staff management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleSaveStaff = async (data: Partial<StaffMember>) => {
    try {
      if (editingStaffMember) {
        await fetch(`/api/staff/${editingStaffMember.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      fetchStaffData();
    } catch (err) {
      console.error('Failed to save staff:', err);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      fetchStaffData();
    } catch (err) {
      console.error('Failed to delete staff:', err);
    }
  };

  const handleQuickStatus = async (id: string, newStatus: StaffStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );

      await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          ...(newStatus === 'Active' ? { loa_reason: null, loa_return_date: null } : {})
        }),
      });

      fetchStaffData();
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchStaffData();
    }
  };

  const handleResetPinQuick = async (id: string, ign: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Reset security PIN for ${ign}? They will configure a fresh PIN upon next sign in.`)) return;
    try {
      const res = await fetch('/api/auth/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Security PIN for ${ign} has been reset.`);
        fetchStaffData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const lackingDepartments = useMemo(() => {
    return departments.filter((d) => d.is_lacking);
  }, [departments]);

  const loaStaffMembers = useMemo(() => {
    return staff.filter((s) => s.status === 'LOA' || s.status === 'Hiatus');
  }, [staff]);

  // Interviewer Performance Leaderboard
  const interviewerLeaderboard = useMemo(() => {
    const statsMap: Record<string, { total: number; ratings: number[]; admitted: number; latest: string }> = {};

    candidates.forEach((c) => {
      const interviewer = c.interviewer_ign?.trim() || 'Staff';
      if (!statsMap[interviewer]) {
        statsMap[interviewer] = { total: 0, ratings: [], admitted: 0, latest: c.created_at };
      }
      statsMap[interviewer].total += 1;
      if (c.rating) statsMap[interviewer].ratings.push(c.rating);
      if (c.status === 'accepted') statsMap[interviewer].admitted += 1;
      if (new Date(c.created_at) > new Date(statsMap[interviewer].latest)) {
        statsMap[interviewer].latest = c.created_at;
      }
    });

    return Object.entries(statsMap)
      .map(([ign, stats]) => ({
        ign,
        total: stats.total,
        avgRating: stats.ratings.length ? (stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length).toFixed(1) : '—',
        admitRate: stats.total ? Math.round((stats.admitted / stats.total) * 100) : 0,
        latest: stats.latest,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [candidates]);

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (selectedDepartment !== 'all') {
        const matchesDept =
          s.department.toLowerCase() === selectedDepartment.toLowerCase() ||
          s.department.toLowerCase().includes(selectedDepartment.toLowerCase());
        if (!matchesDept) return false;
      }

      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchIgn = s.ign.toLowerCase().includes(q);
        const matchDiscord = s.discord_tag?.toLowerCase().includes(q);
        const matchRole = s.role.toLowerCase().includes(q);
        if (!matchIgn && !matchDiscord && !matchRole) return false;
      }

      return true;
    });
  }, [staff, selectedDepartment, statusFilter, searchQuery]);

  const totalActive = staff.filter((s) => s.status === 'Active').length;
  const totalLoa = loaStaffMembers.length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Workforce Operations & Staff Roster
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              {staff.length} Members
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Monitor department quotas, track Leaves of Absence (LOA), manage duty availability, and evaluate interviewer performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingStaffMember(null);
            setIsStaffModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Total Staff</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{staff.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Across 6 departments</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-1 flex items-center justify-between">
            <span>Active on Duty</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">{totalActive}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            {staff.length ? Math.round((totalActive / staff.length) * 100) : 0}% active coverage
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-1 flex items-center justify-between">
            <span>On Leave / Hiatus</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">{totalLoa}</div>
          <div className="text-[10px] text-slate-400 mt-1">Scheduled absences</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Staffing Shortages</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${lackingDepartments.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {lackingDepartments.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {lackingDepartments.length > 0 ? 'Urgent hiring needed' : 'All quotas satisfied'}
          </div>
        </div>
      </div>

      {/* Staffing Deficit Alert Callout */}
      {lackingDepartments.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
            <div>
              <span className="font-semibold text-rose-900">
                Department Quota Deficit Detected ({lackingDepartments.length} Department{lackingDepartments.length > 1 ? 's' : ''}):
              </span>{' '}
              <span className="text-rose-700">
                {lackingDepartments.map((d) => `${d.name} (-${d.deficiency_count})`).join(', ')}.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold hidden sm:inline">
            Action Recommended
          </span>
        </div>
      )}

      {/* Leave of Absence (LOA) Administration Hub */}
      {loaStaffMembers.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Active Leaves of Absence & Hiatus ({loaStaffMembers.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-tracked Return Dates
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loaStaffMembers.map((member) => {
              const returnDate = member.loa_return_date ? new Date(member.loa_return_date) : null;
              const now = new Date();
              let daysLeft: number | null = null;
              if (returnDate) {
                const diffTime = returnDate.getTime() - now.getTime();
                daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }

              return (
                <div 
                  key={member.id}
                  className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/80 hover:border-amber-300 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SkinAvatar ign={member.ign} size={28} />
                        <div>
                          <div className="font-bold text-xs text-slate-900">{member.ign}</div>
                          <div className="text-[10px] text-slate-500">{member.role}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        {member.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-mono mb-1">
                      {returnDate ? (
                        <span className="text-amber-800 font-semibold">
                          {daysLeft !== null && daysLeft <= 0 
                            ? '⚠️ Return overdue' 
                            : daysLeft === 1 
                            ? 'Returns tomorrow' 
                            : `Returns in ${daysLeft} days (${returnDate.toLocaleDateString()})`}
                        </span>
                      ) : (
                        <span className="text-slate-500">Indefinite Leave</span>
                      )}
                    </div>

                    {member.loa_reason && (
                      <p className="text-[11px] text-slate-600 italic line-clamp-2 bg-white/80 p-2 rounded-lg border border-amber-200">
                        &quot;{member.loa_reason}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-2 border-t border-amber-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{member.department}</span>
                    <button
                      type="button"
                      onClick={() => handleQuickStatus(member.id, 'Active')}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3 h-3" />
                      <span>Return to Duty</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Department Capacity Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-800 text-xs">
              Department Capacity & Staffing Thresholds
            </span>
            <span className="text-slate-400 text-[11px]">
              (Click a card to isolate department)
            </span>
          </div>
          {selectedDepartment !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedDepartment('all')}
              className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold cursor-pointer"
            >
              Reset Filter (Show All)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              isSelected={selectedDepartment.toLowerCase() === dept.name.toLowerCase()}
              onSelect={() => {
                if (selectedDepartment.toLowerCase() === dept.name.toLowerCase()) {
                  setSelectedDepartment('all');
                } else {
                  setSelectedDepartment(dept.name);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Interviewer Performance Leaderboard */}
      {interviewerLeaderboard.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Staff Interviewer Leaderboard & Activity
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Evaluations Recorded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {interviewerLeaderboard.map((item, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
              return (
                <div
                  key={item.ign}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base select-none">{medal}</span>
                    <SkinAvatar ign={item.ign} size={32} />
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.ign}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Avg: <strong className="text-amber-600">{item.avgRating}★</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {item.total}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.admitRate}% Admitted
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Roster Controls: Search, Filters, and View Switcher */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workforce by IGN, Discord, or Role..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Status Pills */}
            <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg">
              {['all', 'Active', 'LOA', 'Hiatus'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>

            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'cards' 
                    ? 'bg-white text-emerald-700 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Visual Card Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-white text-emerald-700 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Dense Data Table"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic View: Cards vs Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
            Loading workforce roster...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
            No staff members match the active filters.
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredStaff.map((member) => {
              const isActive = member.status === 'Active';
              const isLoa = member.status === 'LOA';
              const isHiatus = member.status === 'Hiatus';

              return (
                <div
                  key={member.id}
                  onClick={() => {
                    setEditingStaffMember(member);
                    setIsStaffModalOpen(true);
                  }}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group shadow-xs"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <SkinAvatar ign={member.ign} size={38} className="ring-1 ring-slate-200 shadow-xs" />
                        <div>
                          <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {member.ign}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {member.discord_tag || '—'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isLoa
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : isLoa ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                        />
                        {member.status}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1 py-2 border-y border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Role:</span>
                        <span className="font-semibold text-slate-800">{member.role}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Dept:</span>
                        <span className="text-slate-600 text-[11px] truncate max-w-[150px]">{member.department}</span>
                      </div>
                    </div>

                    {/* LOA box if on leave */}
                    {(isLoa || isHiatus) && (
                      <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px]">
                        <div className="text-amber-800 font-mono font-medium">
                          {member.loa_return_date ? `Return: ${new Date(member.loa_return_date).toLocaleDateString()}` : 'Indefinite'}
                        </div>
                        {member.loa_reason && (
                          <div className="text-slate-500 italic truncate mt-0.5">
                            {member.loa_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div 
                    className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleQuickStatus(member.id, 'Active', e)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleQuickStatus(member.id, 'LOA', e)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          isLoa
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : 'text-slate-400 hover:text-amber-700 hover:bg-amber-50'
                        }`}
                      >
                        LOA
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleQuickStatus(member.id, 'Hiatus', e)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          isHiatus
                            ? 'bg-slate-100 text-slate-800 border border-slate-300'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Hiatus
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleResetPinQuick(member.id, member.ign, e)}
                        className="p-1 text-slate-400 hover:text-amber-600 rounded transition-colors cursor-pointer"
                        title="Reset PIN"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStaffMember(member);
                          setIsStaffModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                        title="Edit Staff Member"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Duty Status</th>
                    <th className="py-3 px-3">Leave Schedule / Reason</th>
                    <th className="py-3 px-4 text-right">Quick Override & Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((member) => {
                    const isActive = member.status === 'Active';
                    const isLoa = member.status === 'LOA';
                    const isHiatus = member.status === 'Hiatus';

                    return (
                      <tr
                        key={member.id}
                        onClick={() => {
                          setEditingStaffMember(member);
                          setIsStaffModalOpen(true);
                        }}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Member */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <SkinAvatar ign={member.ign} size={32} />
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {member.ign}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {member.discord_tag || '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Title */}
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {member.role}
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3 text-slate-500">
                          {member.department}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isLoa
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : isLoa ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                            />
                            {member.status}
                          </span>
                        </td>

                        {/* Leave Schedule / Reason */}
                        <td className="py-3 px-3 max-w-xs text-slate-600 text-[11px]">
                          {isLoa || isHiatus ? (
                            <div>
                              <span className="text-amber-800 font-mono font-semibold">
                                {member.loa_return_date ? `Until ${new Date(member.loa_return_date).toLocaleDateString()}` : 'Indefinite'}
                              </span>
                              {member.loa_reason && (
                                <p className="text-slate-500 truncate text-[10px] mt-0.5">
                                  {member.loa_reason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleQuickStatus(member.id, 'Active', e)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              Active
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleQuickStatus(member.id, 'LOA', e)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                isLoa
                                  ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                  : 'text-slate-400 hover:text-amber-700 hover:bg-amber-50'
                              }`}
                            >
                              LOA
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleQuickStatus(member.id, 'Hiatus', e)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                isHiatus
                                  ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              Hiatus
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleResetPinQuick(member.id, member.ign, e)}
                              className="p-1 text-slate-400 hover:text-amber-600 ml-1 rounded transition-colors cursor-pointer"
                              title="Reset Security PIN"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingStaffMember(member);
                                setIsStaffModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 ml-1 rounded transition-colors cursor-pointer"
                              title="Edit team member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Staff Modal */}
      <StaffModal
        staffMember={editingStaffMember}
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setEditingStaffMember(null);
        }}
        onSave={handleSaveStaff}
        onDelete={handleDeleteStaff}
        departments={departments}
      />
    </div>
  );
}
