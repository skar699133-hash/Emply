-- Nexora Workplace AI Platform Schema
-- PostgreSQL Compliant

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  head_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  lead_user_id TEXT,
  min_coverage_percent INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('EMPLOYEE', 'MANAGER', 'SKIP_LEVEL_MANAGER', 'HR_DIRECTOR', 'ADMIN')),
  job_title TEXT NOT NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  skip_level_manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  avatar_url TEXT,
  phone TEXT,
  location TEXT DEFAULT 'San Francisco HQ',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  lead_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'CONTRIBUTOR',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS request_categories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  default_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  default_priority TEXT DEFAULT 'MEDIUM',
  is_sensitive BOOLEAN DEFAULT FALSE,
  requires_immediate_escalation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_slas (
  id TEXT PRIMARY KEY,
  category_code TEXT REFERENCES request_categories(code) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  response_time_hours INTEGER NOT NULL,
  resolution_time_hours INTEGER NOT NULL,
  escalation_threshold_hours INTEGER NOT NULL,
  business_hours_only BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_code, priority)
);

CREATE TABLE IF NOT EXISTS workplace_requests (
  id TEXT PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  employee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL REFERENCES request_categories(code),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (
    status IN (
      'NEW', 'AI_ANALYSIS', 'WAITING_FOR_EMPLOYEE', 'ASSIGNED',
      'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_FOR_TEAM',
      'WAITING_FOR_APPROVAL', 'ESCALATED', 'RESOLVED', 'CLOSED', 'REOPENED'
    )
  ),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  sensitivity TEXT NOT NULL DEFAULT 'NORMAL' CHECK (sensitivity IN ('NORMAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL')),
  impact_level TEXT NOT NULL DEFAULT 'INDIVIDUAL' CHECK (impact_level IN ('INDIVIDUAL', 'TEAM', 'DEPARTMENT', 'ORGANIZATION', 'SAFETY')),
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  assigned_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  sla_id TEXT REFERENCES request_slas(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  ai_summary TEXT,
  ai_recommendation TEXT,
  employee_confirmed BOOLEAN DEFAULT TRUE,
  confidential BOOLEAN DEFAULT FALSE,
  requires_human_review BOOLEAN DEFAULT TRUE,
  requires_immediate_escalation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_status_history (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES workplace_requests(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  comment TEXT,
  action_type TEXT DEFAULT 'STATUS_CHANGE',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_comments (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES workplace_requests(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE,
  is_ai_note BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_escalations (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES workplace_requests(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('SLA_ESCALATION', 'MANUAL_ESCALATION', 'EMERGENCY_ESCALATION')),
  triggered_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  from_authority_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  to_authority_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_types (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  default_days_per_year INTEGER NOT NULL,
  requires_documentation BOOLEAN DEFAULT FALSE,
  importance_level TEXT DEFAULT 'NORMAL' CHECK (importance_level IN ('NORMAL', 'HIGH_IMPORTANCE', 'EXCEPTIONAL', 'CRITICAL')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id TEXT NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  total_allocated NUMERIC(5,1) NOT NULL,
  used_days NUMERIC(5,1) DEFAULT 0,
  pending_days NUMERIC(5,1) DEFAULT 0,
  remaining_days NUMERIC(5,1) NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  employee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id TEXT NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days NUMERIC(4,1) NOT NULL,
  reason TEXT NOT NULL,
  importance TEXT NOT NULL DEFAULT 'NORMAL' CHECK (importance IN ('NORMAL', 'HIGH_IMPORTANCE', 'EXCEPTIONAL', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'PENDING_MANAGER_REVIEW' CHECK (
    status IN (
      'PENDING_MANAGER_REVIEW',
      'REJECTED',
      'RECONSIDERATION_REQUESTED',
      'PENDING_MANAGER_RECONSIDERATION',
      'REJECTED_AFTER_RECONSIDERATION',
      'HIGHER_REVIEW_REQUESTED',
      'PENDING_HIGHER_REVIEW',
      'APPROVED_AFTER_RECONSIDERATION',
      'APPROVED_AFTER_ESCALATION',
      'FINALLY_REJECTED',
      'APPROVED',
      'CANCELLED'
    )
  ),
  manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  current_reviewing_authority_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  current_reviewing_authority_role TEXT DEFAULT 'MANAGER',
  initial_manager_decision TEXT,
  initial_manager_decision_at TIMESTAMPTZ,
  initial_rejection_reason TEXT,
  second_manager_decision TEXT,
  second_manager_decision_at TIMESTAMPTZ,
  second_rejection_reason TEXT,
  higher_review_decision TEXT,
  higher_review_decision_at TIMESTAMPTZ,
  higher_review_reason TEXT,
  ai_analysis TEXT, -- JSON blob of analysis
  policy_eligible BOOLEAN DEFAULT TRUE,
  team_availability_percent INTEGER DEFAULT 100,
  project_impact_level TEXT DEFAULT 'LOW',
  reconsideration_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_reconsiderations (
  id TEXT PRIMARY KEY,
  leave_request_id TEXT NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL,
  manager_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  manager_response TEXT,
  manager_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_escalations (
  id TEXT PRIMARY KEY,
  leave_request_id TEXT NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (
    trigger_type IN ('SLA_ESCALATION', 'RECONSIDERATION', 'HIGHER_LEVEL_REVIEW', 'FAIRNESS_REVIEW', 'EMERGENCY_ESCALATION')
  ),
  triggered_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  from_authority_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  to_authority_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNDER_REVIEW', 'RESOLVED')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS leave_decision_history (
  id TEXT PRIMARY KEY,
  leave_request_id TEXT NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  authorization_context TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_review_hierarchies (
  id TEXT PRIMARY KEY,
  department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  level_1_role TEXT DEFAULT 'MANAGER',
  level_2_role TEXT DEFAULT 'SKIP_LEVEL_MANAGER',
  level_3_role TEXT DEFAULT 'HR_DIRECTOR',
  allows_reconsideration BOOLEAN DEFAULT TRUE,
  allow_higher_review BOOLEAN DEFAULT TRUE,
  max_reconsiderations INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_coordination_requests (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES workplace_requests(id) ON DELETE CASCADE,
  leave_request_id TEXT REFERENCES leave_requests(id) ON DELETE CASCADE,
  requesting_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  target_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  handover_details TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'DECLINED')),
  response_notes TEXT,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fairness_review_requests (
  id TEXT PRIMARY KEY,
  case_type TEXT NOT NULL CHECK (case_type IN ('LEAVE', 'WORKPLACE_REQUEST')),
  reference_id TEXT NOT NULL,
  employee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concern_description TEXT NOT NULL,
  comparator_details TEXT,
  ai_pattern_findings TEXT,
  status TEXT DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'CONCLUDED')),
  hr_reviewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  hr_determination TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS company_policies (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  applies_to TEXT DEFAULT 'ALL_EMPLOYEES',
  version TEXT DEFAULT '2026.1',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_feedback (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES workplace_requests(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resolution_quality TEXT NOT NULL CHECK (resolution_quality IN ('COMPLETELY_RESOLVED', 'PARTIALLY_RESOLVED', 'NOT_RESOLVED')),
  satisfaction_rating INTEGER NOT NULL CHECK (satisfaction_rating BETWEEN 1 AND 5),
  response_time_rating INTEGER NOT NULL CHECK (response_time_rating BETWEEN 1 AND 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  ip_address TEXT DEFAULT '127.0.0.1',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'ACTION_REQUIRED', 'ESCALATION', 'APPROVAL', 'REJECTION')),
  reference_type TEXT,
  reference_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
