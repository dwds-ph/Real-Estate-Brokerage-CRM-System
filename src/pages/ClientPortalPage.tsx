import { useParams } from "react-router-dom";
import { useDoc } from "@/hooks/useFirestore";
import { Lead } from "@/types";
import { formatDate, getLeadStatusColor, cn } from "@/lib/utils";

export default function ClientPortalPage() {
  const { leadToken } = useParams();
  const { data: lead, loading } = useDoc<Lead>("leads", leadToken);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="text-muted-foreground">
            This link is invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-3xl">🏠</span>
            </div>
            <h1 className="text-2xl font-bold">Your Property Portal</h1>
            <p className="text-muted-foreground">Welcome, {lead.name}!</p>
          </div>

          {/* Quick Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  getLeadStatusColor(lead.status),
                )}
              >
                {lead.status}
              </span>
            </div>
            {lead.propertyInterest && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Property Interest</span>
                <span>{lead.propertyInterest}</span>
              </div>
            )}
            {lead.budget && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span>₱{lead.budget.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{formatDate(lead.updatedAt)}</span>
            </div>
          </div>

          {/* Placeholder for future features */}
          <div className="border-t pt-6 space-y-4">
            <h2 className="text-lg font-semibold">What's Next?</h2>
            <div className="grid gap-3">
              <div className="rounded-lg border p-4 flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-sm font-medium">Schedule a Viewing</p>
                  <p className="text-xs text-muted-foreground">
                    Contact your agent to set a property viewing
                  </p>
                </div>
              </div>
              <div className="rounded-lg border p-4 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-sm font-medium">Financing Options</p>
                  <p className="text-xs text-muted-foreground">
                    Ask about Pag-IBIG and bank financing
                  </p>
                </div>
              </div>
              <div className="rounded-lg border p-4 flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-sm font-medium">Property Documents</p>
                  <p className="text-xs text-muted-foreground">
                    Your agent will guide you through requirements
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Questions? Contact your agent directly.
          </p>
        </div>
      </div>
    </div>
  );
}
