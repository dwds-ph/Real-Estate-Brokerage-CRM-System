import { useAuth } from "@/context/AuthContext";
import { useVaultPage } from "@/hooks/useVaultPage";
import { cn, formatDateTime } from "@/lib/utils";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import { DocumentDetail } from "@/components/documents/DocumentDetail";
import DocumentList from "@/components/documents/DocumentList";
import DocumentRequestModal from "@/components/documents/DocumentRequestModal";
import { DocumentTabs } from "@/components/documents/DocumentTabs";
import DocumentUpload from "@/components/documents/DocumentUpload";
import { ExpiryBanner } from "@/components/documents/ExpiryBanner";
import {
  DOCUMENT_CATEGORIES,
} from "@/services/documentVault";
import { DocumentCategory } from "@/types";

export default function VaultPage() {
  const { userProfile } = useAuth();
  const {
    activeTab,
    setActiveTab,
    selectedDoc,
    setSelectedDoc,
    showUpload,
    setShowUpload,
    showRequest,
    setShowRequest,
    categoryFilter,
    setCategoryFilter,
    stageFilter,
    setStageFilter,
    versionHistory,
    setVersionHistory,
    versionLoading,
    documents,
    byDeal,
    byListing,
    expiringDocs,
    myRequests,
    categoryCounts,
    uniqueStages,
    docsLoading,
    docsError,
    reqsLoading,
    loadVersionHistory,
    handleDelete,
  } = useVaultPage();

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
        <ExpiryBanner expiringDocs={expiringDocs} />
      )}

      {/* Tabs */}
      <DocumentTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        requestCount={myRequests.length}
      />

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
                <LoadingSpinner size="md" />
              ) : myRequests.length === 0 ? (
                <EmptyState
                  icon="📥"
                  title="No document requests"
                  description="Request documents from your team using the button above."
                />
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
        <DocumentDetail
          document={selectedDoc}
          versionHistory={versionHistory}
          versionLoading={versionLoading}
          onClose={() => {
            setSelectedDoc(null);
            setVersionHistory([]);
          }}
          onDelete={handleDelete}
        />
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
