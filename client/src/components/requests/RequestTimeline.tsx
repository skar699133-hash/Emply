import React from 'react';
import { CheckCircle2, Clock, Sparkles, User, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { RequestStatusHistory } from '../../types';

interface RequestTimelineProps {
  history: RequestStatusHistory[];
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-500 text-center">
        No recorded status history yet.
      </div>
    );
  }

  const getActionIcon = (actionType: string, newStatus: string) => {
    if (newStatus === 'ESCALATED') {
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
    }
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (actionType?.includes('AI')) {
      return <Sparkles className="w-3.5 h-3.5 text-brand-600" />;
    }
    return <Clock className="w-3.5 h-3.5 text-sky-600" />;
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
      {history.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          {/* Node marker */}
          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-300 group-hover:border-brand-500 flex items-center justify-center transition-colors shadow-xs">
            {getActionIcon(item.action_type, item.new_status)}
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <span className="font-semibold text-slate-800">
                {item.previous_status ? `${item.previous_status} → ${item.new_status}` : item.new_status}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="text-slate-500 text-xs mb-1">
              Actor: <span className="text-slate-700 font-medium">{item.actor_name}</span>
            </div>

            {item.comment && (
              <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80 mt-1.5 italic shadow-xs">
                "{item.comment}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
