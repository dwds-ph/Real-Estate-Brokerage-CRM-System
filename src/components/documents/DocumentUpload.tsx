import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadVaultFile, createVaultDocument, UploadProgress, getCategoryInfo, DOCUMENT_CATEGORIES, formatFileSize } from '@/services/documentVault';
import { DocumentCategory } from '@/types';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefillDealId?: string;
  prefillListingId?: string;
  prefillStage?: string;
}

export default function DocumentUpload({
  open,
  onClose,
  onSuccess,
  prefillDealId,
  prefillListingId,
  prefillStage,
}: DocumentUploadProps) {
  const { userProfile } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('miscellaneous');
  const [dealId, setDealId] = useState(prefillDealId || '');
  const [listingId, setListingId] = useState(prefillListingId || '');
  const [stage, setStage] = useState(prefillStage || '');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setName('');
        setCategory('miscellaneous');
        setDealId(prefillDealId || '');
        setListingId(prefillListingId || '');
        setStage(prefillStage || '');
        setExpiryDate('');
        setNotes('');
        setFile(null);
        setUploading(false);
        setUploadProgress(null);
        setError(null);
      }, 0);
    }
  }, [open, prefillDealId, prefillListingId, prefillStage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!name) {
        // Auto-fill name from filename (without extension)
        setName(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userProfile) return;

    setError(null);
    setUploading(true);

    try {
      const fileUrl = await uploadVaultFile(file, userProfile.id, (progress) => {
        setUploadProgress(progress);
      });

      const expiryTimestamp = expiryDate ? new Date(expiryDate).getTime() : undefined;

      await createVaultDocument({
        dealId: dealId || undefined,
        listingId: listingId || undefined,
        stage: stage || undefined,
        name,
        fileUrl,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        category,
        uploadedBy: userProfile.id,
        expiryDate: expiryTimestamp,
        notes: notes || undefined,
        tags: [],
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  const catInfo = getCategoryInfo(category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Picker */}
          <div>
            <label className="mb-1 block text-sm font-medium">File *</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary-foreground"
              required
            />
            {file && (
              <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium">Document Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Deed of Sale"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <span
              className={cn(
                'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                catInfo.color,
              )}
            >
              {catInfo.label}
            </span>
          </div>

          {/* Deal & Listing Linkage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Deal ID</label>
              <input
                type="text"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Listing ID</label>
              <input
                type="text"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Stage & Expiry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Stage</label>
              <input
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="e.g. closing"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {/* Progress */}
          {uploading && uploadProgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Uploading... {uploadProgress.progress}%</span>
                <span>
                  {formatFileSize(uploadProgress.bytesTransferred)} /{' '}
                  {formatFileSize(uploadProgress.totalBytes)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              disabled={uploading || !file || !name}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
