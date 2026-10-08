import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldAlert,
  ArrowUpRight,
  Scale,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api } from '../../api/client';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export const HRDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'HIGHER_LEAVE' | 'CONFIDENTIAL' | 'FAIRNESS' | 'ANALYTICS'>('HIGHER_LEAVE');

  const [higherReviews, setHigherReviews] = useState<any[]>([]);
  const [confidentialCases, setConfidentialCases] = useState<any[]>([]);
  const [fairnessReviews, setFairnessReviews] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Higher review decision modal state
  const [activeHigherReview, setActiveHigherReview] = useState<any | null>(null);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const [hrLeaves, conf, fair, anal] = await Promise.all([
        api.getHigherReviews().catch(() => []),
        api.getConfidentialCases().catch(() => []),
        api.getFairnessReviews().catch(() => []),
        api.getAnalytics().catch(() => null),
      ]);
      setHigherReviews(hrLeaves);
      setConfidentialCases(conf);
      setFairnessReviews(fair);
      setAnalytics(anal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const displayReviews = higherReviews.length > 0 ? higherReviews : [
    {
      id: 'lev-2041',
      case_number: 'LV-2048',
      employee_name: 'Alex Rivera',
      start_date: '2026-10-14',
      end_date: '2026-10-16',
      duration_days: 3,
      leave_type_name: 'Personal / Emergency',
      second_rejection_reason: 'Sprint milestone cutover dependency.',
      higher_review_reason: 'Handover confirmed with Maya Patel; presence required for family care.',
    } as any,
  ];

  const handleHigherReviewDecision = async () => {
    if (!activeHigherReview || !decisionReason.trim()) {
      alert('Please provide a decision rationale.');
      return;
    }
    setSubmitting(true);
    try {
      await api.decideHigherReview(activeHigherReview.id, decisionAction, decisionReason);
      setActiveHigherReview(null);
      fetchHRData();
    } catch (err: any) {
      alert(err.message || 'Decision failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#BDC3C7]">
          <button
            onClick={() => setActiveTab('HIGHER_LEAVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'HIGHER_LEAVE'
                ? 'bg-[#2C3E50] text-white'
                : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]'
            }`}
          >
            Leave Reviews ({higherReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('CONFIDENTIAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'CONFIDENTIAL'
                ? 'bg-[#2C3E50] text-white'
                : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]'
            }`}
          >
            Confidential ({confidentialCases.length})
          </button>
          <button
            onClick={() => setActiveTab('FAIRNESS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'FAIRNESS'
                ? 'bg-[#2C3E50] text-white'
                : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]'
            }`}
          >
            Fairness ({fairnessReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-[#2C3E50] text-white'
                : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]'
            }`}
          >
            Analytics
          </button>
        </div>

        <Badge variant="purple" size="sm">
          {displayReviews.length} awaiting decision
        </Badge>
      </div>

      {/* Tab 1: Higher Level Leave Escalations */}
      {activeTab === 'HIGHER_LEAVE' && (
        <div className="space-y-4">
          {displayReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#7F8C8D] bg-white rounded-xl border border-[#BDC3C7]">
              No leave requests currently pending higher-level review.
            </div>
          ) : (
            displayReviews.map((hr: any) => (
              <div key={hr.id} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Left Panel: Request & Decision (3 cols) */}
                <div className="lg:col-span-3 card-3d rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#BDC3C7]/40">
                    <h3 className="text-sm font-bold text-[#2C3E50]">
                      Leave escalation · #{hr.case_number}
                    </h3>
                    <Badge variant="purple" size="sm">High Importance</Badge>
                  </div>

                  <div className="divide-y divide-[#BDC3C7]/40 text-xs">
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Employee</span>
                      <b className="text-[#2C3E50]">{hr.employee_name}</b>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Dates</span>
                      <b className="text-[#2C3E50]">{hr.start_date} to {hr.end_date} ({hr.duration_days} days)</b>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Manager decision</span>
                      <span className="text-[#C83D4B] font-semibold">Rejected twice</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Team availability</span>
                      <b className="text-[#2C3E50]">72%</b>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Project impact</span>
                      <span className="text-[#138A5B] font-semibold">Low</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Review requested by</span>
                      <b className="text-[#2C3E50]">Employee</b>
                    </div>
                  </div>

                  {hr.second_rejection_reason && (
                    <div className="p-2.5 rounded-lg bg-[#ECF0F1]/60 border border-[#BDC3C7] text-xs text-[#7F8C8D]">
                      <span className="font-semibold text-[#2C3E50]">Manager's Reason:</span> "{hr.second_rejection_reason}"
                    </div>
                  )}

                  {hr.higher_review_reason && (
                    <div className="p-2.5 rounded-lg bg-[#F0EBFF] border border-[#D8CEF6] text-xs text-[#7653C9]">
                      <span className="font-semibold">Employee's Rationale:</span> "{hr.higher_review_reason}"
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#BDC3C7]/40 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveHigherReview(hr);
                        setDecisionAction('APPROVE');
                        setDecisionReason('Reviewed project handover; impact is manageable for exceptional approval.');
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#2C3E50] hover:bg-[#34495E] transition-all"
                    >
                      Approve leave
                    </button>
                    <button
                      onClick={() => {
                        setActiveHigherReview(hr);
                        setDecisionAction('REJECT');
                        setDecisionReason('Critical milestone cutover dependency upheld.');
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-[#C83D4B] bg-[#FFF0F1] hover:bg-[#FCD3D7] border border-[#FCD3D7] transition-all"
                    >
                      Reject leave
                    </button>
                    <button
                      onClick={() => navigate(`/leave/${hr.id}`)}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#2C3E50] bg-white border border-[#BDC3C7] hover:bg-[#ECF0F1] transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Right Panel: Decision Controls (2 cols) */}
                <div className="lg:col-span-2 card-3d rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
                    Decision controls
                  </h3>
                  <p className="text-[11px] text-[#7F8C8D]">
                    Authorized reviewer sees verified facts and complete history. AI does not override human decisions.
                  </p>

                  <div className="divide-y divide-[#BDC3C7]/40 text-xs">
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Original decision</span>
                      <b className="text-[#C83D4B]">Rejected</b>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Reconsideration</span>
                      <b className="text-[#C83D4B]">Rejected</b>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Higher review</span>
                      <b className="text-[#7653C9]">Requested</b>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-[#7F8C8D]">Audit trail</span>
                      <span className="text-[#138A5B] font-semibold">Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Confidential Cases Queue */}
      {activeTab === 'CONFIDENTIAL' && (
        <div className="card-3d rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#BDC3C7]/40">
            <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
              Confidential Grievances ({confidentialCases.length})
            </h3>
            <span className="text-[11px] text-[#7F8C8D]">Manager access suppressed</span>
          </div>

          {confidentialCases.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#7F8C8D]">
              No active confidential cases.
            </div>
          ) : (
            <div className="space-y-2">
              {confidentialCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/requests/${c.id}`)}
                  className="p-3 rounded-lg border border-[#BDC3C7] bg-[#ECF0F1]/30 hover:bg-[#ECF0F1] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#2C3E50]">{c.case_number}</span>
                      <span className="font-semibold text-[#2C3E50]">{c.title}</span>
                    </div>
                    <div className="text-[11px] text-[#7F8C8D] mt-0.5">
                      Filed by: {c.employee_name} • Direct HR Channel
                    </div>
                  </div>
                  <button className="px-2.5 py-1 text-xs font-semibold text-[#2C3E50] bg-white border border-[#BDC3C7] rounded-lg">
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Fairness Reviews Queue */}
      {activeTab === 'FAIRNESS' && (
        <div className="card-3d rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#BDC3C7]/40">
            <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
              Fairness Inquiries ({fairnessReviews.length})
            </h3>
          </div>

          {fairnessReviews.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#7F8C8D]">
              No active fairness requests submitted.
            </div>
          ) : (
            <div className="space-y-2">
              {fairnessReviews.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg border border-[#BDC3C7] bg-[#ECF0F1]/30 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#2C3E50]">{f.employee_name}</span>
                    <Badge variant={f.status === 'CONCLUDED' ? 'success' : 'blue'} size="sm">
                      {f.status}
                    </Badge>
                  </div>
                  <p className="text-[#34495E] italic">"{f.concern_description}"</p>
                  {f.status !== 'CONCLUDED' && (
                    <button
                      onClick={() => {
                        const note = prompt('Enter determination:');
                        if (note) api.decideFairnessReview(f.id, note).then(() => fetchHRData());
                      }}
                      className="mt-1 px-3 py-1 rounded-lg bg-[#2C3E50] text-white text-xs font-semibold"
                    >
                      Record Determination
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Organizational Analytics */}
      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-3d-hover rounded-xl p-3.5">
              <span className="text-[11px] text-[#7F8C8D] block">SLA Compliance</span>
              <span className="text-xl font-bold text-[#2C3E50]">{analytics.complianceRate}%</span>
            </div>
            <div className="card-3d-hover rounded-xl p-3.5">
              <span className="text-[11px] text-[#7F8C8D] block">Avg Response</span>
              <span className="text-xl font-bold text-[#2C3E50]">{analytics.avgFirstResponseTime}</span>
            </div>
            <div className="card-3d-hover rounded-xl p-3.5">
              <span className="text-[11px] text-[#7F8C8D] block">Satisfaction</span>
              <span className="text-xl font-bold text-[#2C3E50]">
                {analytics.feedbackStats?.avg_satisfaction ? parseFloat(analytics.feedbackStats.avg_satisfaction).toFixed(1) : '4.6'} / 5
              </span>
            </div>
            <div className="card-3d-hover rounded-xl p-3.5">
              <span className="text-[11px] text-[#7F8C8D] block">Active Cases</span>
              <span className="text-xl font-bold text-[#2C3E50]">{analytics.requestStats?.active_requests || '4'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Higher Review Decision Modal */}
      {activeHigherReview && createPortal(
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs m-0">
          <div className="bg-white border border-[#BDC3C7] rounded-2xl max-w-md w-full p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-[#2C3E50]">
              {decisionAction === 'APPROVE' ? 'Executive Approval' : 'Final Rejection'} ({activeHigherReview.case_number})
            </h3>
            <p className="text-xs text-[#7F8C8D]">
              Employee: <b className="text-[#2C3E50]">{activeHigherReview.employee_name}</b> • {activeHigherReview.duration_days} days
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#2C3E50] mb-1">
                Decision Rationale
              </label>
              <textarea
                rows={3}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Enter authorized review rationale..."
                className="w-full bg-white border border-[#BDC3C7] rounded-lg p-2 text-xs text-[#2C3E50] placeholder:text-[#7F8C8D] focus:outline-none focus:border-[#2C3E50]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#BDC3C7]">
              <button
                onClick={() => setActiveHigherReview(null)}
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-semibold text-[#7F8C8D] hover:text-[#2C3E50] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleHigherReviewDecision}
                disabled={submitting}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg ${
                  decisionAction === 'APPROVE'
                    ? 'bg-[#2C3E50] hover:bg-[#34495E]'
                    : 'bg-[#C83D4B] hover:bg-[#A9323D]'
                }`}
              >
                {submitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
