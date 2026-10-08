import { db } from '../db/connection.js';
export async function evaluateAdvocacyContext(params) {
    const { employeeId, concernText, leaveRequestId } = params;
    const verifiedFacts = [];
    const possiblePatterns = [];
    // Check if referencing a rejected leave
    if (leaveRequestId) {
        const leaveRes = await db.query(`SELECT lr.*, lt.name as leave_name, u.full_name as emp_name, m.full_name as manager_name
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       JOIN users u ON lr.employee_id = u.id
       LEFT JOIN users m ON lr.manager_id = m.id
       WHERE lr.id = $1`, [leaveRequestId]);
        if (leaveRes.rows.length > 0) {
            const lr = leaveRes.rows[0];
            verifiedFacts.push(`Leave request ${lr.case_number} (${lr.duration_days} days, ${lr.leave_name}) was reviewed by ${lr.manager_name || 'Manager'}.`);
            verifiedFacts.push(`Status: ${lr.status}. Rejection reason recorded: "${lr.initial_rejection_reason || lr.second_rejection_reason || 'Operational constraints'}".`);
            // Check if peer had approved leave in the same window
            const peerRes = await db.query(`SELECT lr2.*, u2.full_name
         FROM leave_requests lr2
         JOIN users u2 ON lr2.employee_id = u2.id
         WHERE lr2.employee_id != $1
           AND lr2.status = 'APPROVED'
           AND NOT (lr2.end_date < $2 OR lr2.start_date > $3)
         LIMIT 3`, [employeeId, lr.start_date, lr.end_date]);
            if (peerRes.rows.length > 0) {
                verifiedFacts.push(`${peerRes.rows.length} other team member(s) hold approved leave during overlapping dates.`);
                possiblePatterns.push(`Similar time-off dates have been authorized for other team members.`);
            }
        }
    }
    // General advocacy analysis
    possiblePatterns.push(`Decision appears to have generated subjective concern regarding consistency.`);
    const aiRecommendation = `This does not by itself establish unfair treatment or policy violation, but organizational policy allows you to request an HR Fairness Review or Higher-Level Review.`;
    return {
        verifiedFacts,
        possiblePatterns,
        aiRecommendation,
        suggestedAction: 'REQUEST_FAIRNESS_REVIEW',
        explanation: `Nexora Employee Advocacy mode provides an objective comparison of verified data without making unsupported accusations. Authorized humans make final determinations.`,
        canTriggerFairnessReview: true,
    };
}
