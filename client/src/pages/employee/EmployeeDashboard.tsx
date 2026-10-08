import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { ConsentModal } from '../../components/ai/ConsentModal';
import { EmergencyModal } from '../../components/ai/EmergencyModal';
import { LeaveApplicationModal } from '../../components/leave/LeaveApplicationModal';
import { OptimalDateSuggestionsModal } from '../../components/leave/OptimalDateSuggestionsModal';
import { Badge } from '../../components/ui/Badge';
import { PlaceholdersAndVanishInput } from '../../components/ui/placeholders-and-vanish-input';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiData, setAiData] = useState<any | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDateSuggestionsModal, setShowDateSuggestionsModal] = useState(false);
  const [creatingCase, setCreatingCase] = useState(false);

  const handleAskAI = async (inputQuery?: string) => {
    const textToAnalyze = inputQuery || query;
    if (!textToAnalyze.trim()) return;

    if (textToAnalyze.toLowerCase().includes('best time') || textToAnalyze.toLowerCase().includes('optimal')) {
      setShowDateSuggestionsModal(true);
      return;
    }

    setAnalyzing(true);
    try {
      const res = await api.askAI(textToAnalyze);
      setAiData(res);

      if (res.isEmergency) {
        setShowEmergencyModal(true);
      } else {
        setShowConsentModal(true);
      }
    } catch (err) {
      console.error('AI assistant error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmSubmission = async () => {
    if (!aiData) return;
    setCreatingCase(true);
    try {
      const { summary, classification, routing, priority } = aiData;
      const res = await api.createRequest({
        title: summary.issue,
        description: query || summary.issue,
        categoryCode: classification.category,
        priority: priority.priority,
        severity: priority.severity,
        sensitivity: priority.sensitivity,
        impactLevel: classification.impact,
        departmentId: routing.departmentId,
        teamId: routing.teamId,
        assignedUserId: routing.assignedUserId,
        slaId: priority.slaId,
        dueAt: priority.dueAt,
        aiSummary: classification.explanation,
        aiRecommendation: routing.reason,
        confidential: routing.confidential,
        requiresImmediateEscalation: classification.requiresImmediateEscalation,
        teamName: routing.teamName,
      });

      setShowConsentModal(false);
      setShowEmergencyModal(false);
      setQuery('');
      navigate(`/requests/${res.id}`);
    } catch (err) {
      console.error('Case creation failed:', err);
    } finally {
      setCreatingCase(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Centered Hero Box */}
      <div className="card-3d rounded-2xl p-7 sm:p-9 text-center space-y-5">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#2C3E50] tracking-tight mb-1.5">
            How can we help you today?
          </h2>
          <p className="text-xs sm:text-sm text-[#7F8C8D]">
            Tell us what happened. You don't need to know which department handles it.
          </p>
        </div>

        {/* Aceternity UI Placeholders And Vanish Input */}
        <div className="w-full flex justify-center pt-1">
          <PlaceholdersAndVanishInput
            className="max-w-md sm:max-w-lg h-14"
            placeholders={[
              "e.g. I need leave next Friday, or my salary is incorrect...",
              "My September salary credit was calculated incorrectly...",
              "Need to report a confidential grievance regarding my manager...",
              "What is the company policy on remote work and hardware stipends?",
              "When is the optimal time to take 4 days vacation this quarter?",
              "Request an ergonomic chair and dual monitor workstation...",
            ]}
            onChange={(e) => setQuery(e.target.value)}
            onSubmit={() => {
              if (query.trim()) {
                handleAskAI(query);
              }
            }}
          />
        </div>
      </div>

      {/* 3 Simple Metric Cards with Subtle 3D Elevation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => navigate('/requests')}
          className="card-3d-hover rounded-xl p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7F8C8D]">Open requests</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#BDC3C7] group-hover:text-[#2C3E50] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-bold text-[#2C3E50] mt-1.5">2</div>
          <div className="mt-2.5">
            <Badge variant="blue" size="sm">1 in progress</Badge>
          </div>
        </div>

        <div
          onClick={() => navigate('/leave')}
          className="card-3d-hover rounded-xl p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7F8C8D]">Leave balance</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#BDC3C7] group-hover:text-[#2C3E50] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-bold text-[#2C3E50] mt-1.5">6 days</div>
          <div className="mt-2.5">
            <Badge variant="success" size="sm">Available</Badge>
          </div>
        </div>

        <div
          onClick={() => navigate('/leave/lev-2041')}
          className="card-3d-hover rounded-xl p-5 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7F8C8D]">Pending action</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#BDC3C7] group-hover:text-[#2C3E50] group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-bold text-[#2C3E50] mt-1.5">1</div>
          <div className="mt-2.5">
            <Badge variant="warning" size="sm">Higher review ready</Badge>
          </div>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="card-3d rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#2C3E50]">Recent requests</h3>
          <button
            onClick={() => navigate('/requests')}
            className="text-xs text-[#7F8C8D] hover:text-[#2C3E50] font-semibold transition-colors flex items-center gap-1 group"
          >
            <span>View all</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>

        <div className="space-y-2.5">
          <div
            onClick={() => navigate('/leave/lev-2041')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#BDC3C7] shadow-[0_1px_3px_rgba(44,62,80,0.04),0_3px_8px_-1px_rgba(44,62,80,0.06)] hover:border-[#7F8C8D] hover:shadow-[0_4px_14px_-2px_rgba(44,62,80,0.1)] hover:-translate-y-0.5 cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-bold text-[#2C3E50]">Personal Emergency Leave</div>
              <div className="text-[11px] text-[#7F8C8D] mt-0.5">LEV-2041 · Oct 14–16 · Leave</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="danger">Higher review available</Badge>
              <ArrowRight className="w-3.5 h-3.5 text-[#7F8C8D]" />
            </div>
          </div>

          <div
            onClick={() => navigate('/requests/req-1042')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#BDC3C7] shadow-[0_1px_3px_rgba(44,62,80,0.04),0_3px_8px_-1px_rgba(44,62,80,0.06)] hover:border-[#7F8C8D] hover:shadow-[0_4px_14px_-2px_rgba(44,62,80,0.1)] hover:-translate-y-0.5 cursor-pointer transition-all"
          >
            <div>
              <div className="text-xs font-bold text-[#2C3E50]">September Salary Discrepancy</div>
              <div className="text-[11px] text-[#7F8C8D] mt-0.5">CAS-1042 · IT & Payroll Operations</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="blue">In progress</Badge>
              <ArrowRight className="w-3.5 h-3.5 text-[#7F8C8D]" />
            </div>
          </div>
        </div>

        <div className="pt-3.5 border-t border-[#BDC3C7]/60 flex items-center gap-3">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2C3E50] hover:bg-[#34495E] text-white shadow-[0_2px_6px_rgba(44,62,80,0.15)] hover:shadow-[0_4px_12px_rgba(44,62,80,0.22)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Apply for Leave
          </button>
          <button
            onClick={() => setShowDateSuggestionsModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#BDC3C7] text-[#2C3E50] hover:bg-[#ECF0F1] shadow-[0_1px_3px_rgba(44,62,80,0.05)] hover:shadow-[0_3px_8px_rgba(44,62,80,0.09)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2C3E50]" />
            Optimal Leave Dates
          </button>
        </div>
      </div>

      {/* AI Modals */}
      <ConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirm={handleConfirmSubmission}
        loading={creatingCase}
        aiData={aiData}
      />

      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        onConfirmDispatch={handleConfirmSubmission}
        loading={creatingCase}
        userInput={query}
      />

      <LeaveApplicationModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onSuccess={(id) => navigate(`/leave/${id}`)}
      />

      <OptimalDateSuggestionsModal
        isOpen={showDateSuggestionsModal}
        onClose={() => setShowDateSuggestionsModal(false)}
        onSelectOption={(start, end, duration) => {
          setShowLeaveModal(true);
        }}
      />
    </div>
  );
};
