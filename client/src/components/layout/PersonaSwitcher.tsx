import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const PersonaSwitcher: React.FC = () => {
  const { user, switchUser } = useAuth();

  const personas = [
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@nexora.internal',
      role: 'EMPLOYEE',
      title: 'Senior Software Engineer (Employee)',
      badge: 'Employee',
    },
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@nexora.internal',
      role: 'MANAGER',
      title: 'Engineering Manager (Alex\'s Manager)',
      badge: 'Manager',
    },
    {
      name: 'David Vance',
      email: 'david.vance@nexora.internal',
      role: 'SKIP_LEVEL_MANAGER',
      title: 'VP of Engineering (Higher Review Authority)',
      badge: 'Skip-Level VP',
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@nexora.internal',
      role: 'HR_DIRECTOR',
      title: 'Director of People (Confidential Cases & HR)',
      badge: 'HR Director',
    },
    {
      name: 'Marcus Wright',
      email: 'marcus.wright@nexora.internal',
      role: 'ADMIN',
      title: 'Platform Architect & Admin',
      badge: 'Admin',
    },
  ];

  return (
    <div className="bg-[#2C3E50] border-b border-[#34495E] px-4 py-1.5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#ECF0F1]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Live Persona Switcher:</span>
          <span className="text-[#BDC3C7] hidden md:inline">Test multi-tier approvals, reconsiderations, and confidential flows</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {personas.map((p) => {
            const isActive = user?.email.toLowerCase() === p.email.toLowerCase();
            return (
              <button
                key={p.email}
                onClick={() => switchUser(p.email)}
                title={p.title}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-xs border ${
                  isActive
                    ? 'bg-white text-[#2C3E50] border-[#BDC3C7] shadow-xs font-semibold'
                    : 'border-transparent text-[#ECF0F1] hover:text-white hover:bg-[#34495E]'
                }`}
              >
                <span>{p.name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${isActive ? 'bg-[#ECF0F1] text-[#2C3E50] font-medium' : 'bg-[#34495E] text-[#BDC3C7]'}`}>
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
