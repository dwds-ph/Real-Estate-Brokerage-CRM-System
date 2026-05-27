import { useState, useEffect } from "react";
import { Tour, TourStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToursForAgent,
  subscribeToursForBroker,
  deleteTour,
  updateTourStatus,
  getTourStatusColor,
  getTourStatusLabel,
  getTotalTourDuration,
  formatDuration,
} from "@/services/tourService";
import { formatDate, cn } from "@/lib/utils";

interface TourListProps {
  onEditTour: (tour: Tour) => void;
  onViewItinerary: (tour: Tour) => void;
  refreshKey?: number;
}

export default function TourList({
  onEditTour,
  onViewItinerary,
  refreshKey,
}: TourListProps) {
  const { userProfile } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading] = useState(false);
  const [filter, setFilter] = useState<TourStatus | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!userProfile) return;

    const isBroker = userProfile.role === "broker";
    const unsub = isBroker
      ? subscribeToursForBroker(setTours)
      : subscribeToursForAgent(userProfile.id, setTours);

    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id, refreshKey]);

  const filtered = tours.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        t.stops.some((s) => s.listingTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const grouped = filtered.reduce(
    (acc, t) => {
      const status = t.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(t);
      return acc;
    },
    {} as Record<string, Tour[]>,
  );

  const statusOrder: TourStatus[] = [
    "in-progress",
    "confirmed",
    "draft",
    "completed",
    "cancelled",
  ];

  const handleDelete = async (tourId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this tour?")) {
      await deleteTour(tourId);
    }
  };

  const handleStatusToggle = async (tour: Tour, newStatus: TourStatus) => {
    await updateTourStatus(tour.id, newStatus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading tours...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              "all",
              "in-progress",
              "confirmed",
              "draft",
              "completed",
              "cancelled",
            ] as const
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {f === "all" ? "All" : getTourStatusLabel(f)}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search tours..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 rounded-lg border bg-background px-3 text-xs w-48"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          <p className="text-lg mb-1">No tours found</p>
          <p className="text-sm">
            {search
              ? "Try a different search term"
              : "Create your first property tour to get started"}
          </p>
        </div>
      ) : (
        statusOrder.map((status) => {
          const group = grouped[status] || [];
          if (group.length === 0) return null;
          return (
            <section key={status}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {getTourStatusLabel(status)}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({group.length})
                </span>
              </div>
              <div className="space-y-2">
                {group.map((tour) => (
                  <div
                    key={tour.id}
                    className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => onViewItinerary(tour)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {tour.title}
                          </p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                              getTourStatusColor(tour.status),
                            )}
                          >
                            {getTourStatusLabel(tour.status)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>👤 {tour.clientName}</span>
                          <span>📅 {formatDate(tour.scheduledDate)}</span>
                          <span>🏠 {tour.stops.length} stops</span>
                          <span>
                            ⏱ {formatDuration(getTotalTourDuration(tour.stops))}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {tour.status === "draft" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTour(tour);
                            }}
                            className="rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {tour.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleStatusToggle(tour, "in-progress")
                            }
                            className="rounded-md bg-yellow-100 px-2 py-1 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 hover:opacity-80"
                          >
                            ▶ Start
                          </button>
                        )}
                        {tour.status === "in-progress" && (
                          <button
                            onClick={() =>
                              handleStatusToggle(tour, "completed")
                            }
                            className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300 hover:opacity-80"
                          >
                            ✓ Complete
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(tour.id, e)}
                          className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* Preview stops */}
                    {tour.stops.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {tour.stops.slice(0, 3).map((stop, i) => (
                          <div
                            key={stop.id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <span className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] font-medium">
                              {i + 1}
                            </span>
                            <span className="truncate">
                              {stop.listingTitle}
                            </span>
                          </div>
                        ))}
                        {tour.stops.length > 3 && (
                          <p className="text-xs text-muted-foreground pl-6">
                            +{tour.stops.length - 3} more stops
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
