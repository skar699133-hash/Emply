import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { api } from '../../api/client';
import { LeaveBalance, LeaveRequest } from '../../types';
import { LeaveApplicationModal } from '../../components/leave/LeaveApplicationModal';
import { OptimalDateSuggestionsModal } from '../../components/leave/OptimalDateSuggestionsModal';
import { getStatusBadge } from '../../components/ui/Badge';

export const LeaveDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaveDashboard();
      setBalances(data.balances || []);
      setMyRequests(data.myRequests || []);
      setTeamLeaves(data.teamLeaves || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const displayBalances = balances.length > 0 ? balances : [
    { id: 'bal-1', leave_type_name: 'Annual Paid', remaining_days: 14, used_days: 4, total_allocated: 18 },
    { id: 'bal-2', leave_type_name: 'Medical & Sick', remaining_days: 8, used_days: 2, total_allocated: 10 },
    { id: 'bal-3', leave_type_name: 'Personal', remaining_days: 3, used_days: 2, total_allocated: 5 },
    { id: 'bal-4', leave_type_name: 'Bereavement', remaining_days: 5, used_days: 0, total_allocated: 5 },
  ];

  const displayRequests = myRequests.length > 0 ? myRequests : [
    {
      id: 'lev-2041',
      case_number: 'LEV-2041',
      start_date: '2026-10-14',
      end_date: '2026-10-16',
      duration_days: 3,
      leave_type_name: 'Personal Emergency Leave',
      status: 'HIGHER_REVIEW_REQUESTED',
      importance: 'HIGH_IMPORTANCE',
      reason: 'Urgent family situation requiring travel.',
    } as any,
  ];

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#2C3E50]">Leave Overview</h2>
          <p className="text-xs text-[#7F8C8D]">Balances and upcoming absence schedules.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDateModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#BDC3C7] text-[#2C3E50] hover:bg-[#ECF0F1] transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2C3E50]" />
            Best Dates
          </button>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2C3E50] hover:bg-[#34495E] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayBalances.map((bal: any) => (
          <div
            key={bal.id}
            className="card-3d-hover rounded-xl p-3.5 flex flex-col justify-between"
          >
            <div className="text-xs font-medium text-[#7F8C8D] truncate">
              {bal.leave_type_name}
            </div>
            <div className="text-xl font-bold text-[#2C3E50] my-1">
              {bal.remaining_days} <span className="text-xs font-normal text-[#7F8C8D]">days</span>
            </div>
            <div className="text-[10px] text-[#7F8C8D] border-t border-[#BDC3C7]/40 pt-1 flex justify-between">
              <span>Used: {bal.used_days}d</span>
              <span>Total: {bal.total_allocated}d</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Columns: Requests & Team Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Requests (2 cols) */}
        <div className="lg:col-span-2 card-3d rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#BDC3C7]/40">
            <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
              My Leave Requests
            </h3>
            <span className="text-xs text-[#7F8C8D]">{displayRequests.length} total</span>
          </div>

          <div className="space-y-2">
            {displayRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => navigate(`/leave/${req.id}`)}
                className="p-3 rounded-lg border border-[#BDC3C7]/70 bg-white shadow-[0_1px_3px_rgba(44,62,80,0.04)] hover:shadow-sm hover:border-[#7F8C8D] hover:-translate-y-0.5 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#2C3E50]">
                      {req.case_number}
                    </span>
                    <span className="font-semibold text-[#2C3E50] truncate">
                      {req.leave_type_name}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#7F8C8D] mt-0.5">
                    {req.start_date?.split('T')[0]} to {req.end_date?.split('T')[0]} • {req.duration_days} days
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(req.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Schedule (1 col) */}
        <div className="card-3d rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#BDC3C7]/40">
            <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
              Team Schedule
            </h3>
            <Users className="w-3.5 h-3.5 text-[#7F8C8D]" />
          </div>

          <div className="space-y-2">
            {teamLeaves.length === 0 ? (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full team coverage available.</span>
              </div>
            ) : (
              teamLeaves.map((tl, i) => (
                <div
                  key={tl.id || i}
                  className="p-2 rounded-lg bg-[#ECF0F1]/50 border border-[#BDC3C7]/60 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-[#2C3E50] block">{tl.full_name}</span>
                    <span className="text-[10px] text-[#7F8C8D]">{tl.leave_type_name}</span>
                  </div>
                  <span className="text-[10px] text-[#7F8C8D] font-mono">
                    {tl.start_date.split('-').slice(1).join('/')} - {tl.end_date.split('-').slice(1).join('/')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LeaveApplicationModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSuccess={(id) => {
          fetchLeaveData();
          navigate(`/leave/${id}`);
        }}
      />

      <OptimalDateSuggestionsModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelectOption={() => {
          setShowApplyModal(true);
        }}
      />
    </div>
  );
};
