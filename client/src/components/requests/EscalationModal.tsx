import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { api } from '../../api/client';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  caseNumber: string;
  onSuccess: () => void;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  isOpen,
  onClose,
  requestId,
  caseNumber,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide an escalation justification.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.escalateRequest(requestId, reason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Escalation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in m-0">
      <div className="bg-white border border-[#BDC3C7] rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECF0F1] border border-[#BDC3C7] flex items-center justify-center text-[#2C3E50]">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2C3E50]">Escalate Case</h3>
              <p className="text-xs text-[#7F8C8D]">Case #{caseNumber} — Expedite to Senior Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7F8C8D] hover:text-[#2C3E50] p-1.5 rounded-lg hover:bg-[#ECF0F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900">
          <p>
            If your request has exceeded expected SLA timeframes or has become a critical business blocker, you can escalate
            directly to the team lead or department manager.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2C3E50] mb-1.5">
              Escalation Reason / Operational Impact
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Expected SLA of 4 hours has elapsed and upcoming client meeting is blocked without resolution..."
              className="w-full bg-white border border-[#BDC3C7] rounded-xl px-3 py-2 text-xs text-[#2C3E50] placeholder:text-[#7F8C8D] focus:outline-none focus:border-[#2C3E50] transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#BDC3C7]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#34495E] hover:text-[#2C3E50] bg-[#ECF0F1] hover:bg-[#BDC3C7]/40 rounded-xl transition-colors border border-[#BDC3C7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#2C3E50] hover:bg-[#34495E] rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {loading ? 'Escalating...' : 'Confirm Escalation'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
