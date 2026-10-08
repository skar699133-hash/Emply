import React, { useState, useEffect } from 'react';
import { Search, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../../api/client';
import { CompanyPolicy } from '../../types';
import { Badge } from '../../components/ui/Badge';

export const PolicySearchPage: React.FC = () => {
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [search, setSearch] = useState('');
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<any | null>(null);
  const [asking, setAsking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPolicies()
      .then((data) => setPolicies(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAskPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    try {
      const res = await api.askPolicyQA(question);
      setAiAnswer(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAsking(false);
    }
  };

  const filteredPolicies = policies.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.summary.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Ask Question Bar */}
      <div className="card-3d rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C3E50]">
          <Sparkles className="w-4 h-4 text-[#2C3E50]" />
          <span>Ask Policy AI</span>
        </div>

        <form onSubmit={handleAskPolicy} className="flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Can I request higher review if leave is rejected twice?"
            className="flex-1 bg-white border border-[#BDC3C7] rounded-lg px-3 py-2 text-xs text-[#2C3E50] placeholder:text-[#7F8C8D] focus:outline-none focus:border-[#2C3E50]"
          />
          <button
            type="submit"
            disabled={asking || !question.trim()}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#2C3E50] hover:bg-[#34495E] disabled:opacity-50 transition-colors"
          >
            {asking ? 'Searching...' : 'Ask AI'}
          </button>
        </form>

        {aiAnswer && (
          <div className="bg-[#ECF0F1]/50 border border-[#BDC3C7] rounded-lg p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2C3E50]">"{aiAnswer.question}"</span>
              <Badge variant={aiAnswer.foundInPolicy ? 'success' : 'warning'} size="sm">
                {aiAnswer.foundInPolicy ? 'Verified' : 'General'}
              </Badge>
            </div>
            <p className="text-[#34495E] leading-relaxed">{aiAnswer.answer}</p>
          </div>
        )}
      </div>

      {/* Policy Search & List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
            Directory ({filteredPolicies.length})
          </h3>
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-[#7F8C8D] absolute left-2.5 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies..."
              className="w-full bg-white border border-[#BDC3C7] rounded-lg pl-8 pr-2.5 py-1 text-xs text-[#2C3E50] placeholder:text-[#7F8C8D] focus:outline-none focus:border-[#2C3E50]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredPolicies.map((pol) => (
            <div
              key={pol.id}
              className="card-3d-hover rounded-xl p-4 space-y-2 cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] font-bold text-[#2C3E50] bg-[#ECF0F1] px-2 py-0.5 rounded border border-[#BDC3C7]">
                  {pol.code}
                </span>
                <span className="text-[#7F8C8D] text-[11px]">{pol.category}</span>
              </div>

              <h4 className="text-xs font-bold text-[#2C3E50]">{pol.title}</h4>
              <p className="text-xs text-[#7F8C8D] line-clamp-2">{pol.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
