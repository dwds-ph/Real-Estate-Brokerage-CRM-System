import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLeads, updateDocById } from '@/hooks/useFirestore';
import { Lead, LeadStatus } from '@/types';
import { formatCurrency, timeAgo, getScoreColor, cn } from '@/lib/utils';

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New', color: 'border-t-blue-500' },
  { status: 'contacted', label: 'Contacted', color: 'border-t-yellow-500' },
  { status: 'viewed', label: 'Viewed', color: 'border-t-purple-500' },
  { status: 'negotiating', label: 'Negotiating', color: 'border-t-orange-500' },
  { status: 'closed', label: 'Closed', color: 'border-t-green-500' },
  { status: 'lost', label: 'Lost', color: 'border-t-red-500' },
];

export default function DealsPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data: allLeads, loading } = useLeads(userProfile?.id);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const isBroker = userProfile?.role === 'broker';

  const handleDragStart = (leadId: string) => {
    setDraggingId(leadId);
  };

  const handleDrop = async (newStatus: LeadStatus) => {
    if (!draggingId) return;
    await updateDocById('leads', draggingId, {
      status: newStatus,
      activityTimeline: [
        ...((allLeads.find((l) => l.id === draggingId) as Lead)?.activityTimeline || []),
        { action: `Moved to ${newStatus}`, timestamp: Date.now(), by: userProfile?.displayName || 'Unknown' },
      ],
    });
    setDraggingId(null);
  };

  const getLeadsByStatus = (status: LeadStatus) =>
    allLeads.filter((l) => (l as Lead).status === status) as Lead[];

  if (loading) {
    return <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deal Pipeline</h1>
          <p className="text-muted-foreground">{allLeads.length} total leads across {COLUMNS.length} stages</p>
        </div>
        <button
          onClick={() => navigate('/leads')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Lead
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
        {COLUMNS.map((col) => {
          const columnLeads = getLeadsByStatus(col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.status)}
              className={cn(
                'rounded-lg border bg-card/50 min-h-[400px] flex flex-col',
                col.color,
                'border-t-2'
              )}
            >
              {/* Column Header */}
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize">{col.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {columnLeads.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground">Drop leads here</p>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className={cn(
                        'rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow',
                        draggingId === lead.id && 'opacity-50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium">{lead.name}</p>
                        <span className={cn('text-xs font-medium', getScoreColor(lead.score))}>
                          {lead.score === 'hot' ? '🔥' : lead.score === 'warm' ? '👋' : '❄️'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {lead.propertyInterest && (
                          <p className="text-xs text-muted-foreground truncate">🏠 {lead.propertyInterest}</p>
                        )}
                        {lead.budget && (
                          <p className="text-xs text-muted-foreground">💰 {formatCurrency(lead.budget)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">📋 {lead.source}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(lead.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Broker Overview */}
      {isBroker && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Broker Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            {COLUMNS.map((col) => {
              const count = getLeadsByStatus(col.status).length;
              return (
                <div key={col.status} className="space-y-1">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{col.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
