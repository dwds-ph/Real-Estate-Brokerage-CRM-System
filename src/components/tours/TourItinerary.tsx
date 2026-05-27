import { Tour } from "@/types";
import {
  updateTourStatus,
  getTotalTourDuration,
  formatDuration,
  getTourStatusLabel,
  getTourStatusColor,
  generateGoogleMapsUrl,
} from "@/services/tourService";
import { formatDate, cn } from "@/lib/utils";
import TourStopCard from "./TourStopCard";

interface TourItineraryProps {
  tour: Tour;
  onBack: () => void;
  onEdit?: () => void;
  onFeedback?: (tour: Tour) => void;
}

export default function TourItinerary({
  tour,
  onBack,
  onEdit,
  onFeedback,
}: TourItineraryProps) {
  const mapsUrl = generateGoogleMapsUrl(tour.stops);
  const totalDuration = getTotalTourDuration(tour.stops);
  const completedStops = tour.stops.filter((s) => s.feedback).length;

  const handleStatusChange = async (status: string) => {
    if (
      status === "in-progress" ||
      status === "completed" ||
      status === "cancelled"
    ) {
      await updateTourStatus(tour.id, status);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="mb-2 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Tours
          </button>
          <h2 className="text-xl font-bold">{tour.title}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>👤 {tour.clientName}</span>
            <span>📅 {formatDate(tour.scheduledDate)}</span>
            <span>🏠 {tour.stops.length} stops</span>
            <span>⏱ {formatDuration(totalDuration)}</span>
          </div>
          {tour.clientContact && (
            <p className="text-sm text-muted-foreground mt-1">
              📞 {tour.clientContact}
              {tour.clientEmail ? ` | ✉️ ${tour.clientEmail}` : ""}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              getTourStatusColor(tour.status),
            )}
          >
            {getTourStatusLabel(tour.status)}
          </span>
          {tour.stops.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedStops}/{tour.stops.length} stops done
            </span>
          )}
        </div>
      </div>

      {tour.notes && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Tour Notes:</span>{" "}
            {tour.notes}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {tour.status === "draft" && onEdit && (
          <button
            onClick={onEdit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            ✏️ Edit Tour
          </button>
        )}
        {tour.status === "confirmed" && (
          <button
            onClick={() => handleStatusChange("in-progress")}
            className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
          >
            ▶ Start Tour
          </button>
        )}
        {tour.status === "in-progress" && onFeedback && (
          <button
            onClick={() => onFeedback(tour)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            ✍️ Record Feedback
          </button>
        )}
        {tour.status === "in-progress" && (
          <button
            onClick={() => handleStatusChange("completed")}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            ✓ Mark Complete
          </button>
        )}
        {(tour.status === "draft" || tour.status === "confirmed") && (
          <button
            onClick={() => handleStatusChange("cancelled")}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            ✕ Cancel Tour
          </button>
        )}
        {tour.status === "confirmed" && tour.stops.length >= 2 && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 inline-flex items-center gap-1"
          >
            🗺️ Open in Google Maps
          </a>
        )}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Total Duration</p>
          <p className="text-lg font-bold">{formatDuration(totalDuration)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Properties</p>
          <p className="text-lg font-bold">{tour.stops.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Avg. per Stop</p>
          <p className="text-lg font-bold">
            {tour.stops.length > 0
              ? formatDuration(
                  Math.round(
                    tour.stops.reduce((a, s) => a + s.estimatedDuration, 0) /
                      tour.stops.length,
                  ),
                )
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-lg font-bold capitalize">
            {getTourStatusLabel(tour.status)}
          </p>
        </div>
      </div>

      {/* Stops itinerary */}
      <div>
        <h3 className="font-semibold mb-3">
          Itinerary ({tour.stops.length} stops)
        </h3>
        <div className="space-y-0">
          {tour.stops.map((stop, i) => (
            <TourStopCard
              key={stop.id}
              stop={stop}
              index={i}
              total={tour.stops.length}
              showFeedback={true}
              compact={false}
            />
          ))}
        </div>
      </div>

      {/* Print-friendly button */}
      <div className="text-center pt-4 border-t">
        <button
          onClick={() => window.print()}
          className="rounded-lg border px-6 py-2 text-sm font-medium hover:bg-muted"
        >
          🖨️ Print Itinerary
        </button>
      </div>
    </div>
  );
}
