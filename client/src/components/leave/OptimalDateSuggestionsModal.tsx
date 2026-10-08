import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Sparkles, Check, ArrowRight, X } from 'lucide-react';
import { api } from '../../api/client';
import { Badge } from '../ui/Badge';

interface OptimalDateSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (startDate: string, endDate: string, duration: number) => void;
}

export const OptimalDateSuggestionsModal: React.FC<OptimalDateSuggestionsModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
}) => {
  const [durationDays, setDurationDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleFetch = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaveDateSuggestions(durationDays, 1);
      setSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in m-0">
      <div className="bg-white border border-[#BDC3C7] rounded-2xl max-w-xl w-full p-6 shadow-xl relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECF0F1] border border-[#BDC3C7] flex items-center justify-center text-[#2C3E50]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2C3E50]">AI Leave Date Recommender</h3>
              <p className="text-xs text-[#7F8C8D]">Find the optimal time-off windows with maximum coverage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7F8C8D] hover:text-[#2C3E50] p-1.5 rounded-lg hover:bg-[#ECF0F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-[#2C3E50] font-medium">Desired days off:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={durationDays}
            onChange={(e) => setDurationDays(parseInt(e.target.value || '1', 10))}
            className="w-20 bg-white border border-[#BDC3C7] rounded-lg px-2.5 py-1.5 text-xs text-[#2C3E50] focus:outline-none focus:border-[#2C3E50]"
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#2C3E50] hover:bg-[#34495E] text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loading ? 'Analyzing...' : 'Find Best Dates'}
          </button>
        </div>

        {suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((opt) => (
              <div
                key={opt.option}
                className={`p-3.5 rounded-xl border transition-all ${
                  opt.recommended
                    ? 'border-[#2C3E50] bg-[#ECF0F1]/70'
                    : 'border-[#BDC3C7] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#2C3E50]">
                      Option {opt.option}: {opt.startDate} to {opt.endDate}
                    </span>
                    {opt.recommended && <Badge variant="success">Recommended</Badge>}
                  </div>
                  <button
                    onClick={() => {
                      onSelectOption(opt.startDate, opt.endDate, durationDays);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#2C3E50] hover:bg-[#34495E] text-white flex items-center gap-1 shadow-xs"
                  >
                    Select Dates
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#7F8C8D] mb-2">
                  <div>
                    Team Coverage: <span className="font-semibold text-[#2C3E50]">{opt.teamAvailability}%</span>
                  </div>
                  <div>
                    Project Conflict: <span className="font-semibold text-[#2C3E50]">{opt.projectConflict}</span>
                  </div>
                </div>
                <p className="text-xs text-[#34495E] italic">{opt.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#7F8C8D] border border-dashed border-[#BDC3C7] rounded-xl bg-[#ECF0F1]/40">
            Click "Find Best Dates" to evaluate sprint schedules and team availability.
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
