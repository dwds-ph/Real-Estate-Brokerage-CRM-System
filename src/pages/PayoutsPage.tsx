import { useAuth } from "@/context/AuthContext";
import PayoutDashboard from "@/components/payouts/PayoutDashboard";

export default function PayoutsPage() {
  const { userProfile } = useAuth();
  const brokerId = userProfile?.brokerId || userProfile?.id || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="text-sm text-muted-foreground">
          Manage commission payouts — approve, mark paid, and track payment
          history
        </p>
      </div>
      <PayoutDashboard brokerId={brokerId} />
    </div>
  );
}
