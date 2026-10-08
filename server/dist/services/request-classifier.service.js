import { z } from 'zod';
import { generateGeminiJson } from './gemini.service.js';
export const RequestClassificationSchema = z.object({
    category: z.string(),
    subcategory: z.string(),
    department: z.string(),
    team: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    sensitivity: z.enum(['NORMAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL']),
    impact: z.enum(['INDIVIDUAL', 'TEAM', 'DEPARTMENT', 'ORGANIZATION', 'SAFETY']),
    confidence: z.number().min(0).max(1),
    requiresHumanReview: z.boolean(),
    requiresImmediateEscalation: z.boolean(),
    missingInformation: z.array(z.string()),
    explanation: z.string(),
});
export async function classifyRequest(userInput, employeeContext) {
    const prompt = `You are Nexora's Enterprise Workplace Request Classification Engine.
Analyze the following employee message:
"${userInput}"

Employee info: ${JSON.stringify(employeeContext || {})}

Available categories:
HR, PAYROLL, LEAVE, ATTENDANCE, BENEFITS, EMPLOYEE_RELATIONS, MANAGER_CONCERN, WORKLOAD, WORKPLACE_SAFETY, FACILITIES, IT_SUPPORT, ACCESS_REQUEST, FINANCE, REIMBURSEMENT, PROJECT_COORDINATION, TEAM_COORDINATION, WFH, POLICY, PERFORMANCE, GRIEVANCE, OTHER.

Special rules:
- Any physical safety, fire, electrical hazard, smoke, water leak near electrical equipment MUST be WORKPLACE_SAFETY with priority CRITICAL and requiresImmediateEscalation = true.
- Any conflict with direct manager or feeling uncomfortable reporting to manager MUST be MANAGER_CONCERN or EMPLOYEE_RELATIONS with sensitivity CONFIDENTIAL or HIGHLY_CONFIDENTIAL. Direct managers must NOT be involved.
- Any salary, pay slip, deduction or missing bonus MUST be PAYROLL, priority HIGH.
- Any expense or reimbursement delay MUST be REIMBURSEMENT, priority MEDIUM.
- Laptop breakdown before meeting/deadline MUST be IT_SUPPORT, priority HIGH.

Return valid JSON adhering exactly to this schema:
{
  "category": "PAYROLL | IT_SUPPORT | WORKPLACE_SAFETY | ...",
  "subcategory": "string",
  "department": "HR | Finance & Payroll | IT Infrastructure & Security | Workplace & Facilities | Engineering",
  "team": "Payroll Operations | IT Service Desk | Facilities & Workplace Safety | Employee Relations | People Operations | ...",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "sensitivity": "NORMAL | CONFIDENTIAL | HIGHLY_CONFIDENTIAL",
  "impact": "INDIVIDUAL | TEAM | DEPARTMENT | ORGANIZATION | SAFETY",
  "confidence": 0.95,
  "requiresHumanReview": true,
  "requiresImmediateEscalation": false,
  "missingInformation": [],
  "explanation": "Clear explanation of why this category and urgency was chosen."
}`;
    const geminiResult = await generateGeminiJson(prompt);
    if (geminiResult) {
        const validated = RequestClassificationSchema.safeParse(geminiResult);
        if (validated.success) {
            return validated.data;
        }
    }
    // Robust deterministic domain NLP classification engine
    const lower = userInput.toLowerCase();
    // 1. Safety & Emergency
    if (lower.includes('smoke') ||
        lower.includes('fire') ||
        lower.includes('spark') ||
        lower.includes('electrical panel') ||
        lower.includes('hazard') ||
        lower.includes('emergency') ||
        lower.includes('gas leak') ||
        lower.includes('collapsed')) {
        return {
            category: 'WORKPLACE_SAFETY',
            subcategory: 'ELECTRICAL_OR_FIRE_HAZARD',
            department: 'Workplace & Facilities',
            team: 'Facilities & Workplace Safety',
            priority: 'CRITICAL',
            severity: 'CRITICAL',
            sensitivity: 'NORMAL',
            impact: 'SAFETY',
            confidence: 0.99,
            requiresHumanReview: true,
            requiresImmediateEscalation: true,
            missingInformation: [],
            explanation: 'Detected critical workplace physical hazard. Immediate escalation to Facilities & Safety dispatched.',
        };
    }
    // 2. Sensitive / Grievance / Manager Concern
    if (lower.includes('manager') &&
        (lower.includes('uncomfortable') ||
            lower.includes('issue with my manager') ||
            lower.includes('problem with my manager') ||
            lower.includes('harass') ||
            lower.includes('discrim') ||
            lower.includes('retaliat') ||
            lower.includes('unfair') ||
            lower.includes('hostile') ||
            lower.includes('conflict'))) {
        return {
            category: 'MANAGER_CONCERN',
            subcategory: 'CONFIDENTIAL_MANAGER_FEEDBACK',
            department: 'People & Culture (HR)',
            team: 'Employee Relations',
            priority: 'HIGH',
            severity: 'HIGH',
            sensitivity: 'CONFIDENTIAL',
            impact: 'INDIVIDUAL',
            confidence: 0.96,
            requiresHumanReview: true,
            requiresImmediateEscalation: false,
            missingInformation: [],
            explanation: 'Sensitive direct manager concern detected. Configured confidentiality rules isolate this from direct manager access and route to Employee Relations.',
        };
    }
    // 3. Payroll / Salary
    if (lower.includes('salary') ||
        lower.includes('paycheck') ||
        lower.includes('payslip') ||
        lower.includes('bonus') ||
        lower.includes('deduction') ||
        lower.includes('underpaid') ||
        lower.includes('tax withholding') ||
        lower.includes('on-call allowance')) {
        return {
            category: 'PAYROLL',
            subcategory: 'SALARY_DISCREPANCY',
            department: 'Finance & Payroll',
            team: 'Payroll Operations',
            priority: 'HIGH',
            severity: 'HIGH',
            sensitivity: 'NORMAL',
            impact: 'INDIVIDUAL',
            confidence: 0.95,
            requiresHumanReview: true,
            requiresImmediateEscalation: false,
            missingInformation: [],
            explanation: 'Classified as Payroll. Compensation discrepancies are prioritized as High according to organizational SLA.',
        };
    }
    // 4. Reimbursement / Expenses
    if (lower.includes('reimburse') || lower.includes('expense') || lower.includes('claim') || lower.includes('receipt')) {
        return {
            category: 'REIMBURSEMENT',
            subcategory: 'EXPENSE_CLAIM_DELAY',
            department: 'Finance & Payroll',
            team: 'Employee Reimbursements',
            priority: 'MEDIUM',
            severity: 'MEDIUM',
            sensitivity: 'NORMAL',
            impact: 'INDIVIDUAL',
            confidence: 0.94,
            requiresHumanReview: true,
            requiresImmediateEscalation: false,
            missingInformation: [],
            explanation: 'Identified as Employee Expense Reimbursement. Routed to Finance Operations.',
        };
    }
    // 5. IT Support & Hardware
    if (lower.includes('laptop') ||
        lower.includes('computer') ||
        lower.includes('macbook') ||
        lower.includes('screen') ||
        lower.includes('vpn') ||
        lower.includes('wifi') ||
        lower.includes('crash') ||
        lower.includes('software')) {
        const isUrgent = lower.includes('meeting') || lower.includes('client') || lower.includes('today') || lower.includes('urgent');
        return {
            category: 'IT_SUPPORT',
            subcategory: 'HARDWARE_OR_SOFTWARE_MALFUNCTION',
            department: 'IT Infrastructure & Security',
            team: 'IT Service Desk',
            priority: isUrgent ? 'HIGH' : 'MEDIUM',
            severity: isUrgent ? 'HIGH' : 'MEDIUM',
            sensitivity: 'NORMAL',
            impact: isUrgent ? 'ORGANIZATION' : 'INDIVIDUAL',
            confidence: 0.93,
            requiresHumanReview: true,
            requiresImmediateEscalation: false,
            missingInformation: [],
            explanation: `Routed to IT Service Desk. Marked ${isUrgent ? 'HIGH' : 'MEDIUM'} priority based on operational impact.`,
        };
    }
    // 6. Access / GitHub / Tools
    if (lower.includes('access') || lower.includes('permission') || lower.includes('github') || lower.includes('aws') || lower.includes('jira')) {
        return {
            category: 'ACCESS_REQUEST',
            subcategory: 'DEVELOPER_TOOL_ACCESS',
            department: 'IT Infrastructure & Security',
            team: 'IT Service Desk',
            priority: 'MEDIUM',
            severity: 'MEDIUM',
            sensitivity: 'NORMAL',
            impact: 'TEAM',
            confidence: 0.92,
            requiresHumanReview: true,
            requiresImmediateEscalation: false,
            missingInformation: [],
            explanation: 'Developer tooling access request identified. Routed to IT identity and access management.',
        };
    }
    // 7. Facilities / AC / Desk
    if (lower.includes('ac') || lower.includes('air conditioning') || lower.includes('desk') || lower.includes('chair') || lower.includes('office') || lower.includes('lights')) {
        return {
            category: 'FACILITIES',
            subcategory: 'OFFICE_ENVIRONMENT',
            department: 'Workplace & Facilities',
            team: 'Facilities & Workplace Safety',
            priority: 'LOW',
            severity: 'LOW',
            sensitivity: 'NORMAL',
            impact: 'TEAM',
            confidence: 0.91,
            requiresHumanReview: true,
            requiresImmediateEscalation: false,
            missingInformation: [],
            explanation: 'Physical workplace environmental comfort request routed to Facilities Operations.',
        };
    }
    // 8. Workload & Burnout
    if (lower.includes('workload') || lower.includes('burnout') || lower.includes('overwhelmed') || lower.includes('too many tasks')) {
        return {
            category: 'WORKLOAD',
            subcategory: 'CAPACITY_AND_WELLNESS',
            department: 'People & Culture (HR)',
            team: 'People Operations',
            priority: 'MEDIUM',
            severity: 'HIGH',
            sensitivity: 'CONFIDENTIAL',
            impact: 'INDIVIDUAL',
            confidence: 0.92,
            requiresHumanReview: true,
            requiresImmediateEscalation: false,
            missingInformation: [],
            explanation: 'Employee workload and capacity support query routed to People Operations with supportive privacy.',
        };
    }
    // 9. Leave Inquiry
    if (lower.includes('leave') || lower.includes('vacation') || lower.includes('time off') || lower.includes('pto') || lower.includes('sick day')) {
        return {
            category: 'LEAVE',
            subcategory: 'ABSENCE_AND_PLANNING',
            department: 'People & Culture (HR)',
            team: 'People Operations',
            priority: 'MEDIUM',
            severity: 'LOW',
            sensitivity: 'NORMAL',
            impact: 'INDIVIDUAL',
            confidence: 0.94,
            requiresHumanReview: true,
            requiresImmediateEscalation: false,
            missingInformation: [],
            explanation: 'Absence and leave request identified. Can be reviewed via Leave Management or People Ops.',
        };
    }
    // Default fallback
    return {
        category: 'HR',
        subcategory: 'GENERAL_WORKPLACE_INQUIRY',
        department: 'People & Culture (HR)',
        team: 'People Operations',
        priority: 'MEDIUM',
        severity: 'MEDIUM',
        sensitivity: 'NORMAL',
        impact: 'INDIVIDUAL',
        confidence: 0.85,
        requiresHumanReview: true,
        requiresImmediateEscalation: false,
        missingInformation: [],
        explanation: 'General workplace assistance request routed to People Operations.',
    };
}
