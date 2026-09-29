export type CandidateStatus = 'pending' | 'accepted' | 'rejected';

export interface Candidate {
  id: string;
  ign: string;
  rating: number; // 1 to 5 stars
  notes: string;
  interviewer_ign: string;
  status: CandidateStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type StaffRole = 'Owner' | 'Developer' | 'Admin' | 'Moderator' | 'Interviewer' | 'Builder';

export type StaffStatus = 'Active' | 'Hiatus' | 'LOA' | 'Inactive';

export interface StaffMember {
  id: string;
  ign: string;
  discord_tag: string;
  role: StaffRole;
  department: string;
  status: StaffStatus;
  pin?: string | null;
  loa_reason?: string | null;
  loa_return_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentHealth {
  id: string;
  name: string;
  min_required_staff: number;
  total_staff: number;
  active_staff: number;
  loa_staff: number;
  hiatus_staff: number;
  is_lacking: boolean; // true if active_staff < min_required_staff
  deficiency_count: number; // min_required_staff - active_staff (if > 0)
}

export type ActiveRole = 'Owner' | 'Developer' | 'Admin' | 'Staff/Interviewer';

export interface AuthUser {
  id?: string;
  ign: string;
  discord_tag: string;
  role: ActiveRole;
  department?: string;
  loginTime: string;
  remember?: boolean;
}

export interface SystemStats {
  candidates: {
    total: number;
    accepted: number;
    pending: number;
    rejected: number;
    avgRating: number;
  };
  staff: {
    total: number;
    active: number;
    loa: number;
    hiatus: number;
    lackingDepartmentsCount: number;
  };
}
