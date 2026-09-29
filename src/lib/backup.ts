import { Candidate } from './types';

const VAULT_STORAGE_KEY = 'kdos_interviews_vault';

/**
 * Retrieve all candidates stored in the browser's persistent local vault.
 */
export function getLocalVault(): Candidate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read from local candidate vault:', err);
    return [];
  }
}

/**
 * Save or update a candidate in the local browser vault.
 */
export function saveCandidateToVault(candidate: Candidate): Candidate[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getLocalVault();
    const existingIndex = current.findIndex(
      (c) => c.id === candidate.id || (c.ign && candidate.ign && c.ign.toLowerCase() === candidate.ign.toLowerCase())
    );

    let updated: Candidate[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...candidate, updated_at: new Date().toISOString() };
    } else {
      updated = [candidate, ...current];
    }

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save to local candidate vault:', err);
    return [];
  }
}

/**
 * Save an entire list of candidates to the local vault (merging with existing).
 */
export function syncLocalVaultWithRemote(remoteCandidates: Candidate[]): {
  merged: Candidate[];
  hasNewLocalRecords: boolean;
} {
  if (typeof window === 'undefined') return { merged: remoteCandidates, hasNewLocalRecords: false };
  try {
    const local = getLocalVault();
    const map = new Map<string, Candidate>();

    // Index all remote candidates
    for (const c of remoteCandidates) {
      if (c && c.ign) {
        map.set(c.ign.toLowerCase(), c);
      }
    }

    let hasNewLocalRecords = false;
    // Check if local has any candidates remote doesn't have
    for (const l of local) {
      if (l && l.ign && !map.has(l.ign.toLowerCase())) {
        map.set(l.ign.toLowerCase(), l);
        hasNewLocalRecords = true;
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged));
    return { merged, hasNewLocalRecords };
  } catch (err) {
    console.warn('Failed to sync local vault with remote:', err);
    return { merged: remoteCandidates, hasNewLocalRecords: false };
  }
}

/**
 * Export candidates list to a downloadable JSON file.
 */
export function exportVaultToJson(candidates: Candidate[]) {
  if (typeof window === 'undefined') return;
  const dataStr = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      system: 'KDOS Candidate Management',
      count: candidates.length,
      candidates,
    },
    null,
    2
  );
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kdos_candidates_backup_${new Date().toISOString().substring(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate and parse imported JSON or CSV data.
 */
export function parseImportedCandidates(content: string): Candidate[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // Try JSON first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : parsed.candidates || [];
      return list
        .filter((item: any) => item && typeof item.ign === 'string' && item.ign.trim())
        .map((item: any) => ({
          id: item.id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ign: item.ign.trim(),
          rating: Math.max(1, Math.min(5, Number(item.rating) || 4)),
          notes: item.notes || '',
          interviewer_ign: item.interviewer_ign || 'Staff',
          status: (item.status === 'accepted' || item.status === 'rejected' ? item.status : 'pending') as any,
          tags: Array.isArray(item.tags) ? item.tags : ['Verified Audio/Mic'],
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));
    } catch (e) {
      console.warn('Failed to parse as JSON, falling back to line parser:', e);
    }
  }

  // Line-by-line parser (accepts: "IGN" or "IGN, 5, Great answers, Dream" or "IGN - Notes")
  const lines = trimmed.split('\n');
  const result: Candidate[] = [];

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('#') || cleanLine.toLowerCase().startsWith('ign,')) continue;

    // Check comma or pipe delimited
    const parts = cleanLine.includes('|') ? cleanLine.split('|') : cleanLine.split(',');
    if (parts.length >= 1) {
      const rawIgn = parts[0].trim().replace(/^["']|["']$/g, '');
      if (!rawIgn) continue;

      let rating = 4;
      let notes = '';
      let interviewer = 'Staff';

      if (parts.length >= 2) {
        const maybeRating = Number(parts[1].trim());
        if (!isNaN(maybeRating) && maybeRating >= 1 && maybeRating <= 5) {
          rating = maybeRating;
          if (parts[2]) notes = parts.slice(2).join(', ').trim().replace(/^["']|["']$/g, '');
        } else {
          notes = parts.slice(1).join(', ').trim().replace(/^["']|["']$/g, '');
        }
      }

      result.push({
        id: `c-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ign: rawIgn,
        rating,
        notes,
        interviewer_ign: interviewer,
        status: 'pending',
        tags: ['Verified Audio/Mic'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return result;
}
