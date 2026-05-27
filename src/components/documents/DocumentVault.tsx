import { useState } from "react";
import { type PropertyDocument, type DocumentCategory } from "@/types";
import { formatDate } from "@/lib/utils";
import { deleteDocument } from "@/services/documentVaultService";

interface Props {
  documents: PropertyDocument[];
  onUpload: () => void;
  loading?: boolean;
}

const categoryLabels: Record<DocumentCategory, string> = {
  title: "Title",
  "tax-declaration": "Tax Declaration",
  permit: "Permit",
  contract: "Contract",
  identification: "ID",
  financial: "Financial",
  legal: "Legal",
  other: "Other",
};

const categoryColors: Record<DocumentCategory, string> = {
  title: "bg-blue-100 text-blue-700",
  "tax-declaration": "bg-yellow-100 text-yellow-700",
  permit: "bg-purple-100 text-purple-700",
  contract: "bg-green-100 text-green-700",
  identification: "bg-gray-100 text-gray-700",
  financial: "bg-red-100 text-red-700",
  legal: "bg-orange-100 text-orange-700",
  other: "bg-muted text-muted-foreground",
};

export default function DocumentVault({ documents, onUpload, loading }: Props) {
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "all">("all");

  const categories = [...new Set(documents.map((d) => d.category))] as DocumentCategory[];
  const filtered = categoryFilter === "all" ? documents : documents.filter((d) => d.category === categoryFilter);
  const isExpired = (date?: number) => date && date < Date.now();

  if (loading) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1">
        <button onClick={() => setCategoryFilter("all")} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${categoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}>
          All ({documents.length})
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}>
            {categoryLabels[cat]} ({documents.filter((d) => d.category === cat).length})
          </button>
        ))}
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No documents found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((doc) => (
            <div key={doc.id} className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] mt-0.5 ${categoryColors[doc.category]}`}>
                    {categoryLabels[doc.category]}
                  </span>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded bg-muted px-2 py-1 text-[10px] hover:bg-accent" download>
                  📥
                </a>
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                {doc.expiryDate && (
                  <span className={isExpired(doc.expiryDate) ? "text-red-500 font-medium" : ""}>
                    {isExpired(doc.expiryDate) ? "⚠️ Expired: " : "Expires: "}{formatDate(doc.expiryDate)}
                  </span>
                )}
                {doc.uploadedByName && <p>Uploaded by {doc.uploadedByName}</p>}
              </div>
              <button
                onClick={async () => { if (confirm("Delete this document?")) await deleteDocument(doc.id); }}
                className="text-[10px] text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload FAB */}
      <button onClick={onUpload} className="w-full rounded-lg border-2 border-dashed border-muted-foreground/30 px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50">
        + Upload Document
      </button>
    </div>
  );
}
