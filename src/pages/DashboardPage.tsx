import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { Lead, Listing, Viewing, Deal, TaskItem, Payout } from '@/types';
import { formatCurrency, timeAgo, getLeadStatusColor, cn } from '@/lib/utils';
import ActivityFeed from '@/components/automation/ActivityFeed';

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const { data: leads } = useCollection<Lead>('leads', []);
  const { data: listings } = useCollection<Listing>('listings', []);
  const { data: viewings } = useCollection<Viewing>('viewings', []);
  const { data: deals } = useCollection<Deal>('deals', []);
  const { data: tasks } = useCollection<TaskItem>('tasks', []);
  const { data: payouts } = useCollection<Payout>('payouts', []);

  const isBroker = userProfile?.role === 'broker';
  const myLeads = isBroker ? leads : leads.filter((l) => l.assignedTo === userProfile?.id);
  const myTasks = tasks.filter((t) => t.agentId === userProfile?.id && t.status === 'pending');
  const upcomingViewings = viewings
    .filter((v) => v.status === 'scheduled')
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 5);
  const closedDeals = deals.filter((d) => d.status === 'closed');
  const totalCommission = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  const leadsByStatus = ['new', 'contacted', 'viewed', 'negotiating', 'closed', 'lost'].map((status) => ({
    status,
    count: myLeads.filter((l) => l.status === status).length,
  }));

  const leadsBySource = ['facebook', 'manual', 'referral', 'walk-in'].map((source) => ({
    source,
    count: myLeads.filter((l) => l.source === source).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isBroker ? 'Broker Command Center' : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground">Welcome back, {userProfile?.displayName}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Leads</p>
          <p className="text-2xl font-bold">{myLeads.length}</p>
          <div className="mt-2 flex gap-1">
            {leadsByStatus.map((s) => (
              <div key={s.status} className="h-1.5 flex-1 rounded-full bg-muted" title={`${s.status}: ${s.count}`}>
                <div
                  className={cn('h-full rounded-full', {
                    'bg-blue-500': s.status === 'new', 'bg-yellow-500': s.status === 'contacted',
                    'bg-purple-500': s.status === 'viewed', 'bg-orange-500': s.status === 'negotiating',
                    'bg-green-500': s.status === 'closed', 'bg-red-500': s.status === 'lost',
                  })}
                  style={{ width: `${myLeads.length > 0 ? (s.count / myLeads.length) * 100 : 0}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Listings</p>
          <p className="text-2xl font-bold">{listings.filter((l) => l.status === 'available').length}</p>
          <p className="text-xs text-muted-foreground mt-1">{listings.length} total</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Upcoming Viewings</p>
          <p className="text-2xl font-bold">{upcomingViewings.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{viewings.length} total</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Commission Earned</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCommission)}</p>
          <p className="text-xs text-muted-foreground mt-1">{closedDeals.length} closed deals</p>
        </div>
      </div>

      {isBroker && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Agents</p>
            <p className="text-2xl font-bold">{leads.filter((l) => l.assignedTo).length > 0 ? new Set(leads.map((l) => l.assignedTo)).size : 0}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Commission Forecast</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(deals.filter((d) => d.status === 'pending').reduce((s, d) => s + (d.dealPrice * 0.03), 0))}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Pipeline Status</h2>
          <div className="space-y-3">
            {leadsByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className="w-24 text-xs capitalize text-muted-foreground">{s.status}</span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', {
                      'bg-blue-500': s.status === 'new', 'bg-yellow-500': s.status === 'contacted',
                      'bg-purple-500': s.status === 'viewed', 'bg-orange-500': s.status === 'negotiating',
                      'bg-green-500': s.status === 'closed', 'bg-red-500': s.status === 'lost',
                    })}
                    style={{ width: `${myLeads.length > 0 ? (s.count / myLeads.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Lead Sources</h2>
          <div className="space-y-3">
            {leadsBySource.map((s) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="w-24 text-xs capitalize text-muted-foreground">
                  {s.source === 'facebook' ? '📘' : s.source === 'manual' ? '✍️' : s.source === 'referral' ? '🤝' : '🚶'} {s.source}
                </span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${myLeads.length > 0 ? (s.count / myLeads.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Viewings + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">📅 Upcoming Viewings</h2>
          {upcomingViewings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming viewings</p>
          ) : (
            <div className="space-y-2">
              {upcomingViewings.map((v) => (
                <div key={v.id} className="rounded-lg bg-muted p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{new Date(v.scheduledAt).toLocaleDateString()}</span>
                    <span className="text-muted-foreground">{new Date(v.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Listing: {v.listingId}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">✅ Pending Tasks</h2>
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending tasks</p>
          ) : (
            <div className="space-y-2">
              {myTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="rounded-lg bg-muted p-3 text-sm flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', {
                    'bg-red-500': t.priority === 'high',
                    'bg-yellow-500': t.priority === 'medium',
                    'bg-green-500': t.priority === 'low',
                  })} />
                  <span>{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Leads</h2>
        {myLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads yet</p>
        ) : (
          <div className="space-y-2">
            {[...myLeads].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.source} • {timeAgo(lead.createdAt)}</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getLeadStatusColor(lead.status))}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg border bg-card p-6">
        <ActivityFeed compact />
      </div>

      {/* Broker-specific: Leaderboard */}
      {isBroker && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">🏆 Agent Leaderboard</h2>
          <p className="text-sm text-muted-foreground">Coming soon — sortable by leads, closings, and commissions</p>
        </div>
      )}
    </div>
  );
}
