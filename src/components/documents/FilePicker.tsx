import { useRef } from "react";
import { formatFileSize } from "@/services/documentVault";

// ─── Types ──────────────────────────────────────────────────────────

export interface FilePickerProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  file: File | null;
}

// ─── FilePicker Component ───────────────────────────────────────────

export function FilePicker({ onFileSelect, accept, maxSize, file }: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (maxSize && selected.size > maxSize) {
        // Max size exceeded - parent can handle the error
        return;
      }
      onFileSelect(selected);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">File *</label>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary-foreground"
        accept={accept}
        required
      />
      {file && (
        <p className="mt-1 text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      )}
    </div>
  );
}
