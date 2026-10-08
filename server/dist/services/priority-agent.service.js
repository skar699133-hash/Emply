import { z } from 'zod';
import { db } from '../db/connection.js';
export const PriorityAssessmentSchema = z.object({
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    sensitivity: z.enum(['NORMAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL']),
    impact: z.enum(['INDIVIDUAL', 'TEAM', 'DEPARTMENT', 'ORGANIZATION', 'SAFETY']),
    reason: z.string(),
    slaId: z.string().nullable(),
    recommendedSlaHours: z.number(),
    resolutionHours: z.number(),
    escalationThresholdHours: z.number(),
    slaDescription: z.string(),
    dueAt: z.date(),
    requiresImmediateHumanReview: z.boolean(),
});
export async function assessPriority(classification) {
    const { category, priority, severity, sensitivity, impact } = classification;
    // Retrieve exact configured organizational SLA from database
    const slaRes = await db.query(`SELECT * FROM request_slas WHERE category_code = $1 AND priority = $2 LIMIT 1`, [category, priority]);
    let slaRecord = slaRes.rows[0];
    if (!slaRecord) {
        // Fallback to general category SLA with matching priority
        const fallbackRes = await db.query(`SELECT * FROM request_slas WHERE priority = $1 LIMIT 1`, [priority]);
        slaRecord = fallbackRes.rows[0];
    }
    const responseHours = slaRecord ? slaRecord.response_time_hours : (priority === 'CRITICAL' ? 1 : priority === 'HIGH' ? 4 : 24);
    const resolutionHours = slaRecord ? slaRecord.resolution_time_hours : (priority === 'CRITICAL' ? 4 : priority === 'HIGH' ? 24 : 72);
    const escalationThresholdHours = slaRecord ? slaRecord.escalation_threshold_hours : (priority === 'CRITICAL' ? 2 : priority === 'HIGH' ? 8 : 36);
    const now = new Date();
    const dueAt = new Date(now.getTime() + responseHours * 60 * 60 * 1000);
    const assessment = {
        priority,
        severity,
        sensitivity,
        impact,
        reason: classification.explanation || `Priority established based on category ${category} and operational impact: ${impact}.`,
        slaId: slaRecord?.id || null,
        recommendedSlaHours: responseHours,
        resolutionHours,
        escalationThresholdHours,
        slaDescription: slaRecord?.description || `Standard corporate SLA: ${responseHours}h response time window.`,
        dueAt,
        requiresImmediateHumanReview: priority === 'CRITICAL' || sensitivity !== 'NORMAL',
    };
    return PriorityAssessmentSchema.parse(assessment);
}
