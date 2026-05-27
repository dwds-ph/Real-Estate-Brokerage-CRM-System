import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Referral, Deal } from '@/types';
import { fetchReferrals, updateReferral } from '@/services/referralService';
import { useCollection } from '@/hooks/useFirestore';
import { formatCurrency } from '@/lib/utils';

const getTimestamp = () => Date.now();

export default function ReferralDashboard() {
  const { userProfile } = useAuth();
  const { data: allDeals } = useCollection<Deal>('deals');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReferrals();
      setReferrals(data);
    } catch (err) {
      setError('Failed to load referrals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => loadReferrals(), 0);
  }, [loadReferrals]);

  const totalPending = referrals.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.referralFee, 0);
  const totalPaid = referrals.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.referralFee, 0);

  const handleMarkPaid = async (id: string) => {
    try {
      await updateReferral(id, { status: 'paid', paidAt: getTimestamp() });
      await loadReferrals();
    } catch (err) {
      console.error(err);
    }
  };

  const getDealName = (dealId: string): string => {
    const deal = allDeals.find((d) => d.id === dealId);
    return deal ? deal.clientName : 'Unknown Deal';
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Referral Dashboard</h2>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Pending Fees</p>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(totalPending)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Paid Fees</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">No referrals yet.</div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {referrals.map((ref) => (
            <div key={ref.id} className="flex items-start justify-between rounded-lg border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{ref.referrerName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {ref.referrerContact && `${ref.referrerContact} · `}
                  Deal: {getDealName(ref.dealId)}
                </p>
                <p className="text-xs text-muted-foreground">{formatCurrency(ref.referralFee)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    ref.status === 'paid'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {ref.status}
                </span>
                {ref.status === 'pending' && userProfile?.role === 'broker' && (
                  <button
                    onClick={() => handleMarkPaid(ref.id)}
                    className="rounded px-2 py-0.5 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Pay
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
