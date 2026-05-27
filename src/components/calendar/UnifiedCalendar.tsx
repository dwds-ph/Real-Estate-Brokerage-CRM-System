import { useState, useMemo } from "react";
import Calendar from "react-calendar";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { Viewing, TaskItem, Deal, VaultDocument, CalendarEvent } from "@/types";
import {
  getAggregatedEvents,
  getEventsForDay,
  EVENT_COLORS,
} from "@/services/calendarService";
import { formatDateTime, cn } from "@/lib/utils";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

const TYPE_LABELS: Record<string, string> = {
  viewing: "Viewing",
  task: "Task",
  "deal-milestone": "Deal",
  "document-expiry": "Document",
};

export default function UnifiedCalendar() {
  const { userProfile } = useAuth();
  const { data: viewings } = useCollection<Viewing>("viewings", []);
  const { data: tasks } = useCollection<TaskItem>("tasks", []);
  const { data: deals } = useCollection<Deal>("deals", []);
  const { data: documents } = useCollection<VaultDocument>(
    "vaultDocuments",
    [],
  );

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const allEvents = useMemo<CalendarEvent[]>(() => {
    if (!userProfile?.id) return [];
    return getAggregatedEvents(
      viewings as (Viewing & { id: string })[],
      tasks as (TaskItem & { id: string })[],
      deals as (Deal & { id: string })[],
      documents as (VaultDocument & { id: string })[],
    );
  }, [viewings, tasks, deals, documents, userProfile?.id]);

  const dayEvents = useMemo<CalendarEvent[]>(() => {
    return getEventsForDay(allEvents, selectedDate);
  }, [allEvents, selectedDate]);

  // Build a map of event types per date string for dots
  const eventTypeMap = useMemo<Record<string, Set<string>>>(() => {
    const map: Record<string, Set<string>> = {};
    for (const ev of allEvents) {
      const d = new Date(ev.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = new Set();
      map[key].add(ev.type);
    }
    return map;
  }, [allEvents]);

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const types = eventTypeMap[key];
    if (!types || types.size === 0) return null;
    const colors: Record<string, string> = {
      viewing: "bg-blue-500",
      task: "bg-orange-500",
      "deal-milestone": "bg-green-500",
      "document-expiry": "bg-red-500",
    };
    return (
      <div className="flex justify-center gap-0.5 mt-0.5">
        {Array.from(types).map((t) => (
          <span
            key={t}
            className={`inline-block h-1.5 w-1.5 rounded-full ${colors[t] || "bg-gray-400"}`}
          />
        ))}
      </div>
    );
  };

  const handleDateChange = (value: CalendarValue) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value[0]) {
      setSelectedDate(value[0]);
    }
  };

  const todayStr = formatDateTime(selectedDate.getTime());

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* Calendar */}
      <div className="rounded-lg border bg-card p-4">
        <style>{`
          .react-calendar {
            width: 100%;
            border: none;
            font-family: inherit;
            background: transparent;
          }
          .react-calendar__tile {
            padding: 0.5em 0.25em;
            font-size: 0.875rem;
          }
          .react-calendar__tile--active {
            background: hsl(221.2 83.2% 53.3%) !important;
            color: white !important;
          }
          .react-calendar__tile--now {
            background: hsl(221.2 83.2% 53.3% / 0.1);
          }
          .react-calendar__navigation button:enabled:hover,
          .react-calendar__navigation button:enabled:focus {
            background: hsl(210 40% 96.1%);
          }
          .react-calendar__month-view__weekdays__weekday {
            font-size: 0.75rem;
            text-transform: uppercase;
            color: hsl(215.4 16.3% 46.9%);
          }
          .react-calendar__month-view__weekdays__weekday abbr {
            text-decoration: none;
          }
        `}</style>
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          tileContent={tileContent}
          locale="en-US"
        />
      </div>

      {/* Day events panel */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="font-semibold text-lg">
          Events for <span className="text-primary">{todayStr}</span>
        </h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize text-muted-foreground">
                {TYPE_LABELS[type] || type}
              </span>
            </div>
          ))}
        </div>

        {dayEvents.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No events for this day
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {dayEvents.map((ev) => (
              <a
                key={ev.id}
                href={ev.sourceUrl}
                className={cn(
                  "block rounded-lg border-l-4 bg-card p-3 hover:bg-muted/50 transition-colors",
                  ev.type === "viewing" && "border-l-blue-500",
                  ev.type === "task" && "border-l-orange-500",
                  ev.type === "deal-milestone" && "border-l-green-500",
                  ev.type === "document-expiry" && "border-l-red-500",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{ev.title}</p>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: ev.color }}
                  >
                    {TYPE_LABELS[ev.type] || ev.type}
                  </span>
                </div>
                {ev.allDay ? (
                  <p className="text-xs text-muted-foreground mt-1">All day</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(ev.start)}
                    {ev.end ? ` - ${formatDateTime(ev.end)}` : ""}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
