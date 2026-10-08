export function generateEmployeeRequestSummary(params: {
  title: string;
  categoryName: string;
  priority: string;
  teamName: string;
  slaDescription: string;
  confidentiality: string;
  nextStep: string;
}) {
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

export function generateManagerReviewSummary(params: {
  employeeName: string;
  leaveType: string;
  dates: string;
  durationDays: number;
  remainingBalance: number;
  policyEligible: boolean;
  teamAvailabilityPercent: number;
  projectImpact: string;
  crossTeamImpact: string;
  aiRecommendation: string;
}) {
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
