export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'SKIP_LEVEL_MANAGER' | 'HR_DIRECTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  jobTitle: string;
  departmentId?: string | null;
  teamId?: string | null;
  managerId?: string | null;
  skipLevelManagerId?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  location?: string | null;
}

export type RequestStatus =
  | 'NEW'
  | 'AI_ANALYSIS'
  | 'WAITING_FOR_EMPLOYEE'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_TEAM'
  | 'WAITING_FOR_APPROVAL'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SensitivityLevel = 'NORMAL' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL';
export type ImpactLevel = 'INDIVIDUAL' | 'TEAM' | 'DEPARTMENT' | 'ORGANIZATION' | 'SAFETY';

export type LeaveImportance = 'NORMAL' | 'HIGH_IMPORTANCE' | 'EXCEPTIONAL' | 'CRITICAL';

export type LeaveStatus =
  | 'PENDING_MANAGER_REVIEW'
  | 'REJECTED'
  | 'RECONSIDERATION_REQUESTED'
  | 'PENDING_MANAGER_RECONSIDERATION'
  | 'REJECTED_AFTER_RECONSIDERATION'
  | 'HIGHER_REVIEW_REQUESTED'
  | 'PENDING_HIGHER_REVIEW'
  | 'APPROVED_AFTER_RECONSIDERATION'
  | 'APPROVED_AFTER_ESCALATION'
  | 'FINALLY_REJECTED'
  | 'APPROVED'
  | 'CANCELLED';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}
