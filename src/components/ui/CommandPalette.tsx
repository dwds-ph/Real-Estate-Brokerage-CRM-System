import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  section: "Pages" | "Actions";
  onSelect: () => void;
}

// ─── Commands ──────────────────────────────────────────────────────────────

function useCommands(): CommandItem[] {
  const navigate = useNavigate();

  return useMemo(() => {
    const pages: CommandItem[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        description: "Go to Dashboard",
        icon: "📊",
        section: "Pages",
        onSelect: () => navigate("/dashboard"),
      },
      {
        id: "leads",
        label: "Leads",
        description: "Go to Leads",
        icon: "👥",
        section: "Pages",
        onSelect: () => navigate("/leads"),
      },
      {
        id: "listings",
        label: "Listings",
        description: "Go to Listings",
        icon: "🏠",
        section: "Pages",
        onSelect: () => navigate("/listings"),
      },
      {
        id: "deals",
        label: "Deals",
        description: "Go to Deals",
        icon: "🤝",
        section: "Pages",
        onSelect: () => navigate("/deals"),
      },
      {
        id: "viewings",
        label: "Viewings",
        description: "Go to Viewings",
        icon: "👁️",
        section: "Pages",
        onSelect: () => navigate("/viewings"),
      },
      {
        id: "commissions",
        label: "Commissions",
        description: "Go to Commissions",
        icon: "💰",
        section: "Pages",
        onSelect: () => navigate("/commissions"),
      },
      {
        id: "payouts",
        label: "Payouts",
        description: "Go to Payouts",
        icon: "💵",
        section: "Pages",
        onSelect: () => navigate("/payouts"),
      },
      {
        id: "import",
        label: "Import",
        description: "Go to Import",
        icon: "📥",
        section: "Pages",
        onSelect: () => navigate("/import"),
      },
      {
        id: "tasks",
        label: "Tasks",
        description: "Go to Tasks",
        icon: "✅",
        section: "Pages",
        onSelect: () => navigate("/tasks"),
      },
      {
        id: "agents",
        label: "Agents",
        description: "Go to Agents",
        icon: "👤",
        section: "Pages",
        onSelect: () => navigate("/agents"),
      },
      {
        id: "expenses",
        label: "Expenses",
        description: "Go to Expenses",
        icon: "🧾",
        section: "Pages",
        onSelect: () => navigate("/expenses"),
      },
      {
        id: "ph-tools",
        label: "PH Tools",
        description: "Go to PH Tools",
        icon: "🛠️",
        section: "Pages",
        onSelect: () => navigate("/ph-tools"),
      },
      {
        id: "notifications",
        label: "Notifications",
        description: "Go to Notifications",
        icon: "🔔",
        section: "Pages",
        onSelect: () => navigate("/notifications"),
      },
      {
        id: "offices",
        label: "Offices",
        description: "Go to Offices",
        icon: "🏢",
        section: "Pages",
        onSelect: () => navigate("/offices"),
      },
      {
        id: "vault",
        label: "Vault",
        description: "Go to Vault",
        icon: "🔒",
        section: "Pages",
        onSelect: () => navigate("/vault"),
      },
      {
        id: "mortgages",
        label: "Mortgages",
        description: "Go to Mortgages",
        icon: "🏦",
        section: "Pages",
        onSelect: () => navigate("/mortgages"),
      },
      {
        id: "analytics",
        label: "Analytics",
        description: "Go to Analytics",
        icon: "📈",
        section: "Pages",
        onSelect: () => navigate("/analytics"),
      },
      {
        id: "calendar",
        label: "Calendar",
        description: "Go to Calendar",
        icon: "📅",
        section: "Pages",
        onSelect: () => navigate("/calendar"),
      },
      {
        id: "reminders",
        label: "Reminders",
        description: "Go to Reminders",
        icon: "⏰",
        section: "Pages",
        onSelect: () => navigate("/reminders"),
      },
      {
        id: "settings",
        label: "Settings",
        description: "Go to Settings",
        icon: "⚙️",
        section: "Pages",
        onSelect: () => navigate("/settings"),
      },
      {
        id: "checklist-templates",
        label: "Checklist Templates",
        description: "Go to Checklist Templates",
        icon: "📋",
        section: "Pages",
        onSelect: () => navigate("/checklist-templates"),
      },
      {
        id: "activity",
        label: "Activity",
        description: "Go to Activity",
        icon: "📜",
        section: "Pages",
        onSelect: () => navigate("/activity"),
      },
      {
        id: "projects",
        label: "Projects",
        description: "Go to Projects",
        icon: "📁",
        section: "Pages",
        onSelect: () => navigate("/projects"),
      },
      {
        id: "market",
        label: "Market",
        description: "Go to Market",
        icon: "🌐",
        section: "Pages",
        onSelect: () => navigate("/market"),
      },
      {
        id: "licenses",
        label: "Licenses",
        description: "Go to Licenses",
        icon: "📄",
        section: "Pages",
        onSelect: () => navigate("/licenses"),
      },
      {
        id: "tours",
        label: "Tours",
        description: "Go to Tours",
        icon: "🚗",
        section: "Pages",
        onSelect: () => navigate("/tours"),
      },
      {
        id: "leaderboard",
        label: "Leaderboard",
        description: "Go to Leaderboard",
        icon: "🏆",
        section: "Pages",
        onSelect: () => navigate("/leaderboard"),
      },
      {
        id: "map",
        label: "Map",
        description: "Go to Map",
        icon: "🗺️",
        section: "Pages",
        onSelect: () => navigate("/map"),
      },
      {
        id: "loans",
        label: "Loans",
        description: "Go to Loans",
        icon: "💳",
        section: "Pages",
        onSelect: () => navigate("/loans"),
      },
      {
        id: "cobrokerage",
        label: "Co-Brokerage",
        description: "Go to Co-Brokerage",
        icon: "🤝",
        section: "Pages",
        onSelect: () => navigate("/cobrokerage"),
      },
      {
        id: "documents",
        label: "Documents",
        description: "Go to Documents",
        icon: "📑",
        section: "Pages",
        onSelect: () => navigate("/documents"),
      },
      {
        id: "compliance",
        label: "Compliance",
        description: "Go to Compliance",
        icon: "⚖️",
        section: "Pages",
        onSelect: () => navigate("/compliance"),
      },
      {
        id: "cma",
        label: "CMA",
        description: "Go to CMA",
        icon: "📊",
        section: "Pages",
        onSelect: () => navigate("/cma"),
      },
    ];

    const actions: CommandItem[] = [
      {
        id: "create-lead",
        label: "Create Lead",
        description: "Add a new lead",
        icon: "➕",
        section: "Actions",
        onSelect: () => navigate("/leads"),
      },
      {
        id: "create-listing",
        label: "Create Listing",
        description: "Add a new listing",
        icon: "➕",
        section: "Actions",
        onSelect: () => navigate("/listings"),
      },
      {
        id: "create-deal",
        label: "Create Deal",
        description: "Add a new deal",
        icon: "➕",
        section: "Actions",
        onSelect: () => navigate("/deals"),
      },
      {
        id: "create-task",
        label: "Create Task",
        description: "Add a new task",
        icon: "➕",
        section: "Actions",
        onSelect: () => navigate("/tasks"),
      },
    ];

    return [...pages, ...actions];
  }, [navigate]);
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function CommandPalette() {
  const commands = useCommands();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ── Filter commands ────────────────────────────────────────────────────

  const flattenedItems = useMemo(() => {
    if (!query.trim()) {return commands;}
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.description.toLowerCase().includes(lower),
    );
  }, [commands, query]);

  const groupedItems = useMemo(() => {
    const groups: { section: string; items: CommandItem[] }[] = [];
    const sectionOrder: CommandItem["section"][] = ["Pages", "Actions"];

    for (const section of sectionOrder) {
      const items = flattenedItems.filter((c) => c.section === section);
      if (items.length > 0) {
        groups.push({ section, items });
      }
    }
    return groups;
  }, [flattenedItems]);

  // Reset selection when filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on query change
    setSelectedIndex(0);
  }, [flattenedItems.length]);

  // ── Scroll selected item into view ─────────────────────────────────────

  useEffect(() => {
    const flatIndex = selectedIndex;
    if (flatIndex >= 0 && flatIndex < flattenedItems.length) {
      const item = flattenedItems[flatIndex];
      const el = itemRefs.current.get(item.id);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, flattenedItems]);

  // ── Keyboard handler ───────────────────────────────────────────────────

  const globalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Toggle on Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Ignore if palette is closed
      if (!open) {return;}

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;

        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, flattenedItems.length - 1),
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;

        case "Enter": {
          const selected = flattenedItems[selectedIndex];
          if (selected) {
            e.preventDefault();
            selected.onSelect();
            setOpen(false);
          }
          break;
        }
      }
    },
    [open, flattenedItems, selectedIndex],
  );

  // ── Lifecycle: mount/unmount listener ──────────────────────────────────

  useEffect(() => {
    window.addEventListener("keydown", globalKeyDown);
    return () => window.removeEventListener("keydown", globalKeyDown);
  }, [globalKeyDown]);

  // ── Lock body scroll when open ─────────────────────────────────────────

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ── Focus input when opened ────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      // Reset query and selection on open
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on open
      setQuery("");
      setSelectedIndex(0);
      // Small delay to ensure the input is mounted
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ── Render ─────────────────────────────────────────────────────────────

  if (!open) {return null;}

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative mx-4 w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center border-b px-4">
          <span className="mr-3 text-lg text-muted-foreground">🔍</span>
          <input
            ref={inputRef}
            data-command-input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions..."
            className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {groupedItems.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for{" "}
              <span className="font-medium text-foreground">"{query}"</span>
            </div>
          )}

          {groupedItems.map((group) => {
            // Compute the flat index of the first item in this group
            const groupStartIndex = flattenedItems.indexOf(group.items[0]);

            return (
              <div key={group.section}>
                <div className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.section}
                </div>

                {group.items.map((item, localIdx) => {
                  const flatIdx = groupStartIndex + localIdx;
                  const isSelected = flatIdx === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      ref={(el) => {
                        if (el) {itemRefs.current.set(item.id, el);} else {itemRefs.current.delete(item.id);}
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/50",
                      )}
                      onClick={() => {
                        item.onSelect();
                        setOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(flatIdx)}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background text-xs">
                        {item.icon}
                      </span>
                      <div className="flex-1 truncate">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                      {isSelected && (
                        <kbd className="shrink-0 rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          ↵
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            <kbd className="rounded border bg-muted/50 px-1 font-mono">↑↓</kbd>{" "}
            navigate{" "}
            <kbd className="rounded border bg-muted/50 px-1 font-mono">↵</kbd>{" "}
            select{" "}
            <kbd className="rounded border bg-muted/50 px-1 font-mono">esc</kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  );
}
