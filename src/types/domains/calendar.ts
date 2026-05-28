export type CalendarEventType =
  | "viewing"
  | "task"
  | "deal-milestone"
  | "document-expiry";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  start: number;
  end?: number;
  allDay?: boolean;
  sourceId: string;
  sourceUrl: string;
  color: string;
  metadata?: Record<string, unknown>;
}
