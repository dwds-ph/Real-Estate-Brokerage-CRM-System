import { useState } from "react";
import { VaultDocument } from "@/types";
import { getCategoryInfo, formatFileSize } from "@/services/documentVault";
import { formatDate, formatDateTime, cn } from "@/lib/utils";

export interface DocumentDetailProps {
  document: VaultDocument | null;
  versionHistory: Record<string, unknown>[];
  versionLoading: boolean;
  onClose: () => void;
  onDelete: (doc: VaultDocument) => void;
}

export function DocumentDetail({
  document: selectedDoc,
  versionHistory,
  versionLoading,
  onClose,
}: DocumentDetailProps) {
  const [now] = useState(() => Date.now());

  if (!selectedDoc) {return null;}

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Document Details</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{selectedDoc.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Category</p>
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                getCategoryInfo(selectedDoc.category).color,
              )}
            >
              {getCategoryInfo(selectedDoc.category).label}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">File Size</p>
            <p>{formatFileSize(selectedDoc.fileSize)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Uploaded</p>
            <p>{formatDateTime(selectedDoc.uploadedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Version</p>
            <p>v{selectedDoc.version}</p>
          </div>
          {selectedDoc.stage && (
            <div>
              <p className="text-xs text-muted-foreground">Stage</p>
              <p className="capitalize">{selectedDoc.stage}</p>
            </div>
          )}
          {selectedDoc.dealId && (
            <div>
              <p className="text-xs text-muted-foreground">Deal</p>
              <p className="font-mono text-xs">{selectedDoc.dealId}</p>
            </div>
          )}
          {selectedDoc.listingId && (
            <div>
              <p className="text-xs text-muted-foreground">Listing</p>
              <p className="font-mono text-xs">{selectedDoc.listingId}</p>
            </div>
          )}
          {selectedDoc.expiryDate && (
            <div>
              <p className="text-xs text-muted-foreground">Expires</p>
              <p
                className={cn(
                  selectedDoc.expiryDate <= now && "text-red-500 font-medium",
                )}
              >
                {formatDate(selectedDoc.expiryDate)}
              </p>
            </div>
          )}
          {selectedDoc.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-muted-foreground">{selectedDoc.notes}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <a
            href={selectedDoc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            📖 View
          </a>
          <a
            href={selectedDoc.fileUrl}
            download={selectedDoc.name}
            className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium hover:bg-muted"
          >
            ⬇️ Download
          </a>
        </div>
      </div>

      {/* Version History */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Version History</h3>
        {versionLoading ? (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : versionHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {selectedDoc.version === 1
              ? "No previous versions — this is the original."
              : "No version history available."}
          </p>
        ) : (
          <div className="space-y-2">
            {versionHistory.map((v) => {
              const ver = v as Record<string, unknown>;
              return (
                <div
                  key={String(ver.id)}
                  className="rounded-lg bg-muted p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">v{String(ver.version)}</span>
                    <span className="text-muted-foreground">
                      {formatDate(Number(ver.uploadedAt))}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{String(ver.name)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
