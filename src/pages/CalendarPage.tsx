import { useState } from "react";
import UnifiedCalendar from "@/components/calendar/UnifiedCalendar";
import SmartReminders from "@/components/calendar/SmartReminders";
import QuickCreate from "@/components/calendar/QuickCreate";

export default function CalendarPage() {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Unified view of viewings, tasks, deals, and document expiries
          </p>
        </div>
        <button
          onClick={() => setQuickCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Quick Create
        </button>
      </div>

      {/* Smart Reminders */}
      <SmartReminders />

      {/* Unified Calendar */}
      <UnifiedCalendar />

      {/* Quick Create Modal */}
      <QuickCreate
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
      />
    </div>
  );
}
