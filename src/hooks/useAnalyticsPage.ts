import { useState, useMemo } from "react";
import { where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { Lead, Deal, Viewing, Listing, Expense, AppUser } from "@/types";

function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
  const to = now.toISOString().split("T")[0];
  return { from, to };
}

export function useAnalyticsPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("funnel");
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const isBroker = userProfile?.role === "broker";

  // Fetch all data
  const { data: leads, loading: leadsLoading } = useCollection<Lead>(
    "leads",
    [],
  );
  const { data: deals, loading: dealsLoading } = useCollection<Deal>(
    "deals",
    [],
  );
  const { data: viewings, loading: viewingsLoading } = useCollection<Viewing>(
    "viewings",
    [],
  );
  const { data: listings, loading: listingsLoading } = useCollection<Listing>(
    "listings",
    [],
  );
  const { data: expenses, loading: expensesLoading } = useCollection<Expense>(
    "expenses",
    [],
  );
  const { data: agents, loading: agentsLoading } = useCollection<AppUser>(
    "users",
    userProfile?.brokerId
      ? [
          where("brokerId", "==", userProfile.brokerId),
          where("role", "in", ["agent", "sub-agent"]),
        ]
      : [],
  );

  // For agent view: also fetch all users if not broker to see own data
  const { data: allUsers } = useCollection<AppUser>("users", []);

  const effectiveAgents = isBroker
    ? agents
    : userProfile
      ? allUsers.filter((u) => u.id === userProfile.id)
      : [];

  // Filter by date range for certain reports
  const fromTs = new Date(dateRange.from).getTime();
  const toTs = new Date(`${dateRange.to  }T23:59:59`).getTime();

  const filteredLeads = useMemo(
    () => leads.filter((l) => l.createdAt >= fromTs && l.createdAt <= toTs),
    [leads, fromTs, toTs],
  );

  const myLeads = isBroker
    ? filteredLeads
    : filteredLeads.filter((l) => l.assignedTo === userProfile?.id);

  const isLoading =
    leadsLoading ||
    dealsLoading ||
    viewingsLoading ||
    listingsLoading ||
    expensesLoading ||
    agentsLoading;

  const hasData =
    activeTab === "funnel"
      ? myLeads.length > 0
      : activeTab === "agents"
        ? effectiveAgents.length > 0
        : activeTab === "pnl"
          ? isBroker
            ? agents.length > 0
            : effectiveAgents.length > 0
          : activeTab === "listings"
            ? listings.length > 0
            : activeTab === "sources"
              ? myLeads.length > 0
              : false;

  return {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    leads,
    deals,
    viewings,
    listings,
    expenses,
    agents,
    effectiveAgents,
    filteredLeads,
    myLeads,
    isLoading,
    hasData,
    isBroker,
    userProfile,
  };
}
