import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShieldAlert, ArrowRight, UserCheck, Building } from 'lucide-react';
import { WorkplaceRequest } from '../../types';
import { getPriorityBadge, getStatusBadge, Badge } from '../ui/Badge';

interface RequestCardProps {
  request: WorkplaceRequest;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  return (
    <Link
      to={`/requests/${request.id}`}
      className="block card-3d-hover rounded-xl p-5 group"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#2C3E50] bg-[#ECF0F1] px-2 py-0.5 rounded border border-[#BDC3C7]">
            {request.case_number}
          </span>
          <span className="text-xs text-[#7F8C8D] font-medium">
            {request.category_code}
          </span>
          {request.confidential && (
            <Badge variant="purple" size="sm">
              <ShieldAlert className="w-3 h-3" />
              Confidential
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {getPriorityBadge(request.priority)}
          {getStatusBadge(request.status)}
        </div>
      </div>

      <h3 className="text-sm font-bold text-[#2C3E50] mb-1.5 group-hover:text-[#34495E] transition-colors">
        {request.title}
      </h3>

      <p className="text-xs text-[#7F8C8D] line-clamp-2 mb-3">
        {request.description}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#BDC3C7]/60 text-xs text-[#7F8C8D]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            {request.team_name || 'Assigned Operations'}
          </span>
          {request.assigned_user_name && (
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              {request.assigned_user_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {new Date(request.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
};
