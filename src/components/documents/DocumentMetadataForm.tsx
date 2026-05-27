import { DocumentCategory } from "@/types";
import { DOCUMENT_CATEGORIES, getCategoryInfo } from "@/services/documentVault";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────

export interface DocumentFormData {
  name: string;
  category: DocumentCategory;
  dealId: string;
  listingId: string;
  stage: string;
  expiryDate: string;
  notes: string;
}

export interface DocumentMetadataFormProps {
  form: DocumentFormData;
  onChange: (field: keyof DocumentFormData, value: string) => void;
  categories?: typeof DOCUMENT_CATEGORIES;
  deals?: { id: string; name: string }[];
  listings?: { id: string; title: string }[];
}

// ─── DocumentMetadataForm Component ─────────────────────────────────

export function DocumentMetadataForm({
  form,
  onChange,
  categories = DOCUMENT_CATEGORIES,
}: DocumentMetadataFormProps) {
  const catInfo = getCategoryInfo(form.category);

  return (
    <>
      {/* Name */}
      <div>
        <label
          htmlFor="doc-meta-name"
          className="mb-1 block text-sm font-medium"
        >
          Document Name *
        </label>
        <input
          id="doc-meta-name"
          type="text"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="e.g. Deed of Sale"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="doc-meta-category"
          className="mb-1 block text-sm font-medium"
        >
          Category
        </label>
        <select
          id="doc-meta-category"
          value={form.category}
          onChange={(e) => onChange("category", e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <span
          className={cn(
            "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
            catInfo.color,
          )}
        >
          {catInfo.label}
        </span>
      </div>

      {/* Deal & Listing Linkage */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="doc-meta-deal"
            className="mb-1 block text-sm font-medium"
          >
            Deal ID
          </label>
          <input
            id="doc-meta-deal"
            type="text"
            value={form.dealId}
            onChange={(e) => onChange("dealId", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </div>
        <div>
          <label
            htmlFor="doc-meta-listing"
            className="mb-1 block text-sm font-medium"
          >
            Listing ID
          </label>
          <input
            id="doc-meta-listing"
            type="text"
            value={form.listingId}
            onChange={(e) => onChange("listingId", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Stage & Expiry */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="doc-meta-stage"
            className="mb-1 block text-sm font-medium"
          >
            Stage
          </label>
          <input
            id="doc-meta-stage"
            type="text"
            value={form.stage}
            onChange={(e) => onChange("stage", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="e.g. closing"
          />
        </div>
        <div>
          <label
            htmlFor="doc-meta-expiry"
            className="mb-1 block text-sm font-medium"
          >
            Expiry Date
          </label>
          <input
            id="doc-meta-expiry"
            type="date"
            value={form.expiryDate}
            onChange={(e) => onChange("expiryDate", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="doc-meta-notes"
          className="mb-1 block text-sm font-medium"
        >
          Notes
        </label>
        <textarea
          id="doc-meta-notes"
          value={form.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          rows={2}
          placeholder="Optional notes..."
        />
      </div>
    </>
  );
}
