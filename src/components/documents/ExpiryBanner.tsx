import { VaultDocument } from "@/types";
import { formatDate } from "@/lib/utils";

export interface ExpiryBannerProps {
  expiringDocs: VaultDocument[];
  onDismiss?: () => void;
}

export function ExpiryBanner({ expiringDocs, onDismiss }: ExpiryBannerProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏰</span>
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Documents Expiring Soon
          </h3>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
          >
            ✕
          </button>
        )}
      </div>
      <ul className="mt-2 space-y-1">
        {expiringDocs.slice(0, 5).map((doc) => (
          <li
            key={doc.id}
            className="text-xs text-amber-700 dark:text-amber-300"
          >
            • <strong>{doc.name}</strong> — expires{" "}
            {formatDate(doc.expiryDate!)}
          </li>
        ))}
        {expiringDocs.length > 5 && (
          <li className="text-xs text-amber-700 dark:text-amber-300">
            • and {expiringDocs.length - 5} more...
          </li>
        )}
      </ul>
    </div>
  );
}
