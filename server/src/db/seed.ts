import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db } from './connection.js';

export async function runSeed() {
  console.log('--- Initializing database schema ---');
  await db.init();

  const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  await db.exec(schemaSql);
  console.log('Schema tables verified.');

  // Check if users already seeded
  const check = await db.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(check.rows[0]?.count || '0', 10) > 0) {
    console.log('Database already contains records. Skipping seed.');
    return;
  }

  console.log('--- Seeding core organizational data ---');
  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Departments
  const departments = [
    { id: 'dept-eng', name: 'Engineering & Technology', code: 'ENG', description: 'Core software engineering and architecture' },
    { id: 'dept-hr', name: 'People & Culture (HR)', code: 'HR', description: 'Human resources, talent, and employee relations' },
    { id: 'dept-fin', name: 'Finance & Payroll', code: 'FIN', description: 'Corporate finance, employee expenses, and payroll ops' },
    { id: 'dept-it', name: 'IT Infrastructure & Security', code: 'IT', description: 'Corporate IT, hardware, identity and access' },
    { id: 'dept-fac', name: 'Workplace & Facilities', code: 'FAC', description: 'Physical offices, safety, and physical resources' },
  ];

  for (const d of departments) {
    await db.query(
      `INSERT INTO departments (id, name, code, description) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [d.id, d.name, d.code, d.description]
    );
  }

  // 2. Teams
  const teams = [
    { id: 'team-plat', deptId: 'dept-eng', name: 'Platform Engineering', code: 'ENG-PLAT', minCoverage: 70 },
    { id: 'team-fe', deptId: 'dept-eng', name: 'Frontend Experience', code: 'ENG-FE', minCoverage: 75 },
    { id: 'team-hr-ops', deptId: 'dept-hr', name: 'People Operations', code: 'HR-OPS', minCoverage: 60 },
    { id: 'team-hr-er', deptId: 'dept-hr', name: 'Employee Relations', code: 'HR-ER', minCoverage: 80 },
    { id: 'team-fin-pay', deptId: 'dept-fin', name: 'Payroll Operations', code: 'FIN-PAY', minCoverage: 80 },
    { id: 'team-fin-exp', deptId: 'dept-fin', name: 'Employee Reimbursements', code: 'FIN-EXP', minCoverage: 70 },
    { id: 'team-it-help', deptId: 'dept-it', name: 'IT Service Desk', code: 'IT-HELP', minCoverage: 75 },
    { id: 'team-fac-safe', deptId: 'dept-fac', name: 'Facilities & Workplace Safety', code: 'FAC-SAFE', minCoverage: 80 },
  ];

  for (const t of teams) {
    await db.query(
      `INSERT INTO teams (id, department_id, name, code, min_coverage_percent)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
      [t.id, t.deptId, t.name, t.code, t.minCoverage]
    );
  }

  // 3. Users - Insert in topological order (top of hierarchy first, then reporters)
  const users = [
    {
      id: 'usr-david',
      email: 'david.vance@nexora.internal',
      fullName: 'David Vance',
      role: 'SKIP_LEVEL_MANAGER',
      jobTitle: 'VP of Engineering',
      deptId: 'dept-eng',
      teamId: null,
      managerId: null,
      skipLevelId: null,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-elena',
      email: 'elena.rostova@nexora.internal',
      fullName: 'Elena Rostova',
      role: 'HR_DIRECTOR',
      jobTitle: 'Director of People Experience & HR',
      deptId: 'dept-hr',
      teamId: 'team-hr-er',
      managerId: null,
      skipLevelId: null,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-marcus',
      email: 'marcus.wright@nexora.internal',
      fullName: 'Marcus Wright',
      role: 'ADMIN',
      jobTitle: 'Principal Systems Architect & Platform Admin',
      deptId: 'dept-it',
      teamId: 'team-it-help',
      managerId: null,
      skipLevelId: null,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-sarah',
      email: 'sarah.chen@nexora.internal',
      fullName: 'Sarah Chen',
      role: 'MANAGER',
      jobTitle: 'Engineering Manager (Platform & Core)',
      deptId: 'dept-eng',
      teamId: 'team-plat',
      managerId: 'usr-david',
      skipLevelId: null,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-alex',
      email: 'alex.rivera@nexora.internal',
      fullName: 'Alex Rivera',
      role: 'EMPLOYEE',
      jobTitle: 'Senior Software Engineer',
      deptId: 'dept-eng',
      teamId: 'team-plat',
      managerId: 'usr-sarah',
      skipLevelId: 'usr-david',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-maya',
      email: 'maya.patel@nexora.internal',
      fullName: 'Maya Patel',
      role: 'EMPLOYEE',
      jobTitle: 'Software Engineer II (Platform Teammate)',
      deptId: 'dept-eng',
      teamId: 'team-plat',
      managerId: 'usr-sarah',
      skipLevelId: 'usr-david',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-sam',
      email: 'sam.taylor@nexora.internal',
      fullName: 'Sam Taylor',
      role: 'EMPLOYEE',
      jobTitle: 'Lead Payroll & Compensation Specialist',
      deptId: 'dept-fin',
      teamId: 'team-fin-pay',
      managerId: null,
      skipLevelId: null,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-rachel',
      email: 'rachel.green@nexora.internal',
      fullName: 'Rachel Green',
      role: 'EMPLOYEE',
      jobTitle: 'Workplace Operations & Safety Officer',
      deptId: 'dept-fac',
      teamId: 'team-fac-safe',
      managerId: null,
      skipLevelId: null,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  ];

  for (const u of users) {
    await db.query(
      `INSERT INTO users (id, email, password_hash, full_name, role, job_title, department_id, team_id, manager_id, skip_level_manager_id, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.email, defaultPassword, u.fullName, u.role, u.jobTitle, u.deptId, u.teamId, u.managerId, u.skipLevelId, u.avatarUrl]
    );
  }

  // 4. Team Members
  await db.query(`INSERT INTO team_members (id, team_id, user_id, role) VALUES
    ('tm-1', 'team-plat', 'usr-alex', 'SENIOR_ENGINEER'),
    ('tm-2', 'team-plat', 'usr-maya', 'ENGINEER'),
    ('tm-3', 'team-plat', 'usr-sarah', 'LEAD')
    ON CONFLICT DO NOTHING`);

  // 5. Projects
  await db.query(`INSERT INTO projects (id, name, code, description, lead_user_id, start_date, end_date, status)
    VALUES ('prj-apollo', 'Project Apollo (Core Architecture)', 'PRJ-APOLLO', 'Q4 Microservices and Resiliency Architecture', 'usr-sarah', '2026-09-01', '2026-12-15', 'ACTIVE')
    ON CONFLICT DO NOTHING`);
  await db.query(`INSERT INTO project_members (id, project_id, user_id, role) VALUES
    ('pm-1', 'prj-apollo', 'usr-alex', 'TECH_LEAD'),
    ('pm-2', 'prj-apollo', 'usr-maya', 'CONTRIBUTOR')
    ON CONFLICT DO NOTHING`);

  // 6. Request Categories
  const categories = [
    { code: 'HR', name: 'General Human Resources', deptId: 'dept-hr', teamId: 'team-hr-ops', pri: 'MEDIUM', sens: false, imm: false, desc: 'General workplace HR queries and policies' },
    { code: 'PAYROLL', name: 'Payroll & Compensation', deptId: 'dept-fin', teamId: 'team-fin-pay', pri: 'HIGH', sens: false, imm: false, desc: 'Salary, tax withholding, deductions and payment errors' },
    { code: 'LEAVE', name: 'Leave & Absence', deptId: 'dept-hr', teamId: 'team-hr-ops', pri: 'MEDIUM', sens: false, imm: false, desc: 'Time-off planning, balances, and exceptional leave' },
    { code: 'ATTENDANCE', name: 'Attendance & Working Hours', deptId: 'dept-hr', teamId: 'team-hr-ops', pri: 'LOW', sens: false, imm: false, desc: 'Timesheet logging and schedule adjustments' },
    { code: 'BENEFITS', name: 'Employee Benefits & Insurance', deptId: 'dept-hr', teamId: 'team-hr-ops', pri: 'MEDIUM', sens: false, imm: false, desc: 'Health insurance, 401k, dental and wellness coverage' },
    { code: 'EMPLOYEE_RELATIONS', name: 'Employee Relations & Grievances', deptId: 'dept-hr', teamId: 'team-hr-er', pri: 'HIGH', sens: true, imm: false, desc: 'Sensitive workplace relationships, interpersonal mediation' },
    { code: 'MANAGER_CONCERN', name: 'Manager Conflict & Feedback', deptId: 'dept-hr', teamId: 'team-hr-er', pri: 'HIGH', sens: true, imm: false, desc: 'Confidential reporting regarding direct management concerns' },
    { code: 'WORKLOAD', name: 'Workload & Burnout Concerns', deptId: 'dept-hr', teamId: 'team-hr-ops', pri: 'MEDIUM', sens: false, imm: false, desc: 'Unsustainable workload, allocation, and team capacity' },
    { code: 'WORKPLACE_SAFETY', name: 'Workplace Safety & Hazard', deptId: 'dept-fac', teamId: 'team-fac-safe', pri: 'CRITICAL', sens: false, imm: true, desc: 'Immediate physical hazards, fire safety, chemical or electrical issues' },
    { code: 'FACILITIES', name: 'Office Facilities & Maintenance', deptId: 'dept-fac', teamId: 'team-fac-safe', pri: 'LOW', sens: false, imm: false, desc: 'HVAC, desks, lighting, access cards, and amenities' },
    { code: 'IT_SUPPORT', name: 'IT Technical Support', deptId: 'dept-it', teamId: 'team-it-help', pri: 'MEDIUM', sens: false, imm: false, desc: 'Laptop, software crash, VPN and workstation hardware' },
    { code: 'ACCESS_REQUEST', name: 'System & Tool Access', deptId: 'dept-it', teamId: 'team-it-help', pri: 'MEDIUM', sens: false, imm: false, desc: 'GitHub, AWS, database, JIRA and SaaS credentials' },
    { code: 'FINANCE', name: 'Corporate Finance & Procurement', deptId: 'dept-fin', teamId: 'team-fin-exp', pri: 'LOW', sens: false, imm: false, desc: 'Invoices, vendor onboarding, and purchase orders' },
    { code: 'REIMBURSEMENT', name: 'Expense Reimbursement', deptId: 'dept-fin', teamId: 'team-fin-exp', pri: 'MEDIUM', sens: false, imm: false, desc: 'Travel, meal, and conference expense claim approvals' },
    { code: 'PROJECT_COORDINATION', name: 'Project & Handover Coordination', deptId: 'dept-eng', teamId: 'team-plat', pri: 'LOW', sens: false, imm: false, desc: 'Cross-functional dependency and release scheduling' },
    { code: 'TEAM_COORDINATION', name: 'Team Staffing & Availability', deptId: 'dept-eng', teamId: 'team-plat', pri: 'LOW', sens: false, imm: false, desc: 'Coverage coordination and sprint handover' },
    { code: 'WFH', name: 'Remote & Hybrid Work Policy', deptId: 'dept-hr', teamId: 'team-hr-ops', pri: 'LOW', sens: false, imm: false, desc: 'Work-from-home requests and ergonomics allowance' },
    { code: 'POLICY', name: 'Company Policy Clarification', deptId: 'dept-hr', teamId: 'team-hr-ops', pri: 'LOW', sens: false, imm: false, desc: 'Inquiries regarding handbook and corporate guidelines' },
    { code: 'PERFORMANCE', name: 'Performance & Growth', deptId: 'dept-hr', teamId: 'team-hr-ops', pri: 'MEDIUM', sens: false, imm: false, desc: 'Reviews, career ladders, promotion and OKRs' },
    { code: 'GRIEVANCE', name: 'Formal Workplace Grievance', deptId: 'dept-hr', teamId: 'team-hr-er', pri: 'HIGH', sens: true, imm: false, desc: 'Protected whistleblowing, discrimination or harassment claim' },
    { code: 'OTHER', name: 'Other Workplace Matters', deptId: 'dept-hr', teamId: 'team-hr-ops', pri: 'MEDIUM', sens: false, imm: false, desc: 'General workplace questions not matching existing taxonomy' },
  ];

  for (const c of categories) {
    await db.query(
      `INSERT INTO request_categories (id, code, name, description, department_id, default_team_id, default_priority, is_sensitive, requires_immediate_escalation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (code) DO NOTHING`,
      [`cat-${c.code.toLowerCase()}`, c.code, c.name, c.desc, c.deptId, c.teamId, c.pri, c.sens, c.imm]
    );
  }

  // 7. Request SLAs
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
  for (const c of categories) {
    for (const p of priorities) {
      let respHours = 24;
      let resHours = 72;
      let escHours = 36;

      if (p === 'CRITICAL' || c.imm) {
        respHours = 1;
        resHours = 4;
        escHours = 2;
      } else if (p === 'HIGH') {
        respHours = 4;
        resHours = 24;
        escHours = 8;
      } else if (p === 'MEDIUM') {
        respHours = 12;
        resHours = 48;
        escHours = 24;
      } else {
        respHours = 24;
        resHours = 96;
        escHours = 48;
      }

      await db.query(
        `INSERT INTO request_slas (id, category_code, priority, response_time_hours, resolution_time_hours, escalation_threshold_hours, business_hours_only, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (category_code, priority) DO NOTHING`,
        [`sla-${c.code}-${p}`, c.code, p, respHours, resHours, escHours, p !== 'CRITICAL', `${c.name} ${p} SLA commitment`]
      );
    }
  }

  // 8. Leave Types
  const leaveTypes = [
    { id: 'lt-ann', code: 'ANNUAL', name: 'Annual Paid Vacation', days: 20, doc: false, imp: 'NORMAL', desc: 'Standard paid annual leave for rest and rejuvenation' },
    { id: 'lt-pers', code: 'PERSONAL', name: 'Personal & Family Emergency Leave', days: 5, doc: false, imp: 'HIGH_IMPORTANCE', desc: 'Urgent family, bereavement, or critical personal matters' },
    { id: 'lt-sick', code: 'SICK', name: 'Medical & Sick Leave', days: 12, doc: true, imp: 'NORMAL', desc: 'Personal illness, hospitalization, medical appointments' },
    { id: 'lt-bereave', code: 'BEREAVEMENT', name: 'Compassionate / Bereavement Leave', days: 5, doc: false, imp: 'EXCEPTIONAL', desc: 'Leave granted upon death of an immediate family member' },
    { id: 'lt-parent', code: 'PARENTAL', name: 'Parental Bonding Leave', days: 60, doc: true, imp: 'HIGH_IMPORTANCE', desc: 'Birth, adoption or surrogacy parental care' },
    { id: 'lt-unpaid', code: 'UNPAID', name: 'Unpaid Leave / Sabbatical', days: 30, doc: false, imp: 'NORMAL', desc: 'Extended personal leave or sabbatical without compensation' },
  ];

  for (const lt of leaveTypes) {
    await db.query(
      `INSERT INTO leave_types (id, code, name, default_days_per_year, requires_documentation, importance_level, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [lt.id, lt.code, lt.name, lt.days, lt.doc, lt.imp, lt.desc]
    );
  }

  // 9. Leave Balances for Alex, Maya
  await db.query(`INSERT INTO leave_balances (id, user_id, leave_type_id, total_allocated, used_days, pending_days, remaining_days, year) VALUES
    ('lb-alex-ann', 'usr-alex', 'lt-ann', 20, 2, 0, 18, 2026),
    ('lb-alex-pers', 'usr-alex', 'lt-pers', 5, 0, 0, 5, 2026),
    ('lb-alex-sick', 'usr-alex', 'lt-sick', 12, 1, 0, 11, 2026),
    ('lb-alex-bereave', 'usr-alex', 'lt-bereave', 5, 0, 0, 5, 2026),
    ('lb-maya-ann', 'usr-maya', 'lt-ann', 20, 4, 0, 16, 2026),
    ('lb-maya-pers', 'usr-maya', 'lt-pers', 5, 0, 0, 5, 2026)
    ON CONFLICT DO NOTHING`);

  // 10. Leave Review Hierarchy for Engineering
  await db.query(`INSERT INTO leave_review_hierarchies (id, department_id, level_1_role, level_2_role, level_3_role, allows_reconsideration, allow_higher_review, max_reconsiderations)
    VALUES ('lrh-eng', 'dept-eng', 'MANAGER', 'SKIP_LEVEL_MANAGER', 'HR_DIRECTOR', true, true, 1)
    ON CONFLICT DO NOTHING`);

  // 11. Company Policies
  const policies = [
    {
      id: 'pol-pay-01',
      code: 'POL-PAY-01',
      category: 'PAYROLL',
      title: 'Salary Discrepancies, Overtime, and Off-Cycle Payment Resolution',
      summary: 'Standard procedures for reporting pay errors, expected response timeframes, and retro-pay corrections.',
      content: `1. Purpose & Scope: Nexora ensures fair, 100% accurate compensation. In the event of an unexpected salary deduction or calculation error, the Payroll Operations team investigates within 4 business hours.
2. Reporting: Employees can submit an inquiry through Nexora AI. There is no need to fill manual payroll tickets.
3. Correction Schedule: Approved pay adjustments under $500 are applied on the next pay cycle. Adjustments over $500 or impacting essential living expenses qualify for immediate off-cycle wire transfer within 24-48 business hours.
4. Confidentiality: Payroll discrepancy details are confidential between the employee, Payroll Operations, and HR.`
    },
    {
      id: 'pol-lev-01',
      code: 'POL-LEV-01',
      category: 'LEAVE',
      title: 'Annual Vacation Planning & Minimum Team Coverage Guidelines',
      summary: 'Rules governing planned time off, notice periods, and team coverage benchmarks.',
      content: `1. Guidelines: Employees are encouraged to use their 20 allocated annual vacation days.
2. Notice Requirements: Leaves of 3+ consecutive days require 5 business days advance notice.
3. Coverage Benchmark: Teams maintain a recommended 70% operational availability during core sprint milestones.
4. Handover: Where the employee owns critical architecture or release dependencies, an operational handover must be coordinated with a nominated peer before leave commencement.`
    },
    {
      id: 'pol-lev-02',
      code: 'POL-LEV-02',
      category: 'LEAVE',
      title: 'High-Importance Leave Reconsideration & Higher-Level Escalation Policy',
      summary: 'Protection against arbitrary leave rejections, allowing structured one-time manager reconsideration and skip-level review.',
      content: `1. Principle: Critical personal events, medical emergencies, and significant family commitments must be evaluated with empathy and fairness.
2. Manager Review: The direct manager evaluates coverage and impact. If rejected, the manager MUST record an objective, factual reason in the system.
3. One-Time Reconsideration: For requests classified as High Importance or Exceptional, if rejected, the employee has the right to request ONE structured reconsideration from the manager with clarifying context or handover mitigation.
4. Higher-Level Review: If the manager rejects the request a second time, the employee is protected by corporate policy and can trigger a Higher-Level Review. The case escalates to the Skip-Level Manager (Department VP) or HR Director for an independent determination. The AI transparently tracks the full audit trail.`
    },
    {
      id: 'pol-er-01',
      code: 'POL-ER-01',
      category: 'EMPLOYEE_RELATIONS',
      title: 'Confidential Grievances, Anti-Harassment, and Non-Retaliation Policy',
      summary: 'Guaranteed protection for employees raising concerns regarding managers, discrimination, or workplace climate.',
      content: `1. Zero Retaliation Commitment: Nexora strictly prohibits retaliation against any employee who raises workplace concerns or reports policy violations in good faith.
2. Confidentiality Architecture: Sensitive cases (harassment, manager misconduct, bias) bypass direct team managers completely and route directly to authorized Employee Relations directors.
3. Access Controls: Direct managers cannot view or access confidential cases unless authorized by Employee Relations.
4. Support Channels: Employees may request an advocate or an external ombudsperson consultation at any stage.`
    },
    {
      id: 'pol-exp-01',
      code: 'POL-EXP-01',
      category: 'FINANCE',
      title: 'Business Expense Reimbursement Timelines & Missing Receipt Procedures',
      summary: 'Reimbursement processing windows, allowable thresholds, and resolution for delayed payouts.',
      content: `1. Processing Window: Approved expense reports are credited within 5 to 7 business days.
2. Inquiries: If a reimbursement has not arrived after 10 business days, the Employee Reimbursements team must investigate within 12 business hours.
3. Missing Receipts: Legitimate business expenses under $75 may be verified through an itemized digital affidavit.`
    },
    {
      id: 'pol-it-01',
      code: 'POL-IT-01',
      category: 'IT_SUPPORT',
      title: 'Workstation Failure, Emergency Replacements & Repository Access',
      summary: 'Emergency hardware triage for critical meetings and developer access provisioning.',
      content: `1. Critical Device Failure: If an employee experiences a workstation failure impacting urgent customer meetings or production deployments, priority is elevated to HIGH with a 1-hour SLA.
2. Access Requests: GitHub and cloud access are pre-approved based on team membership and automatically verified by role.`
    },
    {
      id: 'pol-safe-01',
      code: 'POL-SAFE-01',
      category: 'WORKPLACE_SAFETY',
      title: 'Immediate Facility Hazards, Electrical Emergencies & Evacuation',
      summary: 'Emergency protocol for physical hazards, fire risk, electrical smoke or structural dangers.',
      content: `1. Immediate Priority: Any report involving smoke, exposed wiring, structural hazards, or physical injury triggers CRITICAL status.
2. Real-Time Human Escalation: System immediately dispatches an alert to Facilities & Safety Officers and displays evacuation guidance to the employee. Normal queues are completely bypassed.`
    }
  ];

  for (const p of policies) {
    await db.query(
      `INSERT INTO company_policies (id, category, title, code, content, summary)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (code) DO NOTHING`,
      [p.id, p.category, p.title, p.code, p.content, p.summary]
    );
  }

  // 12. Seed Sample Workplace Requests
  const case1Id = 'req-1042';
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const dueAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO workplace_requests (
      id, case_number, employee_id, category_code, title, description,
      status, priority, severity, sensitivity, impact_level,
      department_id, team_id, assigned_user_id, manager_id,
      due_at, first_response_at, ai_summary, ai_recommendation, employee_confirmed, confidential
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    ON CONFLICT (id) DO NOTHING`,
    [
      case1Id,
      'CAS-1042',
      'usr-alex',
      'PAYROLL',
      'September Salary Discrepancy - Missing On-Call Allowance',
      'My salary credit for September was approximately $450 lower than expected. The on-call engineering stipend for the Sept 14-21 rotation was omitted.',
      'IN_PROGRESS',
      'HIGH',
      'HIGH',
      'NORMAL',
      'INDIVIDUAL',
      'dept-fin',
      'team-fin-pay',
      'usr-sam',
      'usr-sarah',
      dueAt.toISOString(),
      oneHourAgo.toISOString(),
      'Employee identified a $450 difference in September pay slip relating to week 3 on-call rotation. Routed to Payroll Operations.',
      'Verify on-call pager duty logs against payroll sheet and issue off-cycle adjustment.',
      true,
      false,
    ]
  );

  // Status history for Case 1
  await db.query(
    `INSERT INTO request_status_history (id, request_id, actor_id, actor_name, previous_status, new_status, comment) VALUES
     ('rsh-1', $1, 'usr-alex', 'Alex Rivera', 'NEW', 'AI_ANALYSIS', 'Request received via natural language interface'),
     ('rsh-2', $1, 'usr-alex', 'Nexora AI', 'AI_ANALYSIS', 'ASSIGNED', 'Classified as PAYROLL, Priority: HIGH. Routed to Payroll Operations'),
     ('rsh-3', $1, 'usr-sam', 'Sam Taylor', 'ASSIGNED', 'IN_PROGRESS', 'Investigation initiated. Pulling on-call rotation ledger for Platform team.')
     ON CONFLICT DO NOTHING`,
    [case1Id]
  );

  // Comments for Case 1
  await db.query(
    `INSERT INTO request_comments (id, request_id, author_id, author_name, author_role, content, is_internal_note, is_ai_note) VALUES
     ('rc-1', $1, 'usr-sam', 'Sam Taylor', 'Payroll Specialist', 'Hello Alex, I see the missing on-call shift from Sept 14-21. Engineering manager approved it on the 23rd after the payroll cutoff. Processing an off-cycle correction for you today.', false, false)
     ON CONFLICT DO NOTHING`,
    [case1Id]
  );

  // Sample 2: Sample Leave Request demonstrating the Reconsideration Workflow!
  const leave1Id = 'lev-2041';
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 10);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 14);

  await db.query(
    `INSERT INTO leave_requests (
      id, case_number, employee_id, leave_type_id, start_date, end_date,
      duration_days, reason, importance, status,
      manager_id, current_reviewing_authority_id, current_reviewing_authority_role,
      initial_manager_decision, initial_manager_decision_at, initial_rejection_reason,
      second_manager_decision, second_manager_decision_at, second_rejection_reason,
      policy_eligible, team_availability_percent, project_impact_level, reconsideration_count,
      ai_analysis
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    ON CONFLICT (id) DO NOTHING`,
    [
      leave1Id,
      'LEV-2041',
      'usr-alex',
      'lt-pers',
      nextMonthStart.toISOString().split('T')[0],
      nextMonthEnd.toISOString().split('T')[0],
      3,
      'Family medical surgery support in family hometown. Required presence for post-operative care.',
      'HIGH_IMPORTANCE',
      'REJECTED_AFTER_RECONSIDERATION',
      'usr-sarah',
      'usr-sarah',
      'MANAGER',
      'REJECTED',
      twoHoursAgo.toISOString(),
      'Team availability is tight (under 75%) due to sprint milestone delivery.',
      'REJECTED',
      oneHourAgo.toISOString(),
      'Project Apollo migration dependency coincides with critical release test window.',
      true,
      67,
      'MEDIUM',
      1,
      JSON.stringify({
        leaveType: 'PERSONAL',
        durationDays: 3,
        policyEligible: true,
        importance: 'HIGH_IMPORTANCE',
        teamAvailabilityImpact: 'MEDIUM (67%)',
        projectImpact: 'MEDIUM',
        crossTeamImpact: 'LOW',
        requiresManagerReview: true,
        requiresHigherReviewEligibility: true,
        aiRecommendation: 'Handover can be delegated to Maya Patel. Reconsideration eligible under POL-LEV-02.',
      }),
    ]
  );

  // Leave reconsideration record
  await db.query(
    `INSERT INTO leave_reconsiderations (
      id, leave_request_id, requested_by, requested_at, reason, manager_id,
      status, manager_response, manager_response_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT DO NOTHING`,
    [
      'recon-1',
      leave1Id,
      'usr-alex',
      twoHoursAgo.toISOString(),
      'I spoke with Maya Patel who agreed to cover primary pager duties and PR reviews for Project Apollo during these 3 days.',
      'usr-sarah',
      'REJECTED',
      'Even with Maya covering, we need both senior engineers on call during the Apollo cutover week.',
      oneHourAgo.toISOString(),
    ]
  );

  // Leave decision history
  await db.query(
    `INSERT INTO leave_decision_history (id, leave_request_id, actor_id, actor_name, actor_role, action, previous_status, new_status, reason) VALUES
     ('ldh-1', $1, 'usr-alex', 'Alex Rivera', 'EMPLOYEE', 'SUBMIT_LEAVE', 'NEW', 'PENDING_MANAGER_REVIEW', 'Initial submission for family medical support'),
     ('ldh-2', $1, 'usr-sarah', 'Sarah Chen', 'MANAGER', 'MANAGER_REJECT', 'PENDING_MANAGER_REVIEW', 'REJECTED', 'Team availability is tight (under 75%) due to sprint milestone delivery'),
     ('ldh-3', $1, 'usr-alex', 'Alex Rivera', 'EMPLOYEE', 'REQUEST_RECONSIDERATION', 'REJECTED', 'PENDING_MANAGER_RECONSIDERATION', 'Peer coverage arranged with Maya Patel'),
     ('ldh-4', $1, 'usr-sarah', 'Sarah Chen', 'MANAGER', 'MANAGER_REJECT_RECONSIDERATION', 'PENDING_MANAGER_RECONSIDERATION', 'REJECTED_AFTER_RECONSIDERATION', 'Apollo cutover week requires dual coverage')
     ON CONFLICT DO NOTHING`,
    [leave1Id]
  );

  // Seed sample notifications for Alex
  await db.query(
    `INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id) VALUES
     ('notif-1', 'usr-alex', 'Leave Reconsideration Update', 'Your manager Sarah Chen reviewed your leave reconsideration for LEV-2041 and declined it again. Because this request is classified as High Importance, corporate policy permits you to request a Higher-Level Review.', 'ESCALATION', 'LEAVE', 'lev-2041'),
     ('notif-2', 'usr-alex', 'Payroll Case Update', 'Sam Taylor from Payroll Operations has updated Case #CAS-1042: Off-cycle adjustment has been queued for immediate processing.', 'INFO', 'WORKPLACE_REQUEST', 'req-1042')
     ON CONFLICT DO NOTHING`
  );

  // Seed initial audit log
  await db.query(
    `INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, entity_type, entity_id, new_state) VALUES
     ('audit-init', 'usr-marcus', 'Marcus Wright', 'ADMIN', 'SEED_SYSTEM', 'SYSTEM', 'ROOT', 'Seeded initial organizational taxonomy, policies, SLAs, and hierarchies')
     ON CONFLICT DO NOTHING`
  );

  console.log('--- Database seeding completed successfully! ---');
}

// Run if called directly
if (process.argv[1]?.endsWith('seed.ts')) {
  runSeed().then(() => process.exit(0)).catch((err) => {
    console.error('Seed failure:', err);
    process.exit(1);
  });
}
