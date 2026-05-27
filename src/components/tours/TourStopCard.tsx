import { TourStop } from "@/types";
import { formatDateTime, cn } from "@/lib/utils";
import { formatDuration } from "@/services/tourService";

interface TourStopCardProps {
  stop: TourStop;
  index: number;
  total: number;
  showFeedback?: boolean;
  onEdit?: (stop: TourStop) => void;
  onRemove?: (stopId: string) => void;
  compact?: boolean;
}

export default function TourStopCard({
  stop,
  index,
  total,
  showFeedback,
  compact,
}: TourStopCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        {/* Stop number */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium truncate">{stop.listingTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {stop.listingAddress}
              </p>
            </div>
            {!compact && (
              <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                {formatDuration(stop.estimatedDuration)}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {stop.scheduledTime && (
              <span>⏰ {formatDateTime(stop.scheduledTime)}</span>
            )}
            {stop.driveTime !== undefined && stop.driveTime > 0 && (
              <span>🚗 ~{formatDuration(stop.driveTime)}</span>
            )}
          </div>

          {stop.notes && !compact && (
            <p className="mt-1.5 text-xs text-muted-foreground italic">
              📝 {stop.notes}
            </p>
          )}

          {showFeedback && stop.feedback && (
            <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs space-y-1">
              <p>
                Interest:{" "}
                <span
                  className={cn("font-medium", {
                    "text-green-600": stop.feedback.interestLevel === "high",
                    "text-yellow-600": stop.feedback.interestLevel === "medium",
                    "text-red-600": stop.feedback.interestLevel === "low",
                  })}
                >
                  {stop.feedback.interestLevel}
                </span>
              </p>
              {stop.feedback.concerns && (
                <p>Concerns: {stop.feedback.concerns}</p>
              )}
              {stop.feedback.nextSteps && (
                <p>Next: {stop.feedback.nextSteps}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress connector */}
      {index < total - 1 && (
        <div className="ml-4 mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          {stop.driveTime !== undefined && stop.driveTime > 0 && (
            <span>🚗 {formatDuration(stop.driveTime)}</span>
          )}
          <div className="h-px flex-1 bg-border" />
        </div>
      )}
    </div>
  );
}
