import type { TimelineEvent, TimelineStatus, TimelineTabKey } from "./types";

function toTimestamp(dateValue: string | undefined) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

  const value = /^\d{4}$/.test(dateValue) ? `${dateValue}-01` : dateValue;
  const parsed = new Date(`${value}-01T00:00:00Z`);

  return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime();
}

export function sortTimelineEvents(events: TimelineEvent[]) {
  return [...events].sort((left, right) => {
    const byDate = toTimestamp(left.dateStart) - toTimestamp(right.dateStart);

    if (byDate !== 0) {
      return byDate;
    }

    return left.priority - right.priority;
  });
}

export function filterEventsForTab(events: TimelineEvent[], tabKey: TimelineTabKey) {
  return sortTimelineEvents(events).filter((event) => event.tabs.includes(tabKey));
}

function buildMomentKey(event: TimelineEvent) {
  if (event.displayDate) {
    return event.displayDate.trim().toLowerCase();
  }

  return event.dateStart.slice(0, 7);
}

export function getSpotlightEvents(
  events: TimelineEvent[],
  activeEvent: TimelineEvent,
  tabKey: TimelineTabKey,
) {
  if (tabKey !== "full_story") {
    return [activeEvent];
  }

  const key = buildMomentKey(activeEvent);

  return sortTimelineEvents(events).filter((event) => buildMomentKey(event) === key);
}

export function getInitialEventIndex(events: TimelineEvent[]) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index]?.status === "current") {
      return index;
    }
  }

  return events.length > 0 ? events.length - 1 : 0;
}

export function deriveStatusFromDates(dateEnd?: string): TimelineStatus {
  if (!dateEnd) {
    return "past";
  }

  const endDate = toTimestamp(dateEnd);

  if (endDate >= Date.now()) {
    return "current";
  }

  return "past";
}

export function coerceTabList(tabValues: string[] | undefined): TimelineTabKey[] {
  const candidates: TimelineTabKey[] = [
    "full_story",
    "education",
    "experience",
    "research",
    "other_activities",
  ];

  return (tabValues ?? []).filter((value): value is TimelineTabKey =>
    candidates.includes(value as TimelineTabKey),
  );
}
