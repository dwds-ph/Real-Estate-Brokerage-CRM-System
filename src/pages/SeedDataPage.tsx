import { useState } from "react";
import {
  seedProductionData,
  type SeedResult,
} from "@/services/seedDataService";

export default function SeedDataPage() {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);

  const handleSeed = async () => {
    if (
      // eslint-disable-next-line no-alert
      !window.confirm(
        "This will create demo listings, leads, and deals. Continue?",
      )
    )
      {return;}
    setSeeding(true);
    setResult(null);
    try {
      const res = await seedProductionData();
      setResult(res);
    } catch (err) {
      setResult({
        success: false,
        agentsCreated: 0,
        listingsCreated: 0,
        leadsCreated: 0,
        dealsCreated: 0,
        error: String(err),
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Database Seeding</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Populate the CRM with realistic Philippine real estate demo data.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Demo Data Overview</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-blue-500">🏢</span>
            <span>
              <strong>10 listings</strong> — Condos, houses, lots, commercial,
              foreclosed across Metro Manila, Laguna, Batangas
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">👥</span>
            <span>
              <strong>10 leads</strong> — Hot/warm/cold with PH names and
              referral sources
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-amber-500">💰</span>
            <span>
              <strong>8 deals</strong> — Pending, closed, and cancelled with
              commission breakdowns
            </span>
          </li>
        </ul>
      </div>

      {result && (
        <div
          className={`rounded-lg border p-4 ${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <p
            className={`font-semibold ${result.success ? "text-green-700" : "text-red-700"}`}
          >
            {result.success ? "✅ Seeding Complete!" : "❌ Seeding Failed"}
          </p>
          {result.success ? (
            <ul className="mt-2 space-y-1 text-sm text-green-600">
              <li>Listings created: {result.listingsCreated}</li>
              <li>Leads created: {result.leadsCreated}</li>
              <li>Deals created: {result.dealsCreated}</li>
            </ul>
          ) : (
            <p className="mt-1 text-sm text-red-600">{result.error}</p>
          )}
        </div>
      )}

      <button
        onClick={handleSeed}
        disabled={seeding}
        className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {seeding ? "⏳ Seeding database..." : "🌱 Seed Demo Data"}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Only run this on a fresh/development database. Existing data will not be
        overwritten (uses unique IDs).
      </p>
    </div>
  );
}
