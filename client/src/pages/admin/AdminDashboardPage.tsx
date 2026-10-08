import React, { useState, useEffect } from 'react';
import { Settings, Shield, Clock, Database, Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client';
import { Badge } from '../../components/ui/Badge';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'SLAS' | 'CATEGORIES'>('AUDIT');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [slas, setSlas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAuditLogs().catch(() => []),
      api.getCategories().catch(() => []),
      api.getSlas().catch(() => []),
    ]).then(([logs, cats, slaList]) => {
      setAuditLogs(logs);
      setCategories(cats);
      setSlas(slaList);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2C3E50]">
          System Administration & Governance
        </h1>
        <p className="text-xs sm:text-sm text-[#7F8C8D]">
          Organizational taxonomy, SLA matrix, non-tamperable audit ledger, and routing governance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 card-3d rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'AUDIT'
              ? 'bg-[#2C3E50] text-white shadow-xs'
              : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Audit Ledger ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('SLAS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'SLAS'
              ? 'bg-[#2C3E50] text-white shadow-xs'
              : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]'
          }`}
        >
          <Clock className="w-4 h-4" />
          Configured SLA Matrix ({slas.length})
        </button>

        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'CATEGORIES'
              ? 'bg-[#2C3E50] text-white shadow-xs'
              : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Taxonomy & Routing Rules ({categories.length})
        </button>
      </div>

      {/* Tab 1: Audit Ledger */}
      {activeTab === 'AUDIT' && (
        <div className="card-3d rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2C3E50] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2C3E50]" />
              Non-Tamperable Audit Trail (Consequential Decisions & Actions)
            </h3>
            <Badge variant="neutral">Immutable Audit Log</Badge>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[#ECF0F1]/50 border border-[#BDC3C7] text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-[#2C3E50]">
                      {log.action}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {log.entity_type}
                    </Badge>
                  </div>
                  <div className="text-[#7F8C8D] text-[11px]">
                    Actor: <strong className="text-[#2C3E50]">{log.actor_name}</strong> ({log.actor_role}) • Target ID: <span className="font-mono">{log.entity_id}</span>
                  </div>
                </div>

                <span className="text-[10px] text-[#7F8C8D] font-mono">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: SLA Matrix */}
      {activeTab === 'SLAS' && (
        <div className="card-3d rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#2C3E50] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2C3E50]" />
            Active Organizational Response & Escalation Thresholds
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {slas.slice(0, 15).map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl bg-[#ECF0F1]/50 border border-[#BDC3C7] text-xs space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C3E50]">{s.category_code}</span>
                  <Badge variant={s.priority === 'CRITICAL' ? 'danger' : s.priority === 'HIGH' ? 'warning' : 'blue'} size="sm">
                    {s.priority}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#7F8C8D] pt-1">
                  <div>First Response: <strong className="text-[#2C3E50]">{s.response_time_hours}h</strong></div>
                  <div>Resolution SLA: <strong className="text-[#2C3E50]">{s.resolution_time_hours}h</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Request Categories */}
      {activeTab === 'CATEGORIES' && (
        <div className="card-3d rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#2C3E50] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2C3E50]" />
            Configured Organizational Taxonomy & Default Routing
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-[#ECF0F1]/50 border border-[#BDC3C7] text-xs space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C3E50] font-mono text-xs">{c.code}</span>
                  {c.is_sensitive && <Badge variant="purple" size="sm">Sensitive</Badge>}
                </div>
                <div className="text-[#2C3E50] font-semibold">{c.name}</div>
                <p className="text-[11px] text-[#7F8C8D] line-clamp-1">{c.description}</p>
                <div className="pt-1.5 border-t border-[#BDC3C7] text-[10px] text-[#7F8C8D]">
                  Target: {c.team_name || 'Assigned Operations'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
