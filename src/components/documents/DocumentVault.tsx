import { useState, useMemo } from "react";
import { type PropertyDocument, type DocumentCategory } from "@/types";
import { formatDate } from "@/lib/utils";
import { deleteDocument } from "@/services/documentVaultService";

const categoryLabels: Record<DocumentCategory, string> = {
  title: "Title",
  "tax-declaration": "Tax Declaration",
  permit: "Permit",
  contract: "Contract",
  "tax-clearance": "Tax Clearance",
  "hoa-docs": "HOA Docs",
  appraisal: "Appraisal",
  inspection: "Inspection",
  "deed-of-sale": "Deed of Sale",
  legal: "Legal",
  identification: "Identification",
  financial: "Financial",
  other: "Other",
};

const categoryBadgeColors: Record<DocumentCategory, string> = {
  title: "bg-blue-100 text-blue-700",
  "tax-declaration": "bg-green-100 text-green-700",
  permit: "bg-yellow-100 text-yellow-700",
  contract: "bg-purple-100 text-purple-700",
  "tax-clearance": "bg-teal-100 text-teal-700",
  "hoa-docs": "bg-indigo-100 text-indigo-700",
  appraisal: "bg-pink-100 text-pink-700",
  inspection: "bg-cyan-100 text-cyan-700",
  "deed-of-sale": "bg-rose-100 text-rose-700",
  legal: "bg-orange-100 text-orange-700",
  identification: "bg-gray-100 text-gray-700",
  financial: "bg-emerald-100 text-emerald-700",
  other: "bg-muted text-muted-foreground",
};

interface Props {
  documents: PropertyDocument[];
  onUpload: () => void;
  loading?: boolean;
}

export default function DocumentVault({ documents, onUpload, loading }: Props) {
  const [categoryFilter, setCategoryFilter] = useState<
    DocumentCategory | "all"
  >("all");

  const categories = [
    ...new Set(documents.map((d) => d.category)),
  ] as DocumentCategory[];
  const filtered =
    categoryFilter === "all"
      ? documents
      : documents.filter((d) => d.category === categoryFilter);
  const now = useMemo(() => Date.now(), []); // eslint-disable-line react-hooks/purity
  const isExpired = (date?: number) => date && date < now;

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${categoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
        >
          All ({documents.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
          >
            {categoryLabels[cat]} (
            {documents.filter((d) => d.category === cat).length})
          </button>
        ))}
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          No documents found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border bg-card p-3 text-sm shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{doc.name}</p>
                  <span
                    className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryBadgeColors[doc.category] || "bg-muted text-muted-foreground"}`}
                  >
                    {categoryLabels[doc.category]}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    if (confirm("Delete this document?")) {
                      await deleteDocument(doc.id);
                    }
                  }}
                  className="shrink-0 text-muted-foreground hover:text-red-500"
                  title="Delete"
                >
                  ✕
                </button>
              </div>

              {doc.expiryDate && (
                <p
                  className={`mt-2 text-[11px] ${isExpired(doc.expiryDate) ? "font-semibold text-red-500" : "text-muted-foreground"}`}
                >
                  {isExpired(doc.expiryDate) ? "⚠ Expired: " : "Expires: "}
                  {formatDate(doc.expiryDate)}
                </p>
              )}

              {doc.notes && (
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                  {doc.notes}
                </p>
              )}

              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  📄 View Document
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onUpload}
        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        + Upload Document
      </button>
    </div>
  );
}
