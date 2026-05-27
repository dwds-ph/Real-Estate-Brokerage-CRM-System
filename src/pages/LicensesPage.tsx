import { useState, useEffect } from "react";
import { License } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { subscribeAllLicenses, subscribeLicensesForAgent } from "@/services/licenseService";
import { deleteDocById } from "@/hooks/useFirestore";
import { LicenseList, LicenseForm, LicenseDashboard } from "@/components/licenses";

type ViewState =
  | { type: "list" }
  | { type: "form"; license?: License };

export default function LicensesPage() {
  const { userProfile } = useAuth();
  const [view, setView] = useState<ViewState>({ type: "list" });
  const [licenses, setLicenses] = useState<License[]>([]);

  useEffect(() => {
    if (!userProfile) return;

    const isBroker = userProfile.role === "broker";
    const unsub = isBroker
      ? subscribeAllLicenses(setLicenses)
      : subscribeLicensesForAgent(userProfile.id, setLicenses);

    return () => unsub();
  }, [userProfile]);

  const handleDelete = async (id: string) => {
    await deleteDocById("licenses", id);
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

      <LicenseDashboard licenses={licenses} />

      <div>
        <h2 className="text-lg font-semibold mb-3">
          All Licenses ({licenses.length})
        </h2>
        <LicenseList
          licenses={licenses}
          onEdit={(license) => setView({ type: "form", license })}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
