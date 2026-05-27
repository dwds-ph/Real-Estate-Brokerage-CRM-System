import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribePropertyDocuments,
  createDocument,
  uploadDocumentFile,
} from "@/services/documentVaultService";
import { DocumentVault, DocumentUploadForm } from "@/components/documents";
import type { PropertyDocument, DocumentCategory, Listing } from "@/types";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DocumentsPage() {
  const { userProfile } = useAuth();
  const brokerId = userProfile?.brokerId || userProfile?.id;
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsError, setListingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!brokerId) return;
    const unsub = onSnapshot(
      query(
        collection(db, "listings"),
        where("brokerId", "==", brokerId),
        orderBy("createdAt", "desc"),
      ),
      (snap) =>
        setListings(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Listing[],
        ),
      (err) => setListingsError(err.message),
    );
    return unsub;
  }, [brokerId]);

  useEffect(() => {
    if (!brokerId) return;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setError(null);
    const unsub = subscribePropertyDocuments(
      brokerId,
      selectedListingId || undefined,
      (items) => {
        setDocuments(items);
        setLoading(false);
      },
    );
    // subscribePropertyDocuments doesn't support error callback,
    // but we set loading false on any data change
    return unsub;
  }, [brokerId, selectedListingId]);

  const handleUpload = async (data: {
    name: string;
    category: DocumentCategory;
    file: File | null;
    expiryDate: string;
    notes: string;
  }) => {
    if (!data.file || !userProfile || !brokerId) return;
    setSaving(true);
    try {
      const path = `propertyDocuments/${brokerId}/${Date.now()}_${data.file.name}`;
      const fileUrl = await uploadDocumentFile(data.file, path);
      await createDocument({
        name: data.name,
        category: data.category,
        fileUrl,
        fileType: data.file.type,
        listingId: selectedListingId || undefined,
        notes: data.notes || undefined,
        expiryDate: data.expiryDate
          ? new Date(data.expiryDate).getTime()
          : undefined,
        uploadedBy: userProfile.id,
        uploadedByName: userProfile.displayName,
        brokerId,
      });
      setShowUpload(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents Vault</h1>
          <p className="text-sm text-muted-foreground">
            {documents.length} documents
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {listingsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load listings: {listingsError}
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium">Filter by listing:</label>
        <select
          value={selectedListingId}
          onChange={(e) => setSelectedListingId(e.target.value)}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm max-w-xs"
        >
          <option value="">All Listings</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </div>

      {showUpload ? (
        <DocumentUploadForm
          onSave={handleUpload}
          onCancel={() => setShowUpload(false)}
          saving={saving}
        />
      ) : (
        <DocumentVault
          documents={documents}
          onUpload={() => setShowUpload(true)}
          loading={loading}
        />
      )}
    </div>
  );
}
