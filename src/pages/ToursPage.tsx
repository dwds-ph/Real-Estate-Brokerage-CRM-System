import { useState } from "react";
import { Tour } from "@/types";
import {
  TourList,
  TourBuilder,
  TourItinerary,
  TourFeedback,
} from "@/components/tours";

type ViewState =
  | { type: "list" }
  | { type: "builder"; tour?: Tour }
  | { type: "itinerary"; tour: Tour }
  | { type: "feedback"; tour: Tour };

export default function ToursPage() {
  const [view, setView] = useState<ViewState>({ type: "list" });
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  switch (view.type) {
    case "list":
      return (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Property Tours</h1>
              <p className="text-muted-foreground">
                Build multi-property tour itineraries for your clients
              </p>
            </div>
            <button
              onClick={() => setView({ type: "builder" })}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 self-start sm:self-auto"
            >
              + New Tour
            </button>
          </div>
          <TourList
            onEditTour={(tour) => setView({ type: "builder", tour })}
            onViewItinerary={(tour) => setView({ type: "itinerary", tour })}
            refreshKey={refreshKey}
          />
        </div>
      );

    case "builder":
      return (
        <div className="max-w-3xl mx-auto">
          <TourBuilder
            tour={view.tour}
            onSaved={() => {
              triggerRefresh();
              setView({ type: "list" });
            }}
            onCancel={() => setView({ type: "list" })}
          />
        </div>
      );

    case "itinerary":
      return (
        <div className="max-w-3xl mx-auto">
          <TourItinerary
            tour={view.tour}
            onBack={() => {
              triggerRefresh();
              setView({ type: "list" });
            }}
            onEdit={() => setView({ type: "builder", tour: view.tour })}
            onFeedback={(tour) => setView({ type: "feedback", tour })}
          />
        </div>
      );

    case "feedback":
      return (
        <div className="max-w-3xl mx-auto">
          <TourFeedback
            tour={view.tour}
            onSaved={(updated) => {
              triggerRefresh();
              setView({ type: "itinerary", tour: updated });
            }}
            onCancel={() => setView({ type: "itinerary", tour: view.tour })}
          />
        </div>
      );
  }
}
