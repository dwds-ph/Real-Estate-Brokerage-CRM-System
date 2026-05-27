import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  CMAReport as CMAReportView,
  CMAReportGenerator,
} from "@/components/documents";
import { formatDate } from "@/lib/utils";
import type { CMReport } from "@/types";

export default function CMAPage() {
  const { userProfile } = useAuth();
  const brokerId = userProfile?.brokerId || userProfile?.id;
  const [reports, setReports] = useState<CMReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CMReport | null>(null);

  useEffect(() => {
    if (!brokerId) return;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setError(null);
    const unsub = onSnapshot(
      query(
        collection(db, "cmaReports"),
        where("brokerId", "==", brokerId),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setReports(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CMReport[],
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [brokerId]);

  if (showGenerator) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">New CMA Report</h1>
        </div>
        <CMAReportGenerator
          onDone={() => {
            setShowGenerator(false);
            setSelectedReport(null);
          }}
          onCancel={() => setShowGenerator(false)}
        />
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="space-y-4 max-w-3xl">
        <button
          onClick={() => setSelectedReport(null)}
          className="text-xs text-primary hover:underline"
        >
          \u2190 Back to Reports
        </button>
        <h1 className="text-2xl font-bold">CMA Report</h1>
        <CMAReportView report={selectedReport} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Comparative Market Analysis</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${reports.length} reports`}
          </p>
        </div>
        <button
          onClick={() => setShowGenerator(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + New CMA
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No CMA reports yet. Create one to analyze property values.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border bg-card p-4 space-y-2 cursor-pointer hover:shadow-sm"
              onClick={() => setSelectedReport(r)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {r.listingTitle || "CMA Report"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this report?"))
                      deleteDoc(doc(db, "cmaReports", r.id));
                  }}
                  className="text-[10px] text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Range:</span> \u20B1
                  {(r.adjustedRange?.min / 1000000).toFixed(1)}M \u2013 \u20B1
                  {(r.adjustedRange?.max / 1000000).toFixed(1)}M
                </div>
                <div>
                  <span className="text-muted-foreground">Recommended:</span>{" "}
                  \u20B1{(r.recommendedPrice / 1000000).toFixed(1)}M
                </div>
                <div>
                  <span className="text-muted-foreground">Comparables:</span>{" "}
                  {r.comparables?.length || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
