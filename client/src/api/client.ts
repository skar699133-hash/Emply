const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('nexora_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

// API methods
export const api = {
  // Auth
  login: (email: string, password?: string) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => apiRequest('/auth/me'),
  getDemoUsers: () => apiRequest('/auth/demo-users'),

  // AI Assistant
  askAI: (query: string) =>
    apiRequest('/ai/ask', { method: 'POST', body: JSON.stringify({ query }) }),
  askPolicyQA: (question: string) =>
    apiRequest('/ai/policy-qa', { method: 'POST', body: JSON.stringify({ question }) }),
  getAdvocacy: (data: { concernText: string; leaveRequestId?: string }) =>
    apiRequest('/ai/advocacy', { method: 'POST', body: JSON.stringify(data) }),
  analyzeLeave: (data: any) =>
    apiRequest('/ai/leave-analysis', { method: 'POST', body: JSON.stringify(data) }),
  getLeaveDateSuggestions: (durationDays: number, monthOffset: number = 1) =>
    apiRequest('/ai/leave-date-suggestions', { method: 'POST', body: JSON.stringify({ durationDays, monthOffset }) }),

  // Workplace Requests
  getRequests: (params?: { status?: string; priority?: string; category?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/requests${query ? '?' + query : ''}`);
  },
  getRequestById: (id: string) => apiRequest(`/requests/${id}`),
  createRequest: (data: any) =>
    apiRequest('/requests', { method: 'POST', body: JSON.stringify(data) }),
  addComment: (id: string, content: string, isInternalNote: boolean = false) =>
    apiRequest(`/requests/${id}/comments`, { method: 'POST', body: JSON.stringify({ content, isInternalNote }) }),
  escalateRequest: (id: string, reason: string) =>
    apiRequest(`/requests/${id}/escalate`, { method: 'POST', body: JSON.stringify({ reason }) }),
  submitFeedback: (id: string, data: any) =>
    apiRequest(`/requests/${id}/feedback`, { method: 'POST', body: JSON.stringify(data) }),

  // Leave Management
  getLeaveDashboard: () => apiRequest('/leave'),
  getLeaveTypes: () => apiRequest('/leave/types'),
  getLeaveById: (id: string) => apiRequest(`/leave/${id}`),
  createLeave: (data: any) =>
    apiRequest('/leave', { method: 'POST', body: JSON.stringify(data) }),
  reconsiderLeave: (id: string, reason: string) =>
    apiRequest(`/leave/${id}/reconsider`, { method: 'POST', body: JSON.stringify({ reason }) }),
  higherReviewLeave: (id: string, reason: string) =>
    apiRequest(`/leave/${id}/higher-review`, { method: 'POST', body: JSON.stringify({ reason }) }),
  fairnessReviewLeave: (id: string, data: any) =>
    apiRequest(`/leave/${id}/fairness-review`, { method: 'POST', body: JSON.stringify(data) }),

  // Manager Actions
  getManagerDashboard: () => apiRequest('/manager/dashboard'),
  managerDecideLeave: (id: string, action: 'APPROVE' | 'REJECT', reason?: string) =>
    apiRequest(`/manager/leave/${id}/decide`, { method: 'POST', body: JSON.stringify({ action, reason }) }),
  managerDecideReconsideration: (id: string, action: 'APPROVE' | 'REJECT', reason?: string) =>
    apiRequest(`/manager/leave/${id}/decide-reconsideration`, { method: 'POST', body: JSON.stringify({ action, reason }) }),
  managerUpdateRequestStatus: (id: string, status: string, comment?: string) =>
    apiRequest(`/manager/requests/${id}/status`, { method: 'POST', body: JSON.stringify({ status, comment }) }),

  // HR & Higher Authority
  getConfidentialCases: () => apiRequest('/hr/confidential-cases'),
  getHigherReviews: () => apiRequest('/hr/higher-reviews'),
  decideHigherReview: (id: string, action: 'APPROVE' | 'REJECT', reason: string) =>
    apiRequest(`/hr/higher-reviews/${id}/decide`, { method: 'POST', body: JSON.stringify({ action, reason }) }),
  getFairnessReviews: () => apiRequest('/hr/fairness-reviews'),
  decideFairnessReview: (id: string, determination: string) =>
    apiRequest(`/hr/fairness-reviews/${id}/decide`, { method: 'POST', body: JSON.stringify({ determination }) }),
  getAnalytics: () => apiRequest('/hr/analytics'),

  // Policies & Notifications
  getPolicies: () => apiRequest('/policies'),
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    apiRequest('/notifications/read-all', { method: 'PATCH' }),

  // Admin
  getAuditLogs: () => apiRequest('/admin/audit-logs'),
  getCategories: () => apiRequest('/admin/categories'),
  getSlas: () => apiRequest('/admin/slas'),
};
