import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Sparkles, AlertCircle, ArrowRight, X, ChevronDown } from 'lucide-react';
import { api } from '../../api/client';
import { Badge } from '../ui/Badge';

const DEFAULT_LEAVE_TYPES = [
  { code: 'ANNUAL', name: 'Annual Paid Vacation', importance_level: 'NORMAL' },
  { code: 'SICK', name: 'Medical & Sick Leave', importance_level: 'NORMAL' },
  { code: 'PERSONAL', name: 'Personal & Family Emergency Leave', importance_level: 'HIGH_IMPORTANCE' },
  { code: 'BEREAVEMENT', name: 'Compassionate / Bereavement Leave', importance_level: 'EXCEPTIONAL' },
  { code: 'PARENTAL', name: 'Parental Bonding Leave', importance_level: 'HIGH_IMPORTANCE' },
  { code: 'UNPAID', name: 'Unpaid Leave / Sabbatical', importance_level: 'NORMAL' },
];

interface LeaveApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leaveId: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  initialDurationDays?: string | number;
}

export const LeaveApplicationModal: React.FC<LeaveApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStartDate,
  initialEndDate,
  initialDurationDays,
}) => {
  const [leaveTypes, setLeaveTypes] = useState<any[]>(DEFAULT_LEAVE_TYPES);
  const [selectedType, setSelectedType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState('3');
  const [reason, setReason] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getLeaveTypes()
        .then((types) => {
          if (Array.isArray(types) && types.length > 0) {
            setLeaveTypes(types);
            if (!types.some((t: any) => t.code === selectedType)) {
              setSelectedType(types[0].code);
            }
          }
        })
        .catch((err) => {
          console.warn('Using standard fallback leave types:', err);
        });

      if (initialStartDate) {
        setStartDate(initialStartDate);
      } else {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setStartDate(nextWeek.toISOString().split('T')[0]);
      }

      if (initialEndDate) {
        setEndDate(initialEndDate);
      } else {
        const endNextWeek = new Date();
        endNextWeek.setDate(endNextWeek.getDate() + 10);
        setEndDate(endNextWeek.toISOString().split('T')[0]);
      }

      if (initialDurationDays) {
        setDurationDays(String(initialDurationDays));
      }
    }
  }, [isOpen, initialStartDate, initialEndDate, initialDurationDays]);

  const handleAnalyze = async () => {
    if (!startDate || !endDate || !reason) {
      setError('Please provide start date, end date, and reason to run AI analysis');
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const res = await api.analyzeLeave({
        leaveTypeCode: selectedType,
        startDate,
        endDate,
        durationDays: parseFloat(durationDays || '1'),
        reason,
      });
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setError('All fields are required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.createLeave({
        leaveTypeCode: selectedType,
        startDate,
        endDate,
        durationDays: parseFloat(durationDays || '1'),
        reason,
      });
      onSuccess(res.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in m-0">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECF0F1] border border-[#BDC3C7] flex items-center justify-center text-[#2C3E50]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2C3E50]">Apply for Leave</h3>
              <p className="text-xs text-[#7F8C8D]">EMPLY AI validates policy, team availability, and project dependencies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7F8C8D] hover:text-[#2C3E50] p-1 rounded-lg hover:bg-[#ECF0F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2C3E50] mb-1.5">
                Leave Type
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#BDC3C7] rounded-xl pl-3 pr-10 py-2.5 text-xs text-[#2C3E50] font-medium focus:outline-none focus:border-[#2C3E50] focus:ring-1 focus:ring-[#2C3E50] transition-colors shadow-2xs cursor-pointer"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.code} value={t.code} className="text-[#2C3E50] bg-white py-1">
                      {t.name} {t.importance_level ? `(${t.importance_level.replace(/_/g, ' ')})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#7F8C8D] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2C3E50] mb-1.5">
                Duration (Working Days)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full bg-white border border-[#BDC3C7] rounded-xl px-3 py-2 text-xs text-[#2C3E50] focus:outline-none focus:border-[#2C3E50] transition-colors shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2C3E50] mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-[#BDC3C7] rounded-xl px-3 py-2 text-xs text-[#2C3E50] focus:outline-none focus:border-[#2C3E50] transition-colors shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2C3E50] mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-[#BDC3C7] rounded-xl px-3 py-2 text-xs text-[#2C3E50] focus:outline-none focus:border-[#2C3E50] transition-colors shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2C3E50] mb-1.5">
              Reason for Absence
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Taking personal leave to assist with family surgery / vacation trip..."
              className="w-full bg-white border border-[#BDC3C7] rounded-xl px-3 py-2 text-xs text-[#2C3E50] placeholder:text-[#7F8C8D] focus:outline-none focus:border-[#2C3E50] transition-colors shadow-2xs"
            />
          </div>

          {/* AI Pre-Analysis button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="text-xs font-semibold text-[#2C3E50] hover:text-[#34495E] flex items-center gap-1.5 py-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {analyzing ? 'Evaluating Impact & Policy...' : 'Run AI Impact & Policy Check'}
            </button>
          </div>

          {/* AI Analysis Result Panel */}
          {analysis && (
            <div className="bg-[#ECF0F1]/60 border border-[#BDC3C7] rounded-xl p-4 text-xs space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2C3E50] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#2C3E50]" />
                  AI Analysis Summary
                </span>
                <Badge variant={analysis.importance === 'HIGH_IMPORTANCE' ? 'warning' : 'blue'}>
                  {analysis.importance}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[#2C3E50]">
                <div className="p-2.5 bg-white border border-[#BDC3C7] rounded-lg shadow-2xs">
                  <span className="text-[#7F8C8D] block text-[10px] font-medium">Policy Eligibility</span>
                  <span className="font-semibold text-[#2C3E50]">{analysis.policyNote}</span>
                </div>
                <div className="p-2.5 bg-white border border-[#BDC3C7] rounded-lg shadow-2xs">
                  <span className="text-[#7F8C8D] block text-[10px] font-medium">Team Availability</span>
                  <span className="font-semibold text-[#2C3E50]">{analysis.teamAvailabilityImpact}</span>
                </div>
              </div>

              {analysis.teamCoverageWarning && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                  {analysis.teamCoverageWarning}
                </div>
              )}

              <div className="p-2.5 bg-white border border-[#BDC3C7] rounded-lg text-[#2C3E50]">
                <span className="text-[#2C3E50] font-semibold block mb-0.5">AI Recommendation:</span>
                {analysis.aiRecommendation}
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#BDC3C7]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#34495E] hover:text-[#2C3E50] bg-[#ECF0F1] hover:bg-[#BDC3C7]/40 rounded-xl transition-colors border border-[#BDC3C7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#2C3E50] hover:bg-[#34495E] rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
