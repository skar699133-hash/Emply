import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, ArrowRight, X, Clock, Users, ShieldAlert } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  aiData: {
    summary: {
      issue: string;
      category: string;
      priority: string;
      assignedTeam: string;
      expectedResponse: string;
      confidentiality: string;
      nextStep: string;
    };
    classification: any;
    routing: any;
    priority: any;
  } | null;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  aiData,
}) => {
  if (!isOpen || !aiData) return null;

  const { summary, routing, priority } = aiData;
  const isConfidential = routing.confidential;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in m-0">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Header accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#2C3E50]" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECF0F1] border border-[#BDC3C7] flex items-center justify-center text-[#2C3E50]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2C3E50]">Review Before Submission</h3>
              <p className="text-xs text-[#7F8C8D]">Here is what Nexora AI understood from your concern</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7F8C8D] hover:text-[#2C3E50] p-1 rounded-lg hover:bg-[#ECF0F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structured summary box */}
        <div className="space-y-3 bg-[#ECF0F1]/40 p-4 rounded-xl border border-[#BDC3C7] text-xs">
          <div>
            <span className="text-[#7F8C8D] block mb-0.5 font-medium">Issue</span>
            <span className="text-[#2C3E50] font-semibold text-sm leading-snug">{summary.issue}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#BDC3C7]/60">
            <div>
              <span className="text-[#7F8C8D] block mb-1">Category</span>
              <span className="font-semibold text-[#2C3E50]">{summary.category}</span>
            </div>
            <div>
              <span className="text-[#7F8C8D] block mb-1">Priority</span>
              <Badge variant={summary.priority === 'CRITICAL' ? 'danger' : summary.priority === 'HIGH' ? 'warning' : 'blue'}>
                {summary.priority}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#BDC3C7]/60">
            <div>
              <span className="text-[#7F8C8D] block mb-1">Assigned Team</span>
              <span className="font-semibold text-[#2C3E50] flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {summary.assignedTeam}
              </span>
            </div>
            <div>
              <span className="text-[#7F8C8D] block mb-1">Expected Response</span>
              <span className="font-medium text-[#2C3E50] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#7F8C8D]" />
                {summary.expectedResponse}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#BDC3C7]/60">
            <span className="text-[#7F8C8D] block mb-1">Confidentiality</span>
            {isConfidential ? (
              <div className="flex items-center gap-1.5 text-amber-800 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>Protected Confidential Case: Direct manager visibility is suppressed. Routed directly to Employee Relations.</span>
              </div>
            ) : (
              <span className="text-[#2C3E50] font-medium">Standard department routing</span>
            )}
          </div>

          <div className="pt-2 border-t border-[#BDC3C7]/60">
            <span className="text-[#7F8C8D] block mb-0.5">Next Action</span>
            <span className="text-[#2C3E50] font-medium">{summary.nextStep}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-[#2C3E50] hover:bg-[#ECF0F1] bg-white border border-[#BDC3C7] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#2C3E50] hover:bg-[#34495E] rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            {loading ? 'Creating Case...' : 'Submit Request'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
