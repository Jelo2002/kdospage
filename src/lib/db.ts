import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Candidate, StaffMember, DepartmentHealth, SystemStats, CandidateStatus, StaffStatus } from './types';

// Check if Supabase credentials are configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client, falling back to memory store:', err);
  }
}

// =========================================================
// IN-MEMORY / DEMO STORE FALLBACK (Safe for initial preview & dev)
// =========================================================
const DEMO_CANDIDATE_IGNS = ['Grian', 'MumboJumbo', 'TechnoBlade99', 'GrieferTroll12', 'PixelCraftie'];
const DEMO_STAFF_IGNS = ['Kev_Owner', 'Avery_Dev', 'Sarah_Mod', 'PixelWatcher', 'BlockDoctor', 'InterviewPro', 'EchoVoice', 'MasterBuilderBob'];

const initialCandidates: Candidate[] = [
  {
    id: 'c-1789201774458-l1x93',
    ign: 'va nyavanya',
    rating: 4,
    notes: "he's 19 years old and newbie, experienced mc 3 months. he's good and nicely to answer person to answer my all questions",
    interviewer_ign: 'bunnxyx',
    status: 'pending',
    tags: ['Verified Audio/Mic', 'Advanced Architecture'],
    created_at: '2026-09-12T08:29:34.458Z',
    updated_at: '2026-09-12T08:29:34.458Z',
  },
  {
    id: 'c-1789201758068-hv0iu',
    ign: 'Layooopell2',
    rating: 2,
    notes: 'Hindi masyadong clear yung answers',
    interviewer_ign: '.Avapaica',
    status: 'pending',
    tags: ['Verified Audio/Mic'],
    created_at: '2026-09-12T08:29:18.068Z',
    updated_at: '2026-09-12T08:29:18.068Z',
  },
  {
    id: 'c-1789201595357-jtqu3',
    ign: 'fathersiterior',
    rating: 5,
    notes: 'Magaling sumagot mature sya friendly din',
    interviewer_ign: 'Dream',
    status: 'pending',
    tags: ['Verified Audio/Mic'],
    created_at: '2026-09-12T08:26:35.357Z',
    updated_at: '2026-09-12T08:26:35.357Z',
  },
  {
    id: 'c-1789201184069-90uib',
    ign: 'Goldsheep',
    rating: 4,
    notes: 'Builder po',
    interviewer_ign: 'Lccccccc4755',
    status: 'accepted',
    tags: ['Verified Audio/Mic'],
    created_at: '2026-09-12T08:19:44.069Z',
    updated_at: '2026-09-12T08:20:09.495Z',
  },
];

