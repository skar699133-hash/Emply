import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, CheckCircle, ArrowRight, X } from 'lucide-react';
import { api } from '../../api/client';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  caseNumber: string;
  onSuccess: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  requestId,
  caseNumber,
  onSuccess,
}) => {
  const [resolutionQuality, setResolutionQuality] = useState<'COMPLETELY_RESOLVED' | 'PARTIALLY_RESOLVED' | 'NOT_RESOLVED'>('COMPLETELY_RESOLVED');
  const [satisfaction, setSatisfaction] = useState(5);
  const [responseRating, setResponseRating] = useState(5);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitFeedback(requestId, {
        resolutionQuality,
        satisfactionRating: satisfaction,
        responseTimeRating: responseRating,
        comments,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
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
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2C3E50]">Rate Your Resolution</h3>
              <p className="text-xs text-[#7F8C8D]">Case #{caseNumber} — Help improve workplace operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7F8C8D] hover:text-[#2C3E50] p-1.5 rounded-lg hover:bg-[#ECF0F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#2C3E50] mb-2">
              Was your workplace concern resolved?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'COMPLETELY_RESOLVED', label: 'Completely' },
                { val: 'PARTIALLY_RESOLVED', label: 'Partially' },
                { val: 'NOT_RESOLVED', label: 'Not Resolved' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setResolutionQuality(opt.val as any)}
                  className={`py-2 px-3 rounded-xl border text-center transition-all ${
                    resolutionQuality === opt.val
                      ? 'border-[#2C3E50] bg-[#ECF0F1] text-[#2C3E50] font-semibold shadow-xs'
                      : 'border-[#BDC3C7] bg-white text-[#7F8C8D] hover:bg-[#ECF0F1]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#2C3E50] mb-1.5">
              Overall Support Experience (1 to 5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSatisfaction(star)}
                  className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= satisfaction
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-[#7F8C8D] ml-2 font-medium">{satisfaction} / 5 stars</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#2C3E50] mb-1.5">
              Response Time Satisfaction (1 to 5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setResponseRating(star)}
                  className="p-1 text-slate-300 hover:text-[#2C3E50] transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= responseRating
                        ? 'text-[#2C3E50] fill-[#2C3E50]'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-[#7F8C8D] ml-2 font-medium">{responseRating} / 5</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#2C3E50] mb-1.5">
              Additional Feedback (Optional)
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Sam in Payroll was very fast in explaining the on-call adjustment..."
              className="w-full bg-white border border-[#BDC3C7] rounded-xl px-3 py-2 text-[#2C3E50] placeholder:text-[#7F8C8D] focus:outline-none focus:border-[#2C3E50] transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#BDC3C7]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 font-semibold text-[#34495E] hover:text-[#2C3E50] bg-[#ECF0F1] hover:bg-[#BDC3C7]/40 rounded-xl transition-colors border border-[#BDC3C7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 font-bold text-white bg-[#2C3E50] hover:bg-[#34495E] rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
