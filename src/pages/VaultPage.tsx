import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { VaultDocument, DocumentRequest, DocumentCategory } from "@/types";
import {
  deleteVaultDocument,
  getDocumentVersionHistory,
  DOCUMENT_CATEGORIES,
  getCategoryInfo,
  formatFileSize,
  getExpiryThreshold,
} from "@/services/documentVault";
import DocumentUpload from "@/components/documents/DocumentUpload";
import DocumentList from "@/components/documents/DocumentList";
import DocumentRequestModal from "@/components/documents/DocumentRequestModal";
import { formatDate, formatDateTime, cn } from "@/lib/utils";

type VaultTab = "all" | "by-deal" | "by-listing" | "requests";

interface GroupedDocs {
  [key: string]: VaultDocument[];
}

export default function VaultPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<VaultTab>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [versionHistory, setVersionHistory] = useState<
    Record<string, unknown>[]
  >([]);
  const [versionLoading, setVersionLoading] = useState(false);
  const [now] = useState(() => Date.now());

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<
    DocumentCategory | "all"
  >("all");
  const [stageFilter, setStageFilter] = useState("");

  // Data from Firestore - use broader constraints and filter client-side for flexibility
  const {
    data: allDocuments,
    loading: docsLoading,
    error: docsError,
  } = useCollection<VaultDocument>("vaultDocuments");

  const { data: requests, loading: reqsLoading } =
    useCollection<DocumentRequest>("documentRequests");

  // Filter documents based on role and filters
  const documents = useMemo(() => {
    let filtered = allDocuments;

    // Role-based filtering
    if (userProfile?.role !== "broker") {
      filtered = filtered.filter((d) => d.uploadedBy === userProfile?.id);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((d) => d.category === categoryFilter);
    }

    // Stage filter
    if (stageFilter) {
      filtered = filtered.filter((d) =>
        d.stage?.toLowerCase().includes(stageFilter.toLowerCase()),
      );
    }

    return filtered;
  }, [allDocuments, userProfile, categoryFilter, stageFilter]);

  // Documents grouped by deal or listing
  const byDeal = useMemo(() => {
    const grouped: GroupedDocs = {};
    documents.forEach((doc) => {
      if (doc.dealId) {
        if (!grouped[doc.dealId]) grouped[doc.dealId] = [];
        grouped[doc.dealId].push(doc);
      }
    });
    return grouped;
  }, [documents]);

  const byListing = useMemo(() => {
    const grouped: GroupedDocs = {};
    documents.forEach((doc) => {
      if (doc.listingId) {
        if (!grouped[doc.listingId]) grouped[doc.listingId] = [];
        grouped[doc.listingId].push(doc);
      }
    });
    return grouped;
  }, [documents]);

  // Expiring documents (within 7 days)
  const expiringDocs = useMemo(() => {
    const threshold = getExpiryThreshold();
    return allDocuments.filter(
      (doc) =>
        doc.expiryDate && doc.expiryDate > now && doc.expiryDate <= threshold,
    );
  }, [allDocuments, now]);

  // User's incoming requests
  const myRequests = useMemo(() => {
    if (!userProfile) return [];
    return requests.filter(
      (r) => r.toUserId === userProfile.id || r.fromUserId === userProfile.id,
    );
  }, [requests, userProfile]);

  // Selected doc detail
  const loadVersionHistory = useCallback(async (doc: VaultDocument) => {
    setSelectedDoc(doc);
    setVersionLoading(true);
    try {
      const history = await getDocumentVersionHistory(doc.id);
      setVersionHistory(history);
    } catch {
      setVersionHistory([]);
    } finally {
      setVersionLoading(false);
    }
  }, []);

  const handleDelete = useCallback(
    async (doc: VaultDocument) => {
      if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`))
        return;
      try {
        await deleteVaultDocument(doc);
        if (selectedDoc?.id === doc.id) {
          setSelectedDoc(null);
          setVersionHistory([]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Delete failed";
        alert(message);
      }
    },
    [selectedDoc],
  );

  // Count documents per category for filter badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    DOCUMENT_CATEGORIES.forEach((c) => {
      counts[c.value] = documents.filter((d) => d.category === c.value).length;
    });
    return counts;
  }, [documents]);

  const uniqueStages = useMemo(() => {
    const stages = new Set<string>();
    allDocuments.forEach((d) => {
      if (d.stage) stages.add(d.stage);
    });
    return Array.from(stages).sort();
  }, [allDocuments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Vault</h1>
          <p className="text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""} in
            your vault
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRequest(true)}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            📥 Request
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Upload
          </button>
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiringDocs.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Documents Expiring Soon
            </h3>
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
      )}

      {/* Tabs */}
      <div className="flex border-b">
        {(
          [
            { key: "all", label: "All Documents" },
            { key: "by-deal", label: "By Deal" },
            { key: "by-listing", label: "By Listing" },
            {
              key: "requests",
              label: `Requests${myRequests.length > 0 ? ` (${myRequests.length})` : ""}`,
            },
          ] as { key: VaultTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Document list column */}
        <div
          className={cn(
            "space-y-4",
            selectedDoc ? "lg:col-span-2" : "lg:col-span-3",
          )}
        >
          {activeTab === "all" && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category filter */}
                <div className="flex flex-wrap gap-1">
                  {[
                    {
                      value: "all" as const,
                      label: `All (${categoryCounts.all})`,
                    },
                    ...DOCUMENT_CATEGORIES.map((c) => ({
                      value: c.value as DocumentCategory | "all",
                      label: `${c.label} (${categoryCounts[c.value]})`,
                    })),
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setCategoryFilter(f.value)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        categoryFilter === f.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Stage filter */}
                {uniqueStages.length > 0 && (
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="rounded-lg border bg-background px-3 py-1.5 text-xs"
                  >
                    <option value="">All Stages</option>
                    {uniqueStages.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <DocumentList
                documents={documents}
                loading={docsLoading}
                error={docsError}
                onSelect={loadVersionHistory}
                onDelete={handleDelete}
                selectedId={selectedDoc?.id}
              />
            </>
          )}

          {activeTab === "by-deal" && (
            <div className="space-y-4">
              {Object.keys(byDeal).length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No documents linked to deals.
                </div>
              ) : (
                Object.entries(byDeal).map(([dealId, docs]) => (
                  <div key={dealId} className="rounded-lg border bg-card">
                    <div className="border-b px-4 py-2">
                      <h3 className="text-sm font-medium">Deal: {dealId}</h3>
                      <p className="text-xs text-muted-foreground">
                        {docs.length} document{docs.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <DocumentList
                      documents={docs}
                      loading={false}
                      error={null}
                      onSelect={loadVersionHistory}
                      onDelete={handleDelete}
                      selectedId={selectedDoc?.id}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "by-listing" && (
            <div className="space-y-4">
              {Object.keys(byListing).length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No documents linked to listings.
                </div>
              ) : (
                Object.entries(byListing).map(([listingId, docs]) => (
                  <div key={listingId} className="rounded-lg border bg-card">
                    <div className="border-b px-4 py-2">
                      <h3 className="text-sm font-medium">
                        Listing: {listingId}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {docs.length} document{docs.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <DocumentList
                      documents={docs}
                      loading={false}
                      error={null}
                      onSelect={loadVersionHistory}
                      onDelete={handleDelete}
                      selectedId={selectedDoc?.id}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="space-y-4">
              {reqsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : myRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <span className="text-4xl mb-2">📥</span>
                  <p className="text-sm font-medium">No document requests</p>
                  <p className="text-xs">
                    Request documents from your team using the button above.
                  </p>
                </div>
              ) : (
                <div className="divide-y rounded-lg border">
                  {myRequests.map((req) => (
                    <div key={req.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {req.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {req.fromUserId === userProfile?.id
                              ? "Requested by you"
                              : `From: ${req.fromUserId}`}
                            {req.dealId && ` • Deal: ${req.dealId}`}
                            {" • "}
                            {formatDateTime(req.createdAt)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            req.status === "pending" &&
                              "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
                            req.status === "uploaded" &&
                              "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
                            req.status === "cancelled" &&
                              "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
                          )}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document detail panel */}
        {selectedDoc && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Document Details</h3>
                <button
                  onClick={() => {
                    setSelectedDoc(null);
                    setVersionHistory([]);
                  }}
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
                        selectedDoc.expiryDate <= now &&
                          "text-red-500 font-medium",
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
                          <span className="font-medium">
                            v{String(ver.version)}
                          </span>
                          <span className="text-muted-foreground">
                            {formatDate(Number(ver.uploadedAt))}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {String(ver.name)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DocumentUpload
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => {
          // Refresh handled by reactive useCollection
        }}
      />
      <DocumentRequestModal
        open={showRequest}
        onClose={() => setShowRequest(false)}
        onSuccess={() => {
          // Refresh handled by reactive useCollection
        }}
      />
    </div>
  );
}
