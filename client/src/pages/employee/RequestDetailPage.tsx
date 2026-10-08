import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Building,
  UserCheck,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Send,
  Star,
} from 'lucide-react';
import { api } from '../../api/client';
import { WorkplaceRequest } from '../../types';
import { RequestTimeline } from '../../components/requests/RequestTimeline';
import { EscalationModal } from '../../components/requests/EscalationModal';
import { FeedbackModal } from '../../components/requests/FeedbackModal';
import { getStatusBadge, getPriorityBadge, Badge } from '../../components/ui/Badge';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<WorkplaceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const fetchRequest = async () => {
    if (!id) return;
    try {
      const data = await api.getRequestById(id);
      setRequest(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;
    setSendingComment(true);
    try {
      await api.addComment(id, commentText);
      setCommentText('');
      fetchRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#7F8C8D]">Loading...</div>;
  }

  if (!request) {
    return (
      <div className="p-8 text-center text-xs text-[#7F8C8D]">
        Case not found or permission denied.
      </div>
    );
  }

  const isResolvedOrClosed = request.status === 'RESOLVED' || request.status === 'CLOSED';

  return (
    <div className="space-y-4">
      {/* Top back button */}
      <button
        onClick={() => navigate('/requests')}
        className="text-xs text-[#7F8C8D] hover:text-[#2C3E50] flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Requests
      </button>

      {/* Main Case Card */}
      <div className="card-3d rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#2C3E50] bg-[#ECF0F1] px-2 py-0.5 rounded border border-[#BDC3C7]">
              {request.case_number}
            </span>
            <span className="text-xs text-[#7F8C8D]">{request.category_code}</span>
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

        <h2 className="text-base font-bold text-[#2C3E50]">{request.title}</h2>

        <p className="text-xs text-[#34495E] bg-[#ECF0F1]/40 p-3 rounded-lg border border-[#BDC3C7]/60">
          {request.description}
        </p>

        {request.ai_summary && (
          <div className="p-2.5 rounded-lg bg-[#ECF0F1]/60 border border-[#BDC3C7] text-xs text-[#7F8C8D] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#2C3E50] flex-shrink-0" />
            <span>{request.ai_summary}</span>
          </div>
        )}

        {/* Facts Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#BDC3C7]/40 text-xs">
          <div className="p-2.5 rounded-lg bg-[#ECF0F1]/30 border border-[#BDC3C7]/60">
            <span className="text-[#7F8C8D] block text-[10px]">Team</span>
            <b className="text-[#2C3E50]">{request.team_name || 'Operations'}</b>
          </div>
          <div className="p-2.5 rounded-lg bg-[#ECF0F1]/30 border border-[#BDC3C7]/60">
            <span className="text-[#7F8C8D] block text-[10px]">Owner</span>
            <b className="text-[#2C3E50]">{request.assigned_user_name || 'Assigned'}</b>
          </div>
          <div className="p-2.5 rounded-lg bg-[#ECF0F1]/30 border border-[#BDC3C7]/60">
            <span className="text-[#7F8C8D] block text-[10px]">Response SLA</span>
            <b className="text-[#2C3E50]">{request.response_time_hours || 4}h window</b>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#BDC3C7]/40 text-xs">
          <span className="text-[#7F8C8D]">
            Submitted {new Date(request.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>

          <div className="flex items-center gap-2">
            {!isResolvedOrClosed && (
              <button
                onClick={() => setShowEscalateModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFF5DF] text-[#B86B00] border border-[#FDE3A7] hover:bg-[#FDE3A7] transition-colors flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Escalate
              </button>
            )}

            {isResolvedOrClosed && (
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E8F7F0] text-[#138A5B] border border-[#BCE7D3] hover:bg-[#BCE7D3] transition-colors flex items-center gap-1"
              >
                <Star className="w-3.5 h-3.5" />
                {request.feedback ? 'View Feedback' : 'Rate Resolution'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Timeline & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Request Timeline */}
        <div className="card-3d rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#BDC3C7]/40">
            <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2C3E50]" />
              Timeline
            </h3>
            <span className="text-[11px] text-[#7F8C8D]">Audit trail</span>
          </div>

          <RequestTimeline history={request.history || []} />
        </div>

        {/* Right: Comments Thread */}
        <div className="card-3d rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#BDC3C7]/40 mb-3">
              <h3 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#2C3E50]" />
                Messages
              </h3>
              <span className="text-[11px] text-[#7F8C8D]">
                {request.comments?.length || 0} note(s)
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(!request.comments || request.comments.length === 0) ? (
                <div className="p-6 text-center text-xs text-[#7F8C8D]">
                  No messages yet. Send a note below.
                </div>
              ) : (
                request.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg bg-[#ECF0F1]/50 border border-[#BDC3C7]/60 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[#7F8C8D] text-[11px]">
                      <span className="font-semibold text-[#2C3E50]">
                        {c.author_name} ({c.author_role})
                      </span>
                      <span>
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[#34495E]">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="pt-3 border-t border-[#BDC3C7]/40 flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Send update or info..."
              className="flex-1 bg-white border border-[#BDC3C7] rounded-lg px-2.5 py-1.5 text-xs text-[#2C3E50] placeholder:text-[#7F8C8D] focus:outline-none focus:border-[#2C3E50]"
            />
            <button
              type="submit"
              disabled={sendingComment || !commentText.trim()}
              className="px-3 py-1.5 bg-[#2C3E50] hover:bg-[#34495E] disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Send className="w-3 h-3" />
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Modals */}
      <EscalationModal
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        requestId={request.id}
        caseNumber={request.case_number}
        onSuccess={fetchRequest}
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        requestId={request.id}
        caseNumber={request.case_number}
        onSuccess={fetchRequest}
      />
    </div>
  );
};
