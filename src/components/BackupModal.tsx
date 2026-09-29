'use client';

import React, { useState } from 'react';
import { Candidate } from '@/lib/types';
import { 
  parseImportedCandidates, 
  exportVaultToJson, 
  getLocalVault, 
  saveCandidateToVault 
} from '@/lib/backup';
import { 
  X, 
  Download, 
  Upload, 
  FileText, 
  ShieldCheck, 
  Database, 
  Check, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  onImportComplete: (imported: Candidate[]) => void;
  currentStaffName?: string;
}

export default function BackupModal({
  isOpen,
  onClose,
  candidates,
  onImportComplete,
  currentStaffName = 'Staff',
}: BackupModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'file' | 'export'>('quick');
  const [pasteText, setPasteText] = useState('');
  const [defaultEvaluator, setDefaultEvaluator] = useState(currentStaffName);
  const [defaultRating, setDefaultRating] = useState(4);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const localVaultCount = getLocalVault().length;

  const handleQuickPasteImport = async () => {
    if (!pasteText.trim()) return;
    setIsProcessing(true);
    setResultMessage(null);

    try {
      const parsed = parseImportedCandidates(pasteText);
      if (parsed.length === 0) {
        setResultMessage({ type: 'error', text: 'No valid IGNs or candidates found in text.' });
        setIsProcessing(false);
        return;
      }

      // Fill in user-selected defaults if missing
      const enriched = parsed.map((c) => ({
        ...c,
        interviewer_ign: c.interviewer_ign === 'Staff' && defaultEvaluator ? defaultEvaluator : c.interviewer_ign,
        rating: c.rating || defaultRating,
      }));

      // 1. Save to local browser vault immediately
      for (const item of enriched) {
        saveCandidateToVault(item);
      }

      // 2. Sync to server
      const res = await fetch('/api/candidates/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: enriched }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server sync failed, but records are secured in your local vault.');
      }

      setResultMessage({
        type: 'success',
        text: `Successfully imported & synchronized ${enriched.length} applicant records!`,
      });
      onImportComplete(enriched);
      setPasteText('');
    } catch (err: any) {
      setResultMessage({
        type: 'error',
        text: err.message || 'Error importing candidates.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      setIsProcessing(true);
      setResultMessage(null);
      try {
        const parsed = parseImportedCandidates(content);
        if (parsed.length === 0) {
          setResultMessage({ type: 'error', text: 'No valid candidates found in uploaded file.' });
          setIsProcessing(false);
          return;
        }

        for (const item of parsed) {
          saveCandidateToVault(item);
        }

        const res = await fetch('/api/candidates/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidates: parsed }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Server sync failed.');
        }

        setResultMessage({
          type: 'success',
          text: `Successfully restored ${parsed.length} candidate scorecards!`,
        });
        onImportComplete(parsed);
      } catch (err: any) {
        setResultMessage({ type: 'error', text: err.message || 'Error processing file.' });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-clivax-card border border-clivax-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-clivax-border bg-clivax-sidebar/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Decentralized Vault & Bulk Importer</h2>
              <p className="text-[11px] text-slate-400">Restore candidate logs and download JSON archives</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-clivax-border bg-clivax-bg px-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('quick'); setResultMessage(null); }}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'quick'
                ? 'border-clivax-primary text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste List / Quick Import
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('file'); setResultMessage(null); }}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'file'
                ? 'border-clivax-primary text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Restore JSON File
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('export'); setResultMessage(null); }}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'border-clivax-primary text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Export Backup
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {resultMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                resultMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {resultMessage.type === 'success' ? (
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              )}
              <span className="font-medium">{resultMessage.text}</span>
            </div>
          )}

          {activeTab === 'quick' && (
            <div className="space-y-3.5">
              <p className="text-slate-400">
                Paste applicant names or lines from Discord, Minecraft logs, or Chrome autofill. Format can be simple IGNs, or <span className="font-mono text-slate-300">IGN, Rating, Notes</span>:
              </p>

              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Example:\nPlayerOne\nPlayerTwo, 5, Builder from SMP\nPlayerThree | 4 | Great mic and communication`}
                className="w-full p-3 rounded-xl bg-clivax-bg border border-clivax-border text-slate-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-clivax-primary resize-none placeholder-slate-600"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Default Evaluator</label>
                  <input
                    type="text"
                    value={defaultEvaluator}
                    onChange={(e) => setDefaultEvaluator(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-clivax-bg border border-clivax-border text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-clivax-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Default Score</label>
                  <select
                    value={defaultRating}
                    onChange={(e) => setDefaultRating(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-clivax-bg border border-clivax-border text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-clivax-primary"
                  >
                    <option value={5}>5.0 Stars (Exceptional)</option>
                    <option value={4}>4.0 Stars (Strong)</option>
                    <option value={3}>3.0 Stars (Acceptable)</option>
                    <option value={2}>2.0 Stars (Poor)</option>
                    <option value={1}>1.0 Star (Disqualified)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickPasteImport}
                disabled={isProcessing || !pasteText.trim()}
                className="w-full py-2.5 rounded-xl font-bold bg-clivax-primary hover:bg-emerald-400 text-slate-950 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20 mt-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Import & Restore Candidates</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <p className="text-slate-400">
                Upload a JSON backup file or past candidate export to instantly re-populate your candidate database:
              </p>

              <label className="border-2 border-dashed border-clivax-border hover:border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-clivax-bg/50 hover:bg-clivax-bg transition-colors">
                <Upload className="w-7 h-7 text-clivax-primary" />
                <span className="text-xs font-semibold text-slate-200">Click to select backup file (.json)</span>
                <span className="text-[11px] text-slate-500">Supports full KDOS JSON backup format</span>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-slate-400">
                Download a complete standalone JSON archive of all candidate records, ratings, interview notes, and timestamps:
              </p>

              <div className="p-4 rounded-xl bg-clivax-sidebar/80 border border-clivax-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-100">Full System Snapshot</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {candidates.length} candidate scorecards available
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => exportVaultToJson(candidates)}
                  disabled={candidates.length === 0}
                  className="px-4 py-2 rounded-lg font-semibold bg-clivax-primary hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* Local Vault Status */}
          <div className="p-3.5 rounded-xl bg-clivax-bg border border-clivax-border flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Local Device Vault: <strong className="text-emerald-400 font-mono">{localVaultCount}</strong> records preserved
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
