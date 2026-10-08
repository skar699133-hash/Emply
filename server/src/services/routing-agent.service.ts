import { z } from 'zod';
import { db } from '../db/connection.js';
import { RequestClassification } from './request-classifier.service.js';

export const RoutingDecisionSchema = z.object({
  departmentId: z.string(),
  departmentName: z.string(),
  teamId: z.string(),
  teamName: z.string(),
  assignedUserId: z.string().nullable(),
  assignedUserName: z.string().nullable(),
  managerId: z.string().nullable(),
  reason: z.string(),
  supportingTeams: z.array(z.string()),
  requiresManagerInvolvement: z.boolean(),
  requiresHRInvolvement: z.boolean(),
  confidential: z.boolean(),
});

export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;

export async function routeRequest(
  classification: RequestClassification,
  employeeId: string
): Promise<RoutingDecision> {
  // Query category info
  const catRes = await db.query(
    `SELECT rc.*, d.name as dept_name, t.name as team_name
     FROM request_categories rc
     LEFT JOIN departments d ON rc.department_id = d.id
     LEFT JOIN teams t ON rc.default_team_id = t.id
     WHERE rc.code = $1`,
    [classification.category]
  );

  const categoryRecord = catRes.rows[0];

  // Query employee information
  const empRes = await db.query(
    `SELECT u.*, m.full_name as manager_name
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.id = $1`,
    [employeeId]
  );
  const employee = empRes.rows[0];

  let departmentId = categoryRecord?.department_id || 'dept-hr';
  let departmentName = categoryRecord?.dept_name || 'People & Culture (HR)';
  let teamId = categoryRecord?.default_team_id || 'team-hr-ops';
  let teamName = categoryRecord?.team_name || 'People Operations';
  let assignedUserId: string | null = null;
  let assignedUserName: string | null = null;

  // Find a specialist in the target team
  const memberRes = await db.query(
    `SELECT tm.user_id, u.full_name
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     WHERE tm.team_id = $1 LIMIT 1`,
    [teamId]
  );

  if (memberRes.rows.length > 0) {
    assignedUserId = memberRes.rows[0].user_id;
    assignedUserName = memberRes.rows[0].full_name;
  } else {
    // If not in team_members, pick a user with matching team_id
    const userRes = await db.query(
      `SELECT id, full_name FROM users WHERE team_id = $1 LIMIT 1`,
      [teamId]
    );
    if (userRes.rows.length > 0) {
      assignedUserId = userRes.rows[0].id;
      assignedUserName = userRes.rows[0].full_name;
    }
  }

  // Handle sensitive/manager concerns
  const isSensitive =
    classification.sensitivity !== 'NORMAL' ||
    classification.category === 'MANAGER_CONCERN' ||
    classification.category === 'GRIEVANCE' ||
    classification.category === 'EMPLOYEE_RELATIONS';

  // For sensitive manager issues, managerId should NOT be included in visibility
  const managerId = isSensitive ? null : (employee?.manager_id || null);
  const requiresManagerInvolvement = !isSensitive;
  const requiresHRInvolvement = isSensitive || classification.category === 'HR' || classification.category === 'LEAVE';

  const supportingTeams: string[] = [];
  if (classification.category === 'WORKPLACE_SAFETY') {
    supportingTeams.push('Security Team', 'Executive Office');
  } else if (classification.category === 'ACCESS_REQUEST') {
    supportingTeams.push('Security Compliance');
  }

  const decision: RoutingDecision = {
    departmentId,
    departmentName,
    teamId,
    teamName,
    assignedUserId,
    assignedUserName,
    managerId,
    reason: isSensitive
      ? `Due to confidentiality policies regarding ${classification.category}, this case has been routed strictly to ${teamName} and direct management visibility has been suppressed.`
      : `Automatically mapped to ${departmentName} -> ${teamName} based on categorized topic: ${classification.subcategory || classification.category}.`,
    supportingTeams,
    requiresManagerInvolvement,
    requiresHRInvolvement,
    confidential: isSensitive,
  };

  return RoutingDecisionSchema.parse(decision);
}
