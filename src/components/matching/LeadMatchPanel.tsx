import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection } from "@/hooks/useFirestore";
import { Lead, Listing, Unit, Project } from "@/types";
import { matchLeadToListings, matchLeadToUnits } from "@/lib/matchingEngine";
import { formatCurrency } from "@/lib/utils";

interface LeadMatchPanelProps {
  lead: Lead;
}

function getScoreColor(score: number): { bar: string; text: string; label: string } {
  if (score >= 70) return { bar: "bg-green-500", text: "text-green-600 dark:text-green-400", label: "Excellent Match" };
  if (score >= 50) return { bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", label: "Good Match" };
  if (score >= 35) return { bar: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400", label: "Fair Match" };
  return { bar: "bg-gray-300 dark:bg-gray-600", text: "text-muted-foreground", label: "Weak Match" };
}

export default function LeadMatchPanel({ lead }: LeadMatchPanelProps) {
  const navigate = useNavigate();
  const { data: listings } = useCollection<Listing>("listings", []);
  const { data: units } = useCollection<Unit>("units", []);
  const { data: projectsArr } = useCollection<Project>("projects", []);
  const [activeTab, setActiveTab] = useState<"listings" | "units">("listings");
  const [showAll, setShowAll] = useState(false);

  const projectsMap = useMemo(() => {
    const map = new Map<string, Project>();
    projectsArr.forEach((p) => map.set((p as Project).id, p as Project));
    return map;
  }, [projectsArr]);

  const availableListings = useMemo(
    () =>
      listings.filter(
        (l) =>
          (l as Listing).status === "available" ||
          (l as Listing).status === "under-option",
      ) as Listing[],
    [listings],
  );

  const availableUnits = useMemo(
    () =>
      units.filter(
        (u) =>
          (u as Unit).status === "available" ||
          (u as Unit).status === "reserved",
      ) as Unit[],
    [units],
  );

  const listingMatches = useMemo(
    () => matchLeadToListings(lead, availableListings),
    [lead, availableListings],
  );

  const unitMatches = useMemo(
    () => matchLeadToUnits(lead, availableUnits, projectsMap),
    [lead, availableUnits, projectsMap],
  );

  const displayMatches =
    activeTab === "listings" ? listingMatches : unitMatches;
  const visibleMatches = showAll
    ? displayMatches
    : displayMatches.slice(0, 5);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">
            🔍 Property Matches
            {listingMatches.length + unitMatches.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({listingMatches.length} listings · {unitMatches.length} units)
              </span>
            )}
          </h3>
        </div>
        {/* Tab toggle */}
        <div className="flex gap-1 rounded-md bg-muted p-0.5">
          <button
            onClick={() => setActiveTab("listings")}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              activeTab === "listings"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              activeTab === "units"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Units
          </button>
        </div>
      </div>

      {/* No matches */}
      {displayMatches.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          {activeTab === "listings"
            ? "No matching listings found. Try expanding the budget range or updating the lead's preferences."
            : "No matching project units available. Check back when new projects launch."}
        </div>
      ) : (
        <>
          {/* Match cards */}
          <div className="space-y-2">
            {visibleMatches.map((match) => {
              const colors = getScoreColor(match.score);
              return (
                <button
                  key={`${match.type}-${match.id}`}
                  onClick={() => navigate(match.href)}
                  className="w-full rounded-lg border bg-card p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {match.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {match.subTitle} · {match.location}
                      </p>
                      <p className="text-sm font-semibold mt-1">
                        {formatCurrency(match.price)}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${colors.bar}`}
                      >
                        {match.score}
                      </div>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {colors.label}
                      </span>
                    </div>
                  </div>

                  {/* Criteria chips */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {match.criteria.map((c) => (
                      <span
                        key={c.label}
                        title={c.detail}
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          c.matched
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                        }`}
                      >
                        {c.matched ? "✓" : "✗"} {c.label}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Show more / less */}
          {displayMatches.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-center text-xs text-primary hover:underline py-1"
            >
              {showAll
                ? "Show less"
                : `Show all ${displayMatches.length} matches`}
            </button>
          )}
        </>
      )}

      {/* Preferences Summary */}
      <details className="rounded-lg border bg-muted/20 p-2">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          Matching preferences used
        </summary>
        <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
          {lead.propertyInterest && (
            <p>• Property interest: "{lead.propertyInterest}"</p>
          )}
          {lead.budget && lead.budget > 0 && (
            <p>
              • Budget: ₱{lead.budget.toLocaleString()} (±30% tolerance)
            </p>
          )}
          {lead.location && <p>• Location: "{lead.location}"</p>}
          {!lead.propertyInterest && !lead.budget && !lead.location && (
            <p>
              • No preferences set. Update the lead's details for better
              matches.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
