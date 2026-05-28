import { useAuth } from "@/context/AuthContext";
import {
  getLicenseTypeLabel,
  getLicenseStatusColor,
  getLicenseStatusLabel,
  getDaysUntilExpiry,
} from "@/services/licenseService";
import { License } from "@/types";
import { formatDate, cn } from "@/lib/utils";

interface LicenseListProps {
  licenses: License[];
  onEdit: (license: License) => void;
  onDelete: (id: string) => void;
}

export default function LicenseList({
  licenses,
  onEdit,
  onDelete,
}: LicenseListProps) {
  const { userProfile } = useAuth();
  const isBroker = userProfile?.role === "broker";

  if (licenses.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
        <p className="text-lg mb-1">No licenses tracked</p>
        <p className="text-sm">Add a license to start tracking renewals</p>
      </div>
    );
  }

  const sorted = [...licenses].sort(
    (a, b) => a.expiryDate - b.expiryDate,
  );

  return (
    <div className="space-y-2">
      {sorted.map((license) => {
        const daysLeft = getDaysUntilExpiry(license.expiryDate);
        return (
          <div
            key={license.id}
            className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {getLicenseTypeLabel(license.type)}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                      getLicenseStatusColor(license.status),
                    )}
                  >
                    {getLicenseStatusLabel(license.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  #{license.licenseNumber} · {license.issuingBody}
                </p>
                <p className="text-xs text-muted-foreground">
                  {license.agentName}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>
                    Issued:{" "}
                    <span className="text-foreground">
                      {formatDate(license.issueDate)}
                    </span>
                  </span>
                  <span>
                    Expires:{" "}
                    <span
                      className={cn("font-medium", {
                        "text-red-600": license.status === "expired",
                        "text-yellow-600":
                          license.status === "expiring-soon",
                        "text-green-600": license.status === "active",
                      })}
                    >
                      {formatDate(license.expiryDate)}
                    </span>
                  </span>
                  <span
                    className={cn({
                      "text-red-600": daysLeft < 0,
                      "text-yellow-600":
                        daysLeft >= 0 && daysLeft <= 30,
                      "text-green-600": daysLeft > 30,
                    })}
                  >
                    {daysLeft < 0
                      ? `Overdue by ${Math.abs(daysLeft)} days`
                      : `${daysLeft} days remaining`}
                  </span>
                </div>
                {license.notes && (
                  <p className="mt-1 text-xs text-muted-foreground italic">
                    📝 {license.notes}
                  </p>
                )}
              </div>
              {(isBroker || license.agentId === userProfile?.id) && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(license)}
                    className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      // eslint-disable-next-line no-alert
                      if (window.confirm("Delete this license entry?"))
                        {onDelete(license.id);}
                    }}
                    className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
