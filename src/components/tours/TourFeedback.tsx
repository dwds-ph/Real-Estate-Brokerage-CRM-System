import { useState } from "react";
import { Tour, TourStop } from "@/types";
import { updateTour } from "@/services/tourService";
import { cn } from "@/lib/utils";

interface TourFeedbackProps {
  tour: Tour;
  onSaved: (updatedTour: Tour) => void;
  onCancel: () => void;
}

export default function TourFeedback({
  tour,
  onSaved,
  onCancel,
}: TourFeedbackProps) {
  const [stops, setStops] = useState<TourStop[]>(
    tour.stops.map((s) => ({
      ...s,
      feedback: s.feedback || {
        interestLevel: "medium",
        concerns: "",
        nextSteps: "",
      },
    })),
  );
  const [saving, setSaving] = useState(false);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);

  const currentStop = stops[currentStopIdx];

  function updateFeedback(
    stopId: string,
    updates: Partial<TourStop["feedback"]>,
  ) {
    setStops(
      stops.map((s) =>
        s.id === stopId
          ? { ...s, feedback: { ...(s.feedback || { interestLevel: "medium", concerns: "", nextSteps: "" }), ...updates } }
          : s,
      ),
    );
  }

  function addPhotoUrl(stopId: string, url: string) {
    setStops(
      stops.map((s) =>
        s.id === stopId
          ? { ...s, photoUrls: [...(s.photoUrls || []), url] }
          : s,
      ),
    );
  }

  const [photoInput, setPhotoInput] = useState("");

  async function handleSave() {
    setSaving(true);
    try {
      const updatedTour = {
        ...tour,
        stops,
        status: stops.every((s) => s.feedback?.interestLevel)
          ? ("completed" as const)
          : tour.status,
      };
      await updateTour(tour.id, {
        stops,
        status: updatedTour.status,
      });
      onSaved(updatedTour);
    } catch {
      // Handled silently
    } finally {
      setSaving(false);
    }
  }

  const allFeedbackGiven = stops.every(
    (s) => s.feedback?.interestLevel,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Tour Feedback</h2>
          <p className="text-sm text-muted-foreground">
            {tour.title} — {tour.clientName}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Stop {currentStopIdx + 1} of {stops.length}
        </span>
      </div>

      {/* Stop selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {stops.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentStopIdx(i)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              currentStopIdx === i
                ? "bg-primary text-primary-foreground"
                : s.feedback?.interestLevel
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-muted text-muted-foreground",
            )}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px]">
              {i + 1}
            </span>
            {s.listingTitle.substring(0, 20)}
            {s.feedback?.interestLevel === "high" && " 🔥"}
          </button>
        ))}
      </div>

      {/* Feedback form for current stop */}
      {currentStop && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {currentStopIdx + 1}
            </span>
            <div>
              <h3 className="font-semibold">{currentStop.listingTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStop.listingAddress}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Client Interest Level
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() =>
                    updateFeedback(currentStop.id, {
                      interestLevel: level,
                    })
                  }
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                    currentStop.feedback?.interestLevel === level
                      ? level === "high"
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : level === "medium"
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                          : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-background hover:bg-muted",
                  )}
                >
                  {level === "low"
                    ? "👎 Low"
                    : level === "medium"
                      ? "🤔 Medium"
                      : "🔥 High"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Client Concerns / Objections
            </label>
            <textarea
              value={currentStop.feedback?.concerns || ""}
              onChange={(e) =>
                updateFeedback(currentStop.id, {
                  concerns: e.target.value,
                })
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              rows={2}
              placeholder="e.g., Price concerns, location too far..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Next Steps
            </label>
            <input
              type="text"
              value={currentStop.feedback?.nextSteps || ""}
              onChange={(e) =>
                updateFeedback(currentStop.id, {
                  nextSteps: e.target.value,
                })
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="e.g., Send proposal, follow up next week"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tour Photos (URLs)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Photo URL"
              />
              <button
                onClick={() => {
                  if (photoInput) {
                    addPhotoUrl(currentStop.id, photoInput);
                    setPhotoInput("");
                  }
                }}
                className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                Add
              </button>
            </div>
            {currentStop.photoUrls && currentStop.photoUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {currentStop.photoUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img
                      src={url}
                      alt={`Tour photo ${i + 1}`}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (currentStopIdx > 0) {
              setCurrentStopIdx(currentStopIdx - 1);
            } else {
              onCancel();
            }
          }}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {currentStopIdx > 0 ? "← Previous Stop" : "Cancel"}
        </button>
        <div className="flex gap-2">
          {currentStopIdx < stops.length - 1 && (
            <button
              onClick={() => setCurrentStopIdx(currentStopIdx + 1)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Next Stop →
            </button>
          )}
          {currentStopIdx === stops.length - 1 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : allFeedbackGiven
                  ? "✓ Save & Complete Tour"
                  : "Save Feedback"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
