import { formatFileSize } from "@/services/documentVault";

// ─── Types ──────────────────────────────────────────────────────────

export type UploadStatus = "uploading" | "processing" | "done" | "error";

export interface UploadProgressProps {
  progress: number; // 0–100
  bytesTransferred: number;
  totalBytes: number;
  status: UploadStatus;
}

// ─── UploadProgress Component ───────────────────────────────────────

export function UploadProgress({
  progress,
  bytesTransferred,
  totalBytes,
  status,
}: UploadProgressProps) {
  const statusLabel =
    status === "processing" ? "Processing..." : `Uploading... ${progress}%`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{statusLabel}</span>
        <span>
          {formatFileSize(bytesTransferred)} / {formatFileSize(totalBytes)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
