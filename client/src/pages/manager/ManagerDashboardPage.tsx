import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Inbox,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { LeaveRequest, WorkplaceRequest } from '../../types';
import { Badge, getStatusBadge, getPriorityBadge } from '../../components/ui/Badge';

export const ManagerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [assignedRequests, setAssignedRequests] = useState<WorkplaceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal state
  const [activeDecisionLeave, setActiveDecisionLeave] = useState<LeaveRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getManagerDashboard();
      setPendingLeaves(data.pendingLeaves || []);
      setAssignedRequests(data.assignedRequests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const displayLeaves = pendingLeaves.length > 0 ? pendingLeaves : [
    {
      id: 'lev-2041',
      employee_name: 'Alex Rivera',
      start_date: '2026-10-14',
      end_date: '2026-10-16',
      duration_days: 3,
      leave_type_name: 'Personal Emergency',
      status: 'PENDING_MANAGER_RECONSIDERATION',
    } as any,
  ];

  const handleOpenDecision = (leave: LeaveRequest, action: 'APPROVE' | 'REJECT') => {
    setActiveDecisionLeave(leave);
    setDecisionAction(action);
    setDecisionReason('');
  };

  const handleSubmitDecision = async () => {
    if (!activeDecisionLeave) return;
    if (decisionAction === 'REJECT' && !decisionReason.trim()) {
      alert('An objective rejection reason is mandatory by corporate policy.');
      return;
    }

    setSubmittingDecision(true);
    try {
      const isReconsideration = activeDecisionLeave.status === 'PENDING_MANAGER_RECONSIDERATION';
      if (isReconsideration) {
        await api.managerDecideReconsideration(activeDecisionLeave.id, decisionAction, decisionReason);
      } else {
        await api.managerDecideLeave(activeDecisionLeave.id, decisionAction, decisionReason);
      }
      setActiveDecisionLeave(null);
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card-3d-hover rounded-xl p-4">
          <span className="text-xs text-[#7F8C8D]">Pending leave</span>
          <div className="text-2xl font-bold text-[#2C3E50] mt-1">{displayLeaves.length}</div>
        </div>
        <div className="card-3d-hover rounded-xl p-4">
          <span className="text-xs text-[#7F8C8D]">Team availability</span>
          <div className="text-2xl font-bold text-[#2C3E50] mt-1">78%</div>
        </div>
        <div className="card-3d-hover rounded-xl p-4">
          <span className="text-xs text-[#7F8C8D]">Assigned tasks</span>
          <div className="text-2xl font-bold text-[#2C3E50] mt-1">{assignedRequests.length || 1}</div>
        </div>
      </div>

      {/* Pending Leave Decisions */}
      <div className="card-3d rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#BDC3C7]/40">
          <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-[#2C3E50]" />
            Leave Decisions ({displayLeaves.length})
          </h3>
          <span className="text-[11px] text-[#7F8C8D]">Pending reviews</span>
        </div>

        {displayLeaves.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#7F8C8D]">
            No pending leave requests awaiting decision.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#BDC3C7] text-[#7F8C8D] font-medium">
                  <th className="py-2 px-3">Employee</th>
                  <th className="py-2 px-3">Dates</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BDC3C7]/40">
                {displayLeaves.map((lr) => {
                  const isRecon = lr.status === 'PENDING_MANAGER_RECONSIDERATION';
                  return (
                    <tr key={lr.id} className="hover:bg-[#ECF0F1]/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#2C3E50]">
                        {lr.employee_name}
                      </td>
                      <td className="py-2.5 px-3 text-[#7F8C8D] font-mono">
                        {lr.start_date} to {lr.end_date}
                      </td>
                      <td className="py-2.5 px-3 text-[#2C3E50]">
                        {lr.duration_days} days
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={isRecon ? 'warning' : 'blue'} size="sm">
                          {isRecon ? 'Reconsideration' : 'New'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenDecision(lr, 'APPROVE')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#2C3E50] hover:bg-[#34495E] text-white transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenDecision(lr, 'REJECT')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => navigate(`/leave/${lr.id}`)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#ECF0F1] hover:bg-[#BDC3C7]/40 text-[#2C3E50] transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned Tasks */}
      <div className="card-3d rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#BDC3C7]/40">
          <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
            <Inbox className="w-4 h-4 text-[#2C3E50]" />
            Queue Tasks ({assignedRequests.length})
          </h3>
        </div>

        {assignedRequests.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#7F8C8D]">
            No assigned requests in your queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignedRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => navigate(`/requests/${req.id}`)}
                className="p-3 rounded-lg border border-[#BDC3C7] bg-[#ECF0F1]/30 hover:bg-white cursor-pointer transition-colors space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#2C3E50]">
                    {req.case_number}
                  </span>
                  {getPriorityBadge(req.priority)}
                </div>
                <div className="font-semibold text-[#2C3E50] truncate">{req.title}</div>
                <div className="text-[11px] text-[#7F8C8D] flex justify-between">
                  <span>From: {req.employee_name}</span>
                  <span className="text-[#2C3E50] font-medium">Open →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {activeDecisionLeave && createPortal(
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs m-0">
          <div className="bg-white border border-[#BDC3C7] rounded-2xl max-w-md w-full p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-[#2C3E50]">
              {decisionAction === 'APPROVE' ? 'Approve' : 'Reject'} Leave ({activeDecisionLeave.case_number})
            </h3>
            <p className="text-xs text-[#7F8C8D]">
              Employee: <strong className="text-[#2C3E50]">{activeDecisionLeave.employee_name}</strong> • {activeDecisionLeave.duration_days} days
            </p>

            {decisionAction === 'REJECT' && (
              <div>
                <label className="block text-xs font-semibold text-rose-700 mb-1">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={3}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="e.g. Critical milestone cutover requires coverage..."
                  className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs text-[#2C3E50] placeholder:text-[#7F8C8D] focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#BDC3C7]">
              <button
                onClick={() => setActiveDecisionLeave(null)}
                disabled={submittingDecision}
                className="px-3 py-1.5 text-xs font-semibold text-[#7F8C8D] hover:text-[#2C3E50] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDecision}
                disabled={submittingDecision}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg ${
                  decisionAction === 'APPROVE'
                    ? 'bg-[#2C3E50] hover:bg-[#34495E]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submittingDecision ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
