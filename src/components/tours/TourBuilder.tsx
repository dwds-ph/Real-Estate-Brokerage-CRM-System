import { useState, useMemo } from "react";
import { Tour, TourStop, Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { createTour, updateTour } from "@/services/tourService";
import { cn } from "@/lib/utils";

type BuilderStep = "client" | "listings" | "schedule" | "review";

interface TourBuilderProps {
  tour?: Tour | null;
  onSaved: () => void;
  onCancel: () => void;
}

function generateId(): string {
  return `stop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function TourBuilder({
  tour,
  onSaved,
  onCancel,
}: TourBuilderProps) {
  const { userProfile } = useAuth();
  const { data: listings } = useCollection<Listing>("listings", []);

  const [step, setStep] = useState<BuilderStep>("client");
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(tour?.title || "");
  const [clientName, setClientName] = useState(tour?.clientName || "");
  const [clientContact, setClientContact] = useState(tour?.clientContact || "");
  const [clientEmail, setClientEmail] = useState(tour?.clientEmail || "");
  const [scheduledDate, setScheduledDate] = useState(
    tour ? dateToInput(tour.scheduledDate) : "",
  );
  const [notes, setNotes] = useState(tour?.notes || "");
  const [stops, setStops] = useState<TourStop[]>(tour?.stops || []);

  const availableListings = useMemo(
    () => listings.filter((l) => l.status === "available") as Listing[],
    [listings],
  );

  const stopListingIds = new Set(stops.map((s) => s.listingId));
  const unselectedListings = availableListings.filter(
    (l) => !stopListingIds.has(l.id),
  );

  function dateToInput(ts: number): string {
    const d = new Date(ts);
    return d.toISOString().slice(0, 16);
  }

  function addStop(listing: Listing) {
    const newStop: TourStop = {
      id: generateId(),
      listingId: listing.id,
      listingTitle: listing.title,
      listingAddress: `${listing.location.address}, ${listing.location.city}`,
      order: stops.length,
      estimatedDuration: 30,
    };
    setStops([...stops, newStop]);
  }

  function removeStop(stopId: string) {
    const updated = stops
      .filter((s) => s.id !== stopId)
      .map((s, i) => ({ ...s, order: i }));
    setStops(updated);
  }

  function moveStop(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stops.length) {return;}
    const updated = [...stops];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setStops(updated.map((s, i) => ({ ...s, order: i })));
  }

  function updateStop(stopId: string, updates: Partial<TourStop>) {
    setStops(stops.map((s) => (s.id === stopId ? { ...s, ...updates } : s)));
  }

  function setStopTimes() {
    if (stops.length === 0 || !scheduledDate) {return;}
    const baseTime = new Date(scheduledDate).getTime();
    let currentTime = baseTime;

    setStops(
      stops.map((s, i) => {
        const scheduledTime = currentTime;
        const driveTime = i > 0 ? stops[i - 1].driveTime || 0 : 0;
        currentTime += (s.estimatedDuration + driveTime) * 60 * 1000;
        return {
          ...s,
          scheduledTime,
          driveTime: i > 0 ? stops[i - 1].driveTime || 15 : 0,
        };
      }),
    );
  }

  async function handleSave() {
    if (!userProfile || !clientName || !title || !scheduledDate) {return;}
    setSaving(true);

    // Auto-set times if not set
    const finalStops = stops.map((s, i) => ({
      ...s,
      driveTime: s.driveTime ?? (i > 0 ? 15 : 0),
      scheduledTime:
        s.scheduledTime ??
        (scheduledDate
          ? new Date(scheduledDate).getTime() + i * 30 * 60 * 1000
          : undefined),
    }));

    try {
      if (tour) {
        await updateTour(tour.id, {
          title,
          clientName,
          clientContact: clientContact || undefined,
          clientEmail: clientEmail || undefined,
          scheduledDate: new Date(scheduledDate).getTime(),
          notes: notes || undefined,
          stops: finalStops,
        });
      } else {
        await createTour({
          title,
          clientName,
          clientContact: clientContact || undefined,
          clientEmail: clientEmail || undefined,
          leadId: undefined,
          agentId: userProfile.id,
          scheduledDate: new Date(scheduledDate).getTime(),
          status: "draft",
          notes: notes || undefined,
          stops: finalStops,
        });
      }
      onSaved();
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  }

  const steps: { key: BuilderStep; label: string }[] = [
    { key: "client", label: "Client" },
    { key: "listings", label: "Listings" },
    { key: "schedule", label: "Schedule" },
    { key: "review", label: "Review" },
  ];

  const currentIdx = steps.findIndex((s) => s.key === step);

  function canProceed(): boolean {
    switch (step) {
      case "client":
        return !!title && !!clientName && !!scheduledDate;
      case "listings":
        return stops.length > 0;
      case "schedule":
        return stops.every((s) => s.estimatedDuration > 0);
      case "review":
        return true;
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (i < currentIdx) {setStep(s.key);}
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                step === s.key
                  ? "bg-primary text-primary-foreground"
                  : i < currentIdx
                    ? "bg-primary/20 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                {i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-6",
                  i < currentIdx ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step: Client Info */}
      {step === "client" && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Tour Details & Client Info</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Tour Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="e.g., Ayala Alabang Property Tour"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Client name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="09XX XXX XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="client@example.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                rows={2}
                placeholder="Any special requests or instructions..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Step: Select Listings */}
      {step === "listings" && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-3">Selected Properties</h3>
            {stops.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No properties added yet. Select from available listings below.
              </p>
            ) : (
              <div className="space-y-2">
                {stops.map((stop, i) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {stop.listingTitle}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {stop.listingAddress}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveStop(i, -1)}
                        disabled={i === 0}
                        className="rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveStop(i, 1)}
                        disabled={i === stops.length - 1}
                        className="rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeStop(stop.id)}
                        className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-3">
              Available Listings ({unselectedListings.length})
            </h3>
            {unselectedListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No more available listings to add.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {unselectedListings.map((listing) => (
                  <button
                    key={listing.id}
                    onClick={() => addStop(listing)}
                    className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="mt-0.5 text-lg">🏠</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {listing.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {listing.location.city} — ₱
                        {listing.price.toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Schedule */}
      {step === "schedule" && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Set Stop Schedule</h3>
            <button
              onClick={setStopTimes}
              className="rounded-md bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/80"
            >
              Auto-assign times
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Set duration and drive time for each stop. Sorted in tour order.
          </p>
          <div className="space-y-3">
            {stops.map((stop, i) => (
              <div
                key={stop.id}
                className="rounded-lg border bg-muted/30 p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium truncate">
                    {stop.listingTitle}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Visit Duration (min)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={stop.estimatedDuration}
                      onChange={(e) =>
                        updateStop(stop.id, {
                          estimatedDuration: parseInt(e.target.value) || 30,
                        })
                      }
                      className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  {i > 0 && (
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Drive from previous (min)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={180}
                        value={stop.driveTime || 15}
                        onChange={(e) =>
                          updateStop(stop.id, {
                            driveTime: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
                      />
                    </div>
                  )}
                  <div className={i === 0 ? "col-span-2" : ""}>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Agent Notes for this stop
                    </label>
                    <input
                      type="text"
                      value={stop.notes || ""}
                      onChange={(e) =>
                        updateStop(stop.id, { notes: e.target.value })
                      }
                      className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
                      placeholder="e.g., Meet client at gate"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Review Tour</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Title:</span> {title}
            </div>
            <div>
              <span className="text-muted-foreground">Client:</span>{" "}
              {clientName}
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>{" "}
              {scheduledDate ? new Date(scheduledDate).toLocaleString() : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Stops:</span>{" "}
              {stops.length} properties
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Contact:</span>{" "}
              {clientContact || "—"}
              {clientEmail ? ` | ${clientEmail}` : ""}
            </div>
          </div>
          {notes && (
            <p className="text-sm text-muted-foreground italic">📝 {notes}</p>
          )}

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Tour Stops</h4>
            <div className="space-y-2">
              {stops.map((stop, i) => (
                <div
                  key={stop.id}
                  className="flex items-start gap-2 rounded-lg bg-muted/30 p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{stop.listingTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {stop.listingAddress} — {stop.estimatedDuration} min
                      {stop.driveTime ? ` | 🚗 ~${stop.driveTime} min` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (currentIdx > 0) {
              setStep(steps[currentIdx - 1].key);
            } else {
              onCancel();
            }
          }}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {currentIdx === 0 ? "Cancel" : "Back"}
        </button>

        {currentIdx < steps.length - 1 ? (
          <button
            onClick={() => setStep(steps[currentIdx + 1].key)}
            disabled={!canProceed()}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !canProceed()}
            className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : tour ? "Update Tour" : "Create Tour"}
          </button>
        )}
      </div>
    </div>
  );
}
