import { useState, useEffect } from "react";
import { License } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeAllLicenses,
  subscribeLicensesForAgent,
} from "@/services/licenseService";
import { deleteDocById } from "@/hooks/useFirestore";
import {
  LicenseList,
  LicenseForm,
  LicenseDashboard,
} from "@/components/licenses";

type ViewState = { type: "list" } | { type: "form"; license?: License };

export default function LicensesPage() {
  const { userProfile } = useAuth();
  const [view, setView] = useState<ViewState>({ type: "list" });
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) {return;}

    const isBroker = userProfile.role === "broker";
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setError(null);

    const unsub = isBroker
      ? subscribeAllLicenses(
          (items) => {
            setLicenses(items);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          },
        )
      : subscribeLicensesForAgent(
          userProfile.id,
          (items) => {
            setLicenses(items);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          },
        );

    return () => unsub();
  }, [userProfile]);

  const handleDelete = async (id: string) => {
    await deleteDocById("licenses", id);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger re-run by toggling a key or re-mounting effect
    // Since we can't easily force re-run, reload the page
    window.location.reload();
  };

  if (view.type === "form") {
    return (
      <div className="max-w-lg mx-auto">
        <LicenseForm
          license={view.license}
          onSaved={() => setView({ type: "list" })}
          onCancel={() => setView({ type: "list" })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">License Expiry Tracker</h1>
          <p className="text-muted-foreground">
            Track PRC licenses, broker accreditations, and BIR registrations
          </p>
        </div>
        <button
          onClick={() => setView({ type: "form" })}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Add License
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
          <button
            onClick={handleRetry}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <LicenseDashboard licenses={licenses} />

          <div>
            <h2 className="text-lg font-semibold mb-3">
              All Licenses ({licenses.length})
            </h2>
            {licenses.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                No licenses added yet. Click "+ Add License" to start tracking
                your licenses.
              </div>
            ) : (
              <LicenseList
                licenses={licenses}
                onEdit={(license) => setView({ type: "form", license })}
                onDelete={handleDelete}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
