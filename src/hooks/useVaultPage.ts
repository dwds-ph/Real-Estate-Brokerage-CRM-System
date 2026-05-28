import { useState, useMemo, useCallback } from "react";

import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import {
  deleteVaultDocument,
  getDocumentVersionHistory,
  DOCUMENT_CATEGORIES,
  getExpiryThreshold,
} from "@/services/documentVault";
import { VaultDocument, DocumentRequest, DocumentCategory } from "@/types";
import { VaultTab } from "@/components/documents/DocumentTabs";

interface GroupedDocs {
  [key: string]: VaultDocument[];
}

export function useVaultPage() {
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

  // Data from Firestore
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

    if (userProfile?.role !== "broker") {
      filtered = filtered.filter((d) => d.uploadedBy === userProfile?.id);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((d) => d.category === categoryFilter);
    }

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
        if (!grouped[doc.dealId]) {grouped[doc.dealId] = [];}
        grouped[doc.dealId].push(doc);
      }
    });
    return grouped;
  }, [documents]);

  const byListing = useMemo(() => {
    const grouped: GroupedDocs = {};
    documents.forEach((doc) => {
      if (doc.listingId) {
        if (!grouped[doc.listingId]) {grouped[doc.listingId] = [];}
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
    if (!userProfile) {return [];}
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
      // eslint-disable-next-line no-alert
      if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`))
        {return;}
      try {
        await deleteVaultDocument(doc);
        if (selectedDoc?.id === doc.id) {
          setSelectedDoc(null);
          setVersionHistory([]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Delete failed";
        // eslint-disable-next-line no-alert
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
      if (d.stage) {stages.add(d.stage);}
    });
    return Array.from(stages).sort();
  }, [allDocuments]);

  return {
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
    allDocuments,
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
  };
}
