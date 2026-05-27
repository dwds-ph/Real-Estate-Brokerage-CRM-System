import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { uploadVaultFile, createVaultDocument, UploadProgress as UploadProgressType } from "@/services/documentVault";
import { DocumentCategory } from "@/types";
import { FilePicker } from "./FilePicker";
import { DocumentMetadataForm, DocumentFormData } from "./DocumentMetadataForm";
import { UploadProgress } from "./UploadProgress";

interface DocumentUploadProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefillDealId?: string;
  prefillListingId?: string;
  prefillStage?: string;
}

export default function DocumentUpload({
  open, onClose, onSuccess, prefillDealId, prefillListingId, prefillStage,
}: DocumentUploadProps) {
  const { userProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<DocumentFormData>({
    name: "", category: "miscellaneous" as DocumentCategory,
    dealId: prefillDealId || "", listingId: prefillListingId || "",
    stage: prefillStage || "", expiryDate: "", notes: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setFile(null);
      setForm({ name: "", category: "miscellaneous" as DocumentCategory, dealId: prefillDealId || "", listingId: prefillListingId || "", stage: prefillStage || "", expiryDate: "", notes: "" });
      setUploading(false);
      setUploadProgress(null);
      setError(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [open, prefillDealId, prefillListingId, prefillStage]);

  const handleFileSelect = (selected: File) => {
    setFile(selected);
    if (!form.name) setForm((prev) => ({ ...prev, name: selected.name.replace(/\.[^/.]+$/, "") }));
  };

  const handleFormChange = (field: keyof DocumentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userProfile) return;
    setError(null);
    setUploading(true);
    try {
      const fileUrl = await uploadVaultFile(file, userProfile.id, (p) => setUploadProgress(p));
      await createVaultDocument({
        dealId: form.dealId || undefined, listingId: form.listingId || undefined,
        stage: form.stage || undefined, name: form.name, fileUrl,
        fileType: file.type || "application/octet-stream", fileSize: file.size,
        category: form.category, uploadedBy: userProfile.id,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).getTime() : undefined,
        notes: form.notes || undefined, tags: [],
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FilePicker onFileSelect={handleFileSelect} file={file} />
          <DocumentMetadataForm form={form} onChange={handleFormChange} />
          {uploading && uploadProgress && (
            <UploadProgress progress={uploadProgress.progress} bytesTransferred={uploadProgress.bytesTransferred} totalBytes={uploadProgress.totalBytes} status="uploading" />
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted" disabled={uploading}>Cancel</button>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" disabled={uploading || !file || !form.name}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
