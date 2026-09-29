'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRole } from '@/components/RoleContext';
import { Candidate, CandidateStatus } from '@/lib/types';
import SkinAvatar from '@/components/SkinAvatar';
import CandidateModal from '@/components/CandidateModal';
import BackupModal from '@/components/BackupModal';
import { syncLocalVaultWithRemote, getLocalVault } from '@/lib/backup';
import { 
  Users, 
  Search, 
  Download, 
  Plus, 
  Check, 
  X, 
  Clock, 
  ArrowUpDown, 
  Star, 
  FileSpreadsheet, 
  ChevronRight, 
  Filter, 
  ShieldCheck, 
  Upload, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function CandidateDashboard() {
  const { role, isOwnerOrDev, staffName } = useRole();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [localVaultCount, setLocalVaultCount] = useState(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'rating_desc' | 'rating_asc'>('newest');

  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Direct Synchronous Stats Calculation: Mathematically guaranteed to match candidate records
  const stats = useMemo(() => {
    const total = candidates.length;
    const accepted = candidates.filter((c) => c.status === 'accepted').length;
    const pending = candidates.filter((c) => c.status === 'pending').length;
    const rejected = candidates.filter((c) => c.status === 'rejected').length;
    const totalScore = candidates.reduce((sum, c) => sum + (Number(c.rating) || 0), 0);
    const avgRating = total > 0 ? Number((totalScore / total).toFixed(1)) : 0;
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, accepted, pending, rejected, avgRating, acceptanceRate };
  }, [candidates]);

  // Score distribution breakdown (Clivax-style chart)
  const scoreDistribution = useMemo(() => {
    const total = candidates.length || 1;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const c of candidates) {
      const r = Math.round(Number(c.rating) || 1);
      if (r in counts) (counts as any)[r]++;
    }
    return [
      { stars: '5★ Exceptional', count: counts[5], pct: Math.round((counts[5] / total) * 100), color: 'bg-emerald-500' },
      { stars: '4★ Strong Hire', count: counts[4], pct: Math.round((counts[4] / total) * 100), color: 'bg-teal-500' },
      { stars: '3★ Baseline', count: counts[3], pct: Math.round((counts[3] / total) * 100), color: 'bg-amber-500' },
      { stars: '2★ Borderline', count: counts[2], pct: Math.round((counts[2] / total) * 100), color: 'bg-orange-500' },
      { stars: '1★ Disqualified', count: counts[1], pct: Math.round((counts[1] / total) * 100), color: 'bg-rose-500' },
    ];
  }, [candidates]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/candidates');
      const data = await res.json();
      const serverList = data.success && Array.isArray(data.candidates) ? data.candidates : [];

      // Reconcile with local browser vault
      const { merged, hasNewLocalRecords } = syncLocalVaultWithRemote(serverList);
      setCandidates(merged);
      setLocalVaultCount(merged.length);

      // If local device has candidate scorecards that the server is missing, push background sync
      if (hasNewLocalRecords) {
        fetch('/api/candidates/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidates: merged }),
        }).catch((e) => console.warn('Background candidate sync failed:', e));
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      // Offline fallback: load from local vault
      const local = getLocalVault();
      if (local.length > 0) {
        setCandidates(local);
        setLocalVaultCount(local.length);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleQuickStatusChange = async (id: string, newStatus: CandidateStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );

      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Status update failed');
    } catch (err) {
      console.error('Error updating status:', err);
      fetchCandidates();
    }
  };

  const handleUpdateCandidate = async (id: string, updates: Partial<Candidate>) => {
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchCandidates();
      }
    } catch (err) {
      console.error('Failed to update candidate:', err);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCandidates();
      }
    } catch (err) {
      console.error('Failed to delete candidate:', err);
    }
  };

  const handleExportCsv = () => {
    if (candidates.length === 0) return;

    const headers = ['IGN', 'Rating', 'Status', 'Interviewer', 'Notes', 'Tags', 'Date'];
    const rows = candidates.map((c) => [
      `"${c.ign}"`,
      c.rating,
      `"${c.status}"`,
      `"${c.interviewer_ign}"`,
      `"${c.notes.replace(/"/g, '""')}"`,
      `"${(c.tags || []).join(', ')}"`,
      `"${new Date(c.created_at).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kdos_candidates_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (ratingFilter === '5' && c.rating !== 5) return false;
        if (ratingFilter === '4+' && c.rating < 4) return false;
        if (ratingFilter === '3+' && c.rating < 3) return false;
        if (ratingFilter === '1-2' && c.rating > 2) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchIgn = c.ign.toLowerCase().includes(q);
          const matchNotes = c.notes?.toLowerCase().includes(q);
          const matchInterviewer = c.interviewer_ign?.toLowerCase().includes(q);
          if (!matchIgn && !matchNotes && !matchInterviewer) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortOrder === 'rating_desc') {
          return b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortOrder === 'rating_asc') {
          return a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [candidates, statusFilter, ratingFilter, searchQuery, sortOrder]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Admissions Engine
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Live ATS Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Candidate Admissions & Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Standardized applicant evaluation records, voice interview rubrics, and admissions decisions.
          </p>
        </div>

        {/* Global Action Strip */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setIsBackupModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            title="Import, restore, or export backups"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Backup & Restore</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={candidates.length === 0}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-2 shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/interview"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Scorecard</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid (KPI Strip) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Evaluated */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Evaluated</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">{stats.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Recorded applicant pool</div>
          </div>
        </div>

        {/* Admitted */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Admitted</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700 font-mono">{stats.accepted}</span>
              <span className="text-[11px] font-mono text-emerald-600 font-semibold">({stats.acceptanceRate}%)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Approved for server whitelist</div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-700 font-mono">{stats.pending}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Awaiting staff consensus</div>
          </div>
        </div>

        {/* Disqualified */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-300 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Disqualified</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-700 font-mono">{stats.rejected}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Filtered by rubric / policy</div>
          </div>
        </div>

        {/* Mean Assessment Score */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mean Score</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 font-mono">{stats.avgRating}</span>
              <span className="text-xs text-slate-400 font-mono">/ 5.0</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Average applicant grade</div>
          </div>
        </div>
      </div>

      {/* Visual Distribution Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score Distribution Breakdown Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Evaluation Score Distribution
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {candidates.length} Samples
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {scoreDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{item.stars}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-900 font-semibold">{item.count}</span>
                    <span className="text-slate-500">({item.pct}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(item.pct, item.count > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel & Vault Status Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Decentralized Data Vault
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Zero-loss architecture: Every scorecard is stored locally in your browser before syncing to the cloud database.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Offline Vault Records:</span>
              <span className="font-mono font-bold text-emerald-700">{localVaultCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Active Evaluators:</span>
              <span className="font-mono font-bold text-slate-800">
                {new Set(candidates.map((c) => c.interviewer_ign)).size} Staff
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Cloud Sync:</span>
              <span className="font-mono text-emerald-700 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBackupModalOpen(true)}
            className="w-full py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Bulk Import & Backups</span>
          </button>
        </div>
      </div>

      {/* High-Density Candidates Datatable Card */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs space-y-0">
        {/* Controls & Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Records', count: stats.total },
              { id: 'pending', label: 'Pending', count: stats.pending },
              { id: 'accepted', label: 'Admitted', count: stats.accepted },
              { id: 'rejected', label: 'Disqualified', count: stats.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search & Sort Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search IGN, evaluator, notes..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-400"
              />
            </div>

            {/* Rating Filter Dropdown */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Scores</option>
              <option value="5">5.0 ★ Exceptional</option>
              <option value="4+">4.0+ ★ High</option>
              <option value="3+">3.0+ ★ Baseline</option>
              <option value="1-2">1-2 ★ Disqualified</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating_desc">Highest Score</option>
              <option value="rating_asc">Lowest Score</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                <th className="py-3 px-4">Candidate IGN</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Assessment Log & Competencies</th>
                <th className="py-3 px-3">Evaluator</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4 text-right">Admissions Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Synchronizing candidate records...</span>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                    <p className="text-sm font-semibold text-slate-700">No candidate records match your query.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting filters or launch a new evaluation scorecard.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const isAccepted = candidate.status === 'accepted';
                  const isPending = candidate.status === 'pending';
                  const isRejected = candidate.status === 'rejected';

                  return (
                    <tr
                      key={candidate.id}
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setIsCandidateModalOpen(true);
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Candidate Avatar & IGN */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-3">
                          <SkinAvatar ign={candidate.ign} size={32} />
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {candidate.ign}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {candidate.id.substring(0, 10)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 font-mono font-bold text-amber-600">
                          <span>{candidate.rating}.0</span>
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isAccepted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAccepted
                                ? 'bg-emerald-500'
                                : isPending
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {isAccepted ? 'Admitted' : isPending ? 'Pending' : 'Disqualified'}
                        </span>
                      </td>

                      {/* Notes / Assessment Log */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                        <p className="text-slate-700 truncate font-normal">
                          {candidate.notes || <span className="text-slate-400 italic">No notes provided</span>}
                        </p>
                        {candidate.tags && candidate.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {candidate.tags.slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono"
                              >
                                {t}
                              </span>
                            ))}
                            {candidate.tags.length > 2 && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                +{candidate.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Evaluator */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <SkinAvatar ign={candidate.interviewer_ign || 'Staff'} size={20} />
                          <span className="text-slate-700 font-medium">
                            {candidate.interviewer_ign || 'Staff'}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(candidate.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Quick Admissions Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Admit */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(candidate.id, 'accepted', e)}
                            title="Admit candidate to SMP"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isAccepted
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Pending */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(candidate.id, 'pending', e)}
                            title="Mark as pending review"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isPending
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-400 hover:text-amber-700 hover:bg-amber-50'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Disqualify */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(candidate.id, 'rejected', e)}
                            title="Disqualify applicant"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isRejected
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Expand Details */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setIsCandidateModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                            title="Open candidate scorecard"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Modal */}
      <CandidateModal
        candidate={selectedCandidate}
        isOpen={isCandidateModalOpen}
        onClose={() => {
          setIsCandidateModalOpen(false);
          setSelectedCandidate(null);
        }}
        onUpdate={handleUpdateCandidate}
        onDelete={handleDeleteCandidate}
      />

      {/* Backup, Restore & Bulk Import Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        candidates={candidates}
        onImportComplete={(imported) => {
          fetchCandidates();
        }}
        currentStaffName={staffName}
      />
    </div>
  );
}