const initialStaff: StaffMember[] = [
  {
    id: 's-zenku',
    ign: 'Zenku8258',
    discord_tag: 'Zenku8258',
    role: 'Developer',
    department: 'Development & Tech',
    status: 'Active',
    pin: '1234', // Pre-configured default PIN for Zenku8258 Developer
    loa_reason: '[PIN:1234]',
    loa_return_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const DEPARTMENTS_CONFIG = [
  { id: 'recruitment', name: 'Recruitment & Interviews', min_required_staff: 3 },
  { id: 'moderation', name: 'Server Moderation', min_required_staff: 4 },
  { id: 'development', name: 'Development & Tech', min_required_staff: 2 },
  { id: 'building', name: 'Building & World Design', min_required_staff: 2 },
  { id: 'events', name: 'Community & Events', min_required_staff: 2 },
];

// Global in-memory cache for serverless lifecycle
let memoryCandidates: Candidate[] = [...initialCandidates];
let memoryStaff: StaffMember[] = [...initialStaff];

// =========================================================
// CANDIDATES DATABASE ACCESS
// =========================================================

export async function getCandidates(filters?: {
  status?: string;
  minRating?: number;
  search?: string;
  interviewer?: string;
  sort?: 'newest' | 'oldest' | 'rating_desc' | 'rating_asc';
}): Promise<Candidate[]> {
  if (supabase) {
    let query = supabase.from('candidates').select('*');
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.minRating) {
      query = query.gte('rating', filters.minRating);
    }
    if (filters?.interviewer) {
      query = query.eq('interviewer_ign', filters.interviewer);
    }
    if (filters?.search) {
      query = query.or(`ign.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    if (filters?.sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (filters?.sort === 'rating_desc') {
      query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
    } else if (filters?.sort === 'rating_asc') {
      query = query.order('rating', { ascending: true }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    let { data, error } = await query;
    if (!error && data) {
      // Purge and exclude any demo candidates from Supabase
      const hasDemo = data.some(c => DEMO_CANDIDATE_IGNS.includes(c.ign));
      if (hasDemo) {
        supabase.from('candidates').delete().in('ign', DEMO_CANDIDATE_IGNS).then(() => {});
        data = data.filter(c => !DEMO_CANDIDATE_IGNS.includes(c.ign));
      }
      if (data.length === 0 && !filters?.status && !filters?.search && !filters?.minRating && !filters?.interviewer) {
        // Auto-seed initial recovered candidates into fresh Supabase database
        for (const initCand of initialCandidates) {
          try {
            await supabase.from('candidates').insert({
              ign: initCand.ign,
              rating: initCand.rating,
              notes: initCand.notes,
              interviewer_ign: initCand.interviewer_ign,
              status: initCand.status,
              tags: initCand.tags,
              created_at: initCand.created_at,
              updated_at: initCand.updated_at,
            });
          } catch (e) {
            console.warn('Failed to seed initial candidate to Supabase:', e);
          }
        }
        return [...initialCandidates];
      }
      return data as Candidate[];
    }
  }

  // Memory fallback
  let list = [...memoryCandidates];
  if (filters?.status && filters.status !== 'all') {
    list = list.filter(c => c.status === filters.status);
  }
  if (filters?.minRating) {
    list = list.filter(c => c.rating >= filters.minRating!);
  }
  if (filters?.interviewer) {
    list = list.filter(c => c.interviewer_ign.toLowerCase() === filters.interviewer!.toLowerCase());
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(c => c.ign.toLowerCase().includes(q) || (c.notes && c.notes.toLowerCase().includes(q)));
  }

  if (filters?.sort === 'oldest') {
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (filters?.sort === 'rating_desc') {
    list.sort((a, b) => b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (filters?.sort === 'rating_asc') {
    list.sort((a, b) => a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return list;
}

export async function createCandidate(data: {
  ign: string;
  rating: number;
  notes: string;
  interviewer_ign?: string;
  tags?: string[];
}): Promise<Candidate> {
  const newCandidate: Candidate = {
    id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ign: data.ign.trim(),
    rating: Math.max(1, Math.min(5, Number(data.rating) || 1)),
    notes: data.notes || '',
    interviewer_ign: data.interviewer_ign?.trim() || 'Staff',
    status: 'pending',
    tags: data.tags || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Critical Audit Log: Ensure Vercel runtime logs ALWAYS record full candidate payload
  console.log('[KDOS_CANDIDATE_AUDIT]', JSON.stringify({
    event: 'CANDIDATE_SUBMITTED',
    candidate: newCandidate,
    timestamp: new Date().toISOString(),
  }));

  if (supabase) {
    try {
      const { data: inserted, error } = await supabase.from('candidates').insert({
        ign: newCandidate.ign,
        rating: newCandidate.rating,
        notes: newCandidate.notes,
        interviewer_ign: newCandidate.interviewer_ign,
        status: newCandidate.status,
        tags: newCandidate.tags,
      }).select().single();

      if (!error && inserted) return inserted as Candidate;
    } catch (err) {
      console.warn('Supabase createCandidate exception, falling back to memory:', err);
    }
  }

  memoryCandidates.unshift(newCandidate);
  return newCandidate;
}

export async function syncCandidates(candidatesToSync: Candidate[]): Promise<{ added: number; updated: number; total: number; candidates: Candidate[] }> {
  let added = 0;
  let updated = 0;

  for (const item of candidatesToSync) {
    if (!item || !item.ign) continue;
    const cleanIgn = item.ign.trim();
    const existingIdx = memoryCandidates.findIndex(c => c.ign.toLowerCase() === cleanIgn.toLowerCase());

    const candidateData: Candidate = {
      id: item.id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ign: cleanIgn,
      rating: Math.max(1, Math.min(5, Number(item.rating) || 4)),
      notes: item.notes || '',
      interviewer_ign: item.interviewer_ign || 'Staff',
      status: (item.status === 'accepted' || item.status === 'rejected' ? item.status : 'pending') as CandidateStatus,
      tags: Array.isArray(item.tags) ? item.tags : ['Verified Audio/Mic'],
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      memoryCandidates[existingIdx] = {
        ...memoryCandidates[existingIdx],
        ...candidateData,
      };
      updated++;
    } else {
      memoryCandidates.unshift(candidateData);
      added++;
    }

    if (supabase) {
      try {
        const { data: existing } = await supabase.from('candidates').select('id').ilike('ign', cleanIgn).maybeSingle();
        if (existing) {
          await supabase.from('candidates').update({
            rating: candidateData.rating,
            notes: candidateData.notes,
            interviewer_ign: candidateData.interviewer_ign,
            status: candidateData.status,
            tags: candidateData.tags,
            updated_at: candidateData.updated_at,
          }).eq('id', existing.id);
        } else {
          await supabase.from('candidates').insert({
            ign: candidateData.ign,
            rating: candidateData.rating,
            notes: candidateData.notes,
            interviewer_ign: candidateData.interviewer_ign,
            status: candidateData.status,
            tags: candidateData.tags,
            created_at: candidateData.created_at,
            updated_at: candidateData.updated_at,
          });
        }
      } catch (err) {
        console.warn('Supabase syncCandidate error:', err);
      }
    }
  }

  console.log('[KDOS_SYNC_AUDIT]', JSON.stringify({
    event: 'CANDIDATES_SYNCED',
    added,
    updated,
    total: memoryCandidates.length,
    timestamp: new Date().toISOString(),
  }));

  return { added, updated, total: memoryCandidates.length, candidates: memoryCandidates };
}

export async function updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | null> {
  if (supabase) {
    const { data, error } = await supabase.from('candidates').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();

    if (!error && data) return data as Candidate;
  }

  const idx = memoryCandidates.findIndex(c => c.id === id);
  if (idx === -1) return null;

  memoryCandidates[idx] = {
    ...memoryCandidates[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return memoryCandidates[idx];
}

export async function deleteCandidate(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    if (!error) return true;
  }

  const initialLength = memoryCandidates.length;
  memoryCandidates = memoryCandidates.filter(c => c.id !== id);
  return memoryCandidates.length < initialLength;
}

// =========================================================
// STAFF MEMBERS DATABASE ACCESS
// =========================================================

export function parseStaffRow(row: any): StaffMember {
  let pin = row.pin || null;
  let loaReason = row.loa_reason || null;

  // Smart fallback: If 'pin' column is missing/null in PostgreSQL, decode it from loa_reason
  if (!pin && loaReason && typeof loaReason === 'string') {
    const pinMatch = loaReason.match(/^\[PIN:([^\]]+)\]\s*(.*)$/);
    if (pinMatch) {
      pin = pinMatch[1].trim();
      loaReason = pinMatch[2] ? pinMatch[2].trim() : null;
    }
  }

  return {
    id: row.id,
    ign: row.ign,
    discord_tag: row.discord_tag || '',
    role: row.role,
    department: row.department,
    status: row.status || 'Active',
    pin: pin,
    loa_reason: loaReason,
    loa_return_date: row.loa_return_date || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getStaff(filters?: {
  department?: string;
  status?: string;
  search?: string;
}): Promise<StaffMember[]> {
  if (supabase) {
    let query = supabase.from('staff').select('*');
    if (filters?.department && filters.department !== 'all') {
      query = query.eq('department', filters.department);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`ign.ilike.%${filters.search}%,discord_tag.ilike.%${filters.search}%`);
    }
    query = query.order('created_at', { ascending: false });

    let { data, error } = await query;
    if (!error && data) {
      // Purge and exclude any demo staff from Supabase
      const hasDemo = data.some(s => DEMO_STAFF_IGNS.includes(s.ign));
      if (hasDemo) {
        supabase.from('staff').delete().in('ign', DEMO_STAFF_IGNS).then(() => {});
        data = data.filter(s => !DEMO_STAFF_IGNS.includes(s.ign));
      }
      return data.map(parseStaffRow);
    }
  }

  let list = [...memoryStaff];
  if (filters?.department && filters.department !== 'all') {
    list = list.filter(s => s.department.toLowerCase() === filters.department!.toLowerCase());
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter(s => s.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(s => s.ign.toLowerCase().includes(q) || (s.discord_tag && s.discord_tag.toLowerCase().includes(q)));
  }

  return list;
}

export async function createStaff(data: {
  ign: string;
  discord_tag?: string;
  role: StaffMember['role'];
  department: string;
  status?: StaffStatus;
  pin?: string | null;
  loa_reason?: string;
  loa_return_date?: string;
}): Promise<StaffMember> {
  const newStaff: StaffMember = {
    id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ign: data.ign.trim(),
    discord_tag: data.discord_tag?.trim() || '',
    role: data.role,
    department: data.department.trim(),
    status: data.status || 'Active',
    pin: data.pin || null,
    loa_reason: data.loa_reason || null,
    loa_return_date: data.loa_return_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      // Encode PIN into loa_reason as guaranteed fallback in case remote Supabase lacks 'pin' column
      let encodedReason = newStaff.loa_reason;
      if (newStaff.pin) {
        encodedReason = `[PIN:${newStaff.pin}] ${newStaff.loa_reason || ''}`.trim();
      }

      const payload: any = {
        ign: newStaff.ign,
        discord_tag: newStaff.discord_tag,
        role: newStaff.role,
        department: newStaff.department,
        status: newStaff.status,
        loa_reason: encodedReason,
        loa_return_date: newStaff.loa_return_date,
      };
      if (newStaff.pin !== undefined) {
        payload.pin = newStaff.pin;
      }

      let { data: inserted, error } = await supabase.from('staff').insert(payload).select().single();

      // If remote table is missing 'pin' column, retry insert without pin column (loa_reason already holds encoded PIN)
      if (error && error.message && error.message.toLowerCase().includes('pin')) {
        delete payload.pin;
        const retry = await supabase.from('staff').insert(payload).select().single();
        inserted = retry.data;
        error = retry.error;
      }

      if (!error && inserted) {
        const result = parseStaffRow(inserted);
        if (newStaff.pin) result.pin = newStaff.pin;
        memoryStaff.unshift(result);
        return result;
      }
      if (error) {
        console.warn('Supabase createStaff error, falling back to memory:', error.message);
      }
    } catch (err) {
      console.warn('Supabase createStaff exception:', err);
    }
  }

  memoryStaff.unshift(newStaff);
  return newStaff;
}

export async function updateStaff(id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      const payload: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // If updating pin, also encode it into loa_reason as permanent fallback
      if (updates.pin !== undefined) {
        if (updates.pin) {
          const currentReason = updates.loa_reason || '';
          payload.loa_reason = `[PIN:${updates.pin}] ${currentReason.replace(/^\[PIN:[^\]]+\]\s*/, '')}`.trim();
        } else {
          payload.loa_reason = null;
        }
      }

      let query = supabase.from('staff').update(payload);
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        const cleanName = id.replace(/^s-/, '');
        query = query.or(`ign.ilike.${cleanName},discord_tag.ilike.${cleanName}`);
      }

      let { data, error } = await query.select().single();

      // If remote table is missing 'pin' column, retry update without pin column (loa_reason has the PIN!)
      if (error && error.message && error.message.toLowerCase().includes('pin')) {
        delete payload.pin;
        let retryQuery = supabase.from('staff').update(payload);
        if (isUuid) {
          retryQuery = retryQuery.eq('id', id);
        } else {
          const cleanName = id.replace(/^s-/, '');
          retryQuery = retryQuery.or(`ign.ilike.${cleanName},discord_tag.ilike.${cleanName}`);
        }
        const retry = await retryQuery.select().single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const res = parseStaffRow(data);
        if (updates.pin !== undefined) res.pin = updates.pin;
        const idx = memoryStaff.findIndex(s => s.id === id || s.ign.toLowerCase() === res.ign.toLowerCase());
        if (idx !== -1) memoryStaff[idx] = res;
        else memoryStaff.unshift(res);
        return res;
      }
    } catch (e) {
      console.warn('Supabase updateStaff exception:', e);
    }
  }

  const idx = memoryStaff.findIndex(s => 
    s.id === id || 
    s.ign.toLowerCase() === id.toLowerCase() || 
    (s.discord_tag && s.discord_tag.toLowerCase() === id.toLowerCase()) ||
    s.ign.toLowerCase() === id.replace(/^s-/, '').toLowerCase()
  );
  if (idx === -1) return null;

  memoryStaff[idx] = {
    ...memoryStaff[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return memoryStaff[idx];
}

export async function deleteStaff(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (!error) return true;
  }

  const initialLength = memoryStaff.length;
  memoryStaff = memoryStaff.filter(s => s.id !== id);
  return memoryStaff.length < initialLength;
}

// =========================================================
// DEPARTMENT HEALTH & DEFICIENCY TRACKER
// =========================================================

export async function getDepartmentsHealth(): Promise<DepartmentHealth[]> {
  const allStaff = await getStaff();

  return DEPARTMENTS_CONFIG.map(dept => {
    const deptStaff = allStaff.filter(s => s.department.toLowerCase() === dept.name.toLowerCase() || s.department.toLowerCase() === dept.id.toLowerCase());
    const total_staff = deptStaff.length;
    const active_staff = deptStaff.filter(s => s.status === 'Active').length;
    const loa_staff = deptStaff.filter(s => s.status === 'LOA').length;
    const hiatus_staff = deptStaff.filter(s => s.status === 'Hiatus').length;
    const is_lacking = active_staff < dept.min_required_staff;
    const deficiency_count = is_lacking ? dept.min_required_staff - active_staff : 0;

    return {
      id: dept.id,
      name: dept.name,
      min_required_staff: dept.min_required_staff,
      total_staff,
      active_staff,
      loa_staff,
      hiatus_staff,
      is_lacking,
      deficiency_count,
    };
  });
}

// =========================================================
// SYSTEM STATS
// =========================================================

export async function getStats(): Promise<SystemStats> {
  const candidates = await getCandidates();
  const staff = await getStaff();
  const deptHealth = await getDepartmentsHealth();

  const total = candidates.length;
  const accepted = candidates.filter(c => c.status === 'accepted').length;
  const pending = candidates.filter(c => c.status === 'pending').length;
  const rejected = candidates.filter(c => c.status === 'rejected').length;
  const avgRating = total > 0 ? Number((candidates.reduce((sum, c) => sum + c.rating, 0) / total).toFixed(1)) : 0;

  const staffActive = staff.filter(s => s.status === 'Active').length;
  const staffLoa = staff.filter(s => s.status === 'LOA').length;
  const staffHiatus = staff.filter(s => s.status === 'Hiatus').length;
  const lackingDepartmentsCount = deptHealth.filter(d => d.is_lacking).length;

  return {
    candidates: { total, accepted, pending, rejected, avgRating },
    staff: {
      total: staff.length,
      active: staffActive,
      loa: staffLoa,
      hiatus: staffHiatus,
      lackingDepartmentsCount,
    },
  };
}

export async function getAcceptedWhitelist(): Promise<{ ignList: string[]; commands: string[]; json: any[] }> {
  const candidates = await getCandidates({ status: 'accepted' });
  const ignList = candidates.map(c => c.ign);
  const commands = ignList.map(ign => `/whitelist add ${ign}`);
  const json = ignList.map(ign => ({
    name: ign,
  }));

  return { ignList, commands, json };
}

// =========================================================
// DISCORD & PIN AUTHENTICATION HELPERS
// =========================================================

function normalizeDiscord(tag?: string): string {
  if (!tag) return '';
  return tag.trim().toLowerCase().replace(/^@/, '');
}

export async function findStaffByDiscord(discordTag: string): Promise<StaffMember | null> {
  const normalized = normalizeDiscord(discordTag);
  if (!normalized) return null;

  const staff = await getStaff();
  
  let found = staff.find(s => {
    const sTag = normalizeDiscord(s.discord_tag);
    const sIgn = normalizeDiscord(s.ign);
    return sTag === normalized || sTag.split('#')[0] === normalized || sIgn === normalized;
  }) || null;

  // Auto-bootstrap Zenku8258 as Developer if not yet in database (e.g., in a fresh Supabase database)
  const defaultZenkuPin = (process.env.ZENKU_PIN || process.env.ADMIN_PIN || '1234').trim();

  if (!found && (normalized === 'zenku8258' || normalized === 'zenku')) {
    try {
      found = await createStaff({
        ign: 'Zenku8258',
        discord_tag: 'Zenku8258',
        role: 'Developer',
        department: 'Development & Tech',
        status: 'Active',
        pin: defaultZenkuPin,
      });
    } catch (e) {
      console.error('Failed to auto-provision Zenku8258:', e);
      found = {
        id: 's-zenku',
        ign: 'Zenku8258',
        discord_tag: 'Zenku8258',
        role: 'Developer',
        department: 'Development & Tech',
        status: 'Active',
        pin: defaultZenkuPin,
        loa_reason: `[PIN:${defaultZenkuPin}]`,
        loa_return_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryStaff.unshift(found);
    }
  }

  // Guarantee Zenku8258 ALWAYS has a valid PIN so it never falls into setup mode
  if (found && !found.pin && (normalized === 'zenku8258' || normalized === 'zenku')) {
    found.pin = defaultZenkuPin;
  }

  return found;
}

export async function setStaffPin(idOrTag: string, pin: string, discordTag?: string): Promise<StaffMember | null> {
  const cleanPin = pin.trim();

  // Try direct update by idOrTag first
  let updated = await updateStaff(idOrTag, { pin: cleanPin });
  if (updated) return updated;

  // Search staff to find the real record by tag or ign
  const tagToSearch = discordTag || idOrTag;
  const staff = await getStaff();
  const normalized = normalizeDiscord(tagToSearch);
  const found = staff.find(s => 
    s.id === idOrTag || 
    normalizeDiscord(s.discord_tag) === normalized || 
    normalizeDiscord(s.ign) === normalized ||
    s.id === `s-${normalized}`
  );

  if (found) {
    updated = await updateStaff(found.id, { pin: cleanPin });
    if (updated) return updated;
  }

  // Memory fallback
  const idx = memoryStaff.findIndex(s => 
    s.id === idOrTag || 
    normalizeDiscord(s.discord_tag) === normalized || 
    normalizeDiscord(s.ign) === normalized
  );
  if (idx !== -1) {
    memoryStaff[idx].pin = cleanPin;
    memoryStaff[idx].updated_at = new Date().toISOString();
    return memoryStaff[idx];
  }

  return null;
}

export async function resetStaffPin(idOrTag: string): Promise<StaffMember | null> {
  let updated = await updateStaff(idOrTag, { pin: null, loa_reason: null });
  if (updated) return updated;

  const staff = await getStaff();
  const normalized = normalizeDiscord(idOrTag);
  const found = staff.find(s => 
    s.id === idOrTag || 
    normalizeDiscord(s.discord_tag) === normalized || 
    normalizeDiscord(s.ign) === normalized ||
    s.id === `s-${normalized}`
  );

  if (found) {
    updated = await updateStaff(found.id, { pin: null, loa_reason: null });
    if (updated) return updated;
  }

  const idx = memoryStaff.findIndex(s => 
    s.id === idOrTag || 
    normalizeDiscord(s.discord_tag) === normalized || 
    normalizeDiscord(s.ign) === normalized
  );
  if (idx !== -1) {
    memoryStaff[idx].pin = null;
    memoryStaff[idx].updated_at = new Date().toISOString();
    return memoryStaff[idx];
  }
  return null;
}


