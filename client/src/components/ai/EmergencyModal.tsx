import React from 'react';
import { createPortal } from 'react-dom';
import { AlertOctagon, PhoneCall, ShieldAlert, X } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDispatch: () => void;
  loading: boolean;
  userInput: string;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  onConfirmDispatch,
  loading,
  userInput,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in m-0">
      <div className="bg-white border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Urgent header accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500 animate-pulse" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-rose-700 tracking-wide uppercase">
                Critical Safety Alert Detected
              </h3>
              <p className="text-xs text-rose-600/80">Immediate physical hazard protocol activated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs space-y-3 mb-4">
          <p className="text-rose-900 font-semibold text-sm">
            "{userInput}"
          </p>
          <div className="p-3 bg-white rounded-lg text-slate-700 space-y-1.5 border border-rose-200 shadow-xs">
            <div className="font-bold text-amber-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Safety Instructions:
            </div>
            <p>1. Please evacuate the immediate area if smoke, heat, or exposed sparks are present.</p>
            <p>2. Do not attempt to operate electrical breakers yourself.</p>
            <p>3. If immediate danger exists, call building security at <strong>Ext: 911 / (415) 555-0911</strong>.</p>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
          <span className="text-slate-500">Target Dispatched:</span>
          <span className="font-semibold text-slate-900">Workplace Safety & Security Team (1h SLA)</span>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmDispatch}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            {loading ? 'Dispatching...' : 'Dispatch Immediate Incident'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
