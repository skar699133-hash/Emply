import React, { useState, useEffect } from 'react';
import { Plus, Search, Inbox } from 'lucide-react';
import { api } from '../../api/client';
import { WorkplaceRequest } from '../../types';
import { RequestCard } from '../../components/requests/RequestCard';
import { useNavigate } from 'react-router-dom';

export const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<WorkplaceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && ['NEW', 'IN_PROGRESS', 'ASSIGNED', 'WAITING_FOR_TEAM', 'WAITING_FOR_EMPLOYEE'].includes(r.status)) ||
      (statusFilter === 'ESCALATED' && r.status === 'ESCALATED') ||
      (statusFilter === 'RESOLVED' && ['RESOLVED', 'CLOSED'].includes(r.status));

    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.case_number.toLowerCase().includes(search.toLowerCase()) ||
      r.category_code.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#2C3E50]">All Requests</h2>
          <p className="text-xs text-[#7F8C8D]">Track status and responses.</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2C3E50] hover:bg-[#34495E] transition-all flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Request</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 card-3d rounded-xl">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'In Progress' },
            { id: 'ESCALATED', label: 'Escalated' },
            { id: 'RESOLVED', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#2C3E50] text-white font-semibold'
                  : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-[#7F8C8D] absolute left-2.5 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-[#ECF0F1] border border-[#BDC3C7] rounded-lg pl-8 pr-2.5 py-1 text-xs text-[#2C3E50] placeholder:text-[#7F8C8D] focus:outline-none focus:border-[#2C3E50]"
          />
        </div>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-[#7F8C8D]">
          Loading...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 text-center card-3d rounded-xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#ECF0F1] flex items-center justify-center text-[#7F8C8D] mx-auto border border-[#BDC3C7]">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-[#2C3E50]">No requests found</h3>
          <p className="text-xs text-[#7F8C8D] max-w-sm mx-auto">
            Use the Ask AI assistant on Home to start a new inquiry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRequests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
};
