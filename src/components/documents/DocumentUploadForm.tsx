import { useState } from "react";
import { type DocumentCategory } from "@/types";

interface Props {
  onSave: (data: {
    name: string;
    category: DocumentCategory;
    file: File | null;
    expiryDate: string;
    notes: string;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function DocumentUploadForm({
  onSave,
  onCancel,
  saving,
}: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, category, file, expiryDate, notes });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-4 space-y-3"
    >
      <h4 className="font-medium text-sm">Upload Document</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor="doc-name" className="block text-xs font-medium mb-1">
            Document Name *
          </label>
          <input
            id="doc-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="doc-category"
            className="block text-xs font-medium mb-1"
          >
            Category *
          </label>
          <select
            id="doc-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
          >
            <option value="title">Title</option>
            <option value="tax-declaration">Tax Declaration</option>
            <option value="permit">Permit</option>
            <option value="contract">Contract</option>
            <option value="identification">Identification</option>
            <option value="financial">Financial</option>
            <option value="legal">Legal</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="doc-expiry"
            className="block text-xs font-medium mb-1"
          >
            Expiry Date
          </label>
          <input
            id="doc-expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="doc-file" className="block text-xs font-medium mb-1">
          File *
        </label>
        <input
          id="doc-file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="doc-notes" className="block text-xs font-medium mb-1">
          Notes
        </label>
        <textarea
          id="doc-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
          rows={2}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Uploading..." : "Upload"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-1.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
