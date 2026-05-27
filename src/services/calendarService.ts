import {
  CalendarEvent,
  CalendarEventType,
  Viewing,
  TaskItem,
  Deal,
  VaultDocument,
} from '@/types';

type DocWithId<T> = T & { id: string };

const EVENT_COLORS: Record<CalendarEventType, string> = {
  viewing: '#3b82f6',
  task: '#f97316',
  'deal-milestone': '#22c55e',
  'document-expiry': '#ef4444',
};

function viewingToEvent(v: DocWithId<Viewing>): CalendarEvent {
  return {
    id: `viewing-${v.id}`,
    type: 'viewing',
    title: `Viewing: ${v.leadId} @ ${v.listingId}`,
    start: v.scheduledAt,
    end: v.scheduledAt + 3600000, // 1 hour default
    allDay: false,
    sourceId: v.id,
    sourceUrl: `/viewings`,
    color: EVENT_COLORS.viewing,
    metadata: { status: v.status, leadId: v.leadId, listingId: v.listingId },
  };
}

function taskToEvent(t: DocWithId<TaskItem>): CalendarEvent | null {
  if (!t.dueDate) return null;
  return {
    id: `task-${t.id}`,
    type: 'task',
    title: t.title,
    start: t.dueDate,
    end: undefined,
    allDay: true,
    sourceId: t.id,
    sourceUrl: `/tasks`,
    color: EVENT_COLORS.task,
    metadata: { priority: t.priority, status: t.status },
  };
}

function dealToEvents(d: DocWithId<Deal>): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  events.push({
    id: `deal-created-${d.id}`,
    type: 'deal-milestone',
    title: `Deal Created: ${d.clientName}`,
    start: d.createdAt,
    end: undefined,
    allDay: true,
    sourceId: d.id,
    sourceUrl: `/deals`,
    color: EVENT_COLORS['deal-milestone'],
    metadata: { status: d.status, price: d.dealPrice },
  });
  if (d.status === 'closed' && d.updatedAt) {
    events.push({
      id: `deal-closed-${d.id}`,
      type: 'deal-milestone',
      title: `Deal Closed: ${d.clientName}`,
      start: d.updatedAt,
      end: undefined,
      allDay: true,
      sourceId: d.id,
      sourceUrl: `/deals`,
      color: EVENT_COLORS['deal-milestone'],
      metadata: { status: 'closed', price: d.dealPrice },
    });
  }
  return events;
}

function docToEvent(doc: DocWithId<VaultDocument>): CalendarEvent | null {
  if (!doc.expiryDate) return null;
  return {
    id: `doc-expiry-${doc.id}`,
    type: 'document-expiry',
    title: `Document Expiry: ${doc.name}`,
    start: doc.expiryDate,
    end: undefined,
    allDay: true,
    sourceId: doc.id,
    sourceUrl: `/vault`,
    color: EVENT_COLORS['document-expiry'],
    metadata: { category: doc.category },
  };
}

export function getAggregatedEvents(
  viewings: DocWithId<Viewing>[],
  tasks: DocWithId<TaskItem>[],
  deals: DocWithId<Deal>[],
  documents: DocWithId<VaultDocument>[],
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const v of viewings) {
    events.push(viewingToEvent(v));
  }

  for (const t of tasks) {
    const ev = taskToEvent(t);
    if (ev) events.push(ev);
  }

  for (const d of deals) {
    events.push(...dealToEvents(d));
  }

  for (const doc of documents) {
    const ev = docToEvent(doc);
    if (ev) events.push(ev);
  }

  // Sort by start time ascending
  events.sort((a, b) => a.start - b.start);

  return events;
}

export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return events.filter((e) => {
    const start = e.start;
    return start >= dayStart.getTime() && start <= dayEnd.getTime();
  });
}

export { EVENT_COLORS };
