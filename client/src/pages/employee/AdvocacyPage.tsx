import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Scale, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';
import { Badge } from '../../components/ui/Badge';

export const AdvocacyPage: React.FC = () => {
  const [concernText, setConcernText] = useState(
    'My manager rejected my leave, but another employee was allowed to take leave on the same dates.'
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [advocacyResult, setAdvocacyResult] = useState<any | null>(null);

  const handleRunAdvocacyCheck = async () => {
    if (!concernText.trim()) return;
    setAnalyzing(true);
    try {
      const res = await api.getAdvocacy({
        concernText,
        leaveRequestId: 'lev-2041',
      });
      setAdvocacyResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 3 Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card-3d-hover rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2C3E50]">
            <ShieldCheck className="w-4 h-4 text-[#2C3E50]" />
            <span>Zero Retaliation</span>
          </div>
          <p className="text-[11px] text-[#7F8C8D]">
            Strict protection for good-faith inquiries and reviews.
          </p>
        </div>

        <div className="card-3d-hover rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2C3E50]">
            <ShieldAlert className="w-4 h-4 text-[#2C3E50]" />
            <span>Confidential Support</span>
          </div>
          <p className="text-[11px] text-[#7F8C8D]">
            Sensitive concerns route directly to HR channels.
          </p>
        </div>

        <div className="card-3d-hover rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2C3E50]">
            <Scale className="w-4 h-4 text-[#2C3E50]" />
            <span>Objective Fairness</span>
          </div>
          <p className="text-[11px] text-[#7F8C8D]">
            Evidence-based consistency and policy verification.
          </p>
        </div>
      </div>

      {/* Interactive Evaluation Box */}
      <div className="card-3d rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C3E50]">
          <Sparkles className="w-4 h-4 text-[#2C3E50]" />
          <span>Fairness & Consistency Evaluation</span>
        </div>
        <p className="text-[11px] text-[#7F8C8D]">
          Describe what occurred. AI checks corporate benchmarks and policy alignment.
        </p>

        <textarea
          rows={3}
          value={concernText}
          onChange={(e) => setConcernText(e.target.value)}
          placeholder="Describe the issue..."
          className="w-full bg-white border border-[#BDC3C7] rounded-lg p-2.5 text-xs text-[#2C3E50] focus:outline-none focus:border-[#2C3E50] placeholder:text-[#7F8C8D]"
        />

        <div className="flex justify-end">
          <button
            onClick={handleRunAdvocacyCheck}
            disabled={analyzing}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#2C3E50] hover:bg-[#34495E] transition-all flex items-center gap-1.5"
          >
            {analyzing ? 'Evaluating...' : 'Evaluate Concern'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {advocacyResult && (
          <div className="mt-4 bg-[#ECF0F1]/50 border border-[#BDC3C7] rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#BDC3C7]/40 pb-2">
              <span className="font-bold text-[#2C3E50]">Evaluation Findings</span>
              <Badge variant="blue" size="sm">Advocacy Engine</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-white rounded-lg border border-[#BDC3C7] space-y-1">
                <span className="font-bold text-[#138A5B] block text-[10px] uppercase">
                  Verified Facts
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[#2C3E50] text-[11px]">
                  {advocacyResult.verifiedFacts?.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-[#BDC3C7] space-y-1">
                <span className="font-bold text-[#B86B00] block text-[10px] uppercase">
                  Pattern
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[#2C3E50] text-[11px]">
                  {advocacyResult.possiblePatterns?.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-[#BDC3C7] space-y-1">
                <span className="font-bold text-[#2C3E50] block text-[10px] uppercase">
                  Next Step
                </span>
                <p className="text-[#34495E] text-[11px]">{advocacyResult.aiRecommendation}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#BDC3C7]/40 flex items-center justify-between">
              <span className="text-[11px] text-[#7F8C8D] italic">{advocacyResult.explanation}</span>
              <button
                onClick={() => alert('HR Fairness request submitted.')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2C3E50] text-white hover:bg-[#34495E]"
              >
                Submit HR Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
