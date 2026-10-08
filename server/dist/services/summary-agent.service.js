export function generateEmployeeRequestSummary(params) {
    return {
        issue: params.title,
        category: params.categoryName,
        priority: params.priority,
        assignedTeam: params.teamName,
        expectedResponse: params.slaDescription,
        confidentiality: params.confidentiality,
        nextStep: params.nextStep,
    };
}
export function generateManagerReviewSummary(params) {
    return {
        employee: params.employeeName,
        leaveDates: params.dates,
        duration: `${params.durationDays} working days`,
        balance: `${params.remainingBalance} days remaining`,
        policy: params.policyEligible ? 'Eligible' : 'Requires Exception',
        teamAvailability: `${params.teamAvailabilityPercent}%`,
        projectImpact: params.projectImpact,
        crossTeamImpact: params.crossTeamImpact,
        aiRecommendation: params.aiRecommendation,
    };
}
