export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'SKIP_LEVEL_MANAGER' | 'HR_DIRECTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  jobTitle?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  skipLevelManagerId?: string | null;
  avatarUrl?: string | null;
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

export interface WorkplaceRequest {
  id: string;
  case_number: string;
  employee_id: string;
  employee_name?: string;
  employee_avatar?: string;
  category_code: string;
  title: string;
  description: string;
  status: RequestStatus;
  priority: PriorityLevel;
  severity: string;
  sensitivity: SensitivityLevel;
  impact_level: string;
  department_id?: string;
  department_name?: string;
  team_id?: string;
  team_name?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  manager_id?: string;
  due_at?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  ai_summary?: string;
  ai_recommendation?: string;
  confidential: boolean;
  requires_immediate_escalation: boolean;
  created_at: string;
  updated_at: string;
  response_time_hours?: number;
  resolution_time_hours?: number;
  history?: RequestStatusHistory[];
  comments?: RequestComment[];
  escalations?: any[];
  feedback?: any;
}

export interface RequestStatusHistory {
  id: string;
  request_id: string;
  actor_name: string;
  previous_status: string;
  new_status: string;
  comment?: string;
  action_type: string;
  created_at: string;
}

export interface RequestComment {
  id: string;
  request_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  is_internal_note: boolean;
  created_at: string;
}

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

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type_id: string;
  leave_type_name: string;
  leave_type_code: string;
  importance_level: string;
  total_allocated: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
  year: number;
}

export interface LeaveRequest {
  id: string;
  case_number: string;
  employee_id: string;
  employee_name?: string;
  employee_avatar?: string;
  leave_type_id: string;
  leave_type_name: string;
  leave_type_code: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  reason: string;
  importance: 'NORMAL' | 'HIGH_IMPORTANCE' | 'EXCEPTIONAL' | 'CRITICAL';
  status: LeaveStatus;
  manager_id?: string;
  manager_name?: string;
  current_reviewing_authority_name?: string;
  initial_manager_decision?: string;
  initial_manager_decision_at?: string;
  initial_rejection_reason?: string;
  second_manager_decision?: string;
  second_manager_decision_at?: string;
  second_rejection_reason?: string;
  higher_review_decision?: string;
  higher_review_decision_at?: string;
  higher_review_reason?: string;
  policy_eligible: boolean;
  team_availability_percent: number;
  project_impact_level: string;
  reconsideration_count: number;
  ai_analysis?: string;
  created_at: string;
  decisionHistory?: any[];
  reconsiderations?: any[];
  escalations?: any[];
}

export interface CompanyPolicy {
  id: string;
  category: string;
  title: string;
  code: string;
  content: string;
  summary: string;
  applies_to: string;
  version: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ACTION_REQUIRED' | 'ESCALATION' | 'APPROVAL' | 'REJECTION';
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}
