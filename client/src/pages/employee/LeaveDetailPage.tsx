import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, RotateCcw, ArrowUpRight, Scale } from 'lucide-react';
import { api } from '../../api/client';
import { LeaveRequest } from '../../types';
import { ReconsiderationModal } from '../../components/leave/ReconsiderationModal';
import { HigherReviewModal } from '../../components/leave/HigherReviewModal';
import { FairnessReviewModal } from '../../components/leave/FairnessReviewModal';
import { getStatusBadge, Badge } from '../../components/ui/Badge';

export const LeaveDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const [showReconsiderModal, setShowReconsiderModal] = useState(false);
  const [showHigherReviewModal, setShowHigherReviewModal] = useState(false);
  const [showFairnessModal, setShowFairnessModal] = useState(false);

  const fetchLeave = async () => {
    if (!id) return;
    try {
      const data = await api.getLeaveById(id);
      setLeave(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeave();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#7F8C8D]">Loading...</div>;
  }

  if (!leave) {
    return <div className="p-8 text-center text-xs text-[#7F8C8D]">Leave case not found.</div>;
  }

  const isRejectedOnce = leave.status === 'REJECTED';
  const isRejectedTwice = leave.status === 'REJECTED_AFTER_RECONSIDERATION';
  const isPendingHigherReview = leave.status === 'PENDING_HIGHER_REVIEW' || leave.status === 'HIGHER_REVIEW_REQUESTED';
  const isApproved = leave.status === 'APPROVED' || leave.status === 'APPROVED_AFTER_RECONSIDERATION' || leave.status === 'APPROVED_AFTER_ESCALATION';

  const startDateStr = leave.start_date?.split('T')[0] || '';
  const endDateStr = leave.end_date?.split('T')[0] || '';

  return (
    <div className="space-y-4">
      {/* Top back button */}
      <button
        onClick={() => navigate('/leave')}
        className="text-xs text-[#7F8C8D] hover:text-[#2C3E50] flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Leave
      </button>

      {/* Case Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#2C3E50]">Leave Request · #{leave.case_number}</h2>
          <Badge variant={leave.importance === 'HIGH_IMPORTANCE' ? 'warning' : 'neutral'} size="sm">
            {leave.importance === 'HIGH_IMPORTANCE' ? 'High Importance' : 'Standard'}
          </Badge>
        </div>
        {getStatusBadge(leave.status)}
      </div>

      {/* Two Column Layout matching Prototype */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Column: Details + Timeline (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Key Facts Panel */}
          <div className="card-3d rounded-xl p-4">
            <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider mb-2">
              Request Details
            </h3>

            <div className="divide-y divide-[#BDC3C7]/40 text-xs">
              <div className="flex justify-between py-2">
                <span className="text-[#7F8C8D]">Dates</span>
                <b className="text-[#2C3E50]">{startDateStr} to {endDateStr}</b>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#7F8C8D]">Duration</span>
                <b className="text-[#2C3E50]">{leave.duration_days} working days</b>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#7F8C8D]">Type</span>
                <b className="text-[#2C3E50]">{leave.leave_type_name}</b>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#7F8C8D]">Leave balance</span>
                <b className="text-[#2C3E50]">6 days</b>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#7F8C8D]">Policy eligibility</span>
                <span className="text-[#138A5B] font-semibold">Eligible</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#7F8C8D]">Team availability</span>
                <b className="text-[#2C3E50]">{leave.team_availability_percent || 78}%</b>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#7F8C8D]">Project impact</span>
                <span className="text-[#138A5B] font-semibold">{leave.project_impact_level || 'Low'}</span>
              </div>
            </div>

            {leave.reason && (
              <div className="mt-3 pt-2 border-t border-[#BDC3C7]/40 text-xs text-[#7F8C8D]">
                <span className="font-semibold text-[#2C3E50]">Reason:</span> "{leave.reason}"
              </div>
            )}
          </div>

          {/* Decision History Panel */}
          <div className="card-3d rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
              Decision History
            </h3>

            <div className="border-l-2 border-[#BDC3C7] ml-2 pl-4 space-y-3 text-xs">
              {isPendingHigherReview && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#7653C9]" />
                  <strong className="block text-[#2C3E50]">Higher-level review requested</strong>
                  <small className="text-[#7F8C8D]">Today · Escalated for independent executive determination</small>
                </div>
              )}

              {leave.second_rejection_reason && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#C83D4B]" />
                  <strong className="block text-[#2C3E50]">Manager rejected reconsideration</strong>
                  <small className="text-[#7F8C8D]">Reason: {leave.second_rejection_reason}</small>
                </div>
              )}

              {Boolean(leave.reconsideration_count && leave.reconsideration_count > 0) && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#B86B00]" />
                  <strong className="block text-[#2C3E50]">Reconsideration requested</strong>
                  <small className="text-[#7F8C8D]">Employee submitted updated project handover plan</small>
                </div>
              )}

              {leave.initial_rejection_reason && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#C83D4B]" />
                  <strong className="block text-[#2C3E50]">Manager rejected original request</strong>
                  <small className="text-[#7F8C8D]">Reason: {leave.initial_rejection_reason}</small>
                </div>
              )}

              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#2C3E50]" />
                <strong className="block text-[#2C3E50]">Leave submitted</strong>
                <small className="text-[#7F8C8D]">AI verified balance and policy eligibility</small>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status + Actions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Panel */}
          <div className="card-3d rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
              Status Overview
            </h3>

            {isPendingHigherReview && (
              <div className="p-3 rounded-lg bg-[#F0EBFF] border border-[#D8CEF6] text-xs text-[#7653C9]">
                <b>Awaiting higher-level review.</b>
                <div className="text-[11px] text-[#7653C9]/80 mt-0.5">
                  Assigned to skip-level authorized reviewer. No manual follow-up needed.
                </div>
              </div>
            )}

            {isRejectedTwice && !isPendingHigherReview && (
              <div className="p-3 rounded-lg bg-[#FFF0F1] border border-[#FCD3D7] text-xs text-[#C83D4B]">
                <b>Manager declined reconsideration.</b>
                <div className="text-[11px] text-[#C83D4B]/80 mt-0.5">
                  High-importance requests are eligible for skip-level executive review.
                </div>
              </div>
            )}

            {isRejectedOnce && (
              <div className="p-3 rounded-lg bg-[#FFF5DF] border border-[#FDE3A7] text-xs text-[#B86B00]">
                <b>Initial request declined.</b>
                <div className="text-[11px] text-[#B86B00]/80 mt-0.5">
                  1 reconsideration with your manager is permitted by corporate policy.
                </div>
              </div>
            )}

            {isApproved && (
              <div className="p-3 rounded-lg bg-[#E8F7F0] border border-[#BCE7D3] text-xs text-[#138A5B] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#138A5B]" />
                <span>Leave request is approved.</span>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <div className="h-1.5 bg-[#ECF0F1] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2C3E50] rounded-full transition-all"
                  style={{ width: isApproved ? '100%' : isPendingHigherReview ? '75%' : '40%' }}
                />
              </div>
              <div className="text-[11px] text-[#7F8C8D] flex justify-between">
                <span>Current step:</span>
                <b className="text-[#2C3E50]">
                  {isApproved
                    ? 'Completed'
                    : isPendingHigherReview
                    ? 'Authorized Reviewer'
                    : isRejectedOnce
                    ? 'Awaiting Reconsideration'
                    : 'Manager Decision'}
                </b>
              </div>
            </div>

            <p className="text-[11px] text-[#7F8C8D] pt-2 border-t border-[#BDC3C7]/40">
              The final decision remains with the authorized human reviewer.
            </p>
          </div>

          {/* Action Panel */}
          <div className="card-3d rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
              Actions
            </h3>

            <div className="flex flex-col gap-2">
              {isRejectedOnce && (
                <button
                  onClick={() => setShowReconsiderModal(true)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#2C3E50] hover:bg-[#34495E] transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Request Reconsideration
                </button>
              )}

              {isRejectedTwice && !isPendingHigherReview && (
                <button
                  onClick={() => setShowHigherReviewModal(true)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#2C3E50] hover:bg-[#34495E] transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Request Higher Review
                </button>
              )}

              <button
                onClick={() => setShowFairnessModal(true)}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-[#2C3E50] bg-white border border-[#BDC3C7] hover:bg-[#ECF0F1] transition-all flex items-center justify-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5" />
                Request Fairness Check
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReconsiderationModal
        isOpen={showReconsiderModal}
        onClose={() => setShowReconsiderModal(false)}
        leaveId={leave.id}
        caseNumber={leave.case_number}
        initialRejectionReason={leave.initial_rejection_reason}
        onSuccess={fetchLeave}
      />

      <HigherReviewModal
        isOpen={showHigherReviewModal}
        onClose={() => setShowHigherReviewModal(false)}
        leaveId={leave.id}
        caseNumber={leave.case_number}
        secondRejectionReason={leave.second_rejection_reason}
        onSuccess={fetchLeave}
      />

      <FairnessReviewModal
        isOpen={showFairnessModal}
        onClose={() => setShowFairnessModal(false)}
        leaveId={leave.id}
        caseNumber={leave.case_number}
        onSuccess={fetchLeave}
      />
    </div>
  );
};
