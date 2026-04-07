import { demoEvents, demoProfile } from "@/lib/timeline/demo-data";
import { coerceTabList, deriveStatusFromDates, filterEventsForTab } from "@/lib/timeline/normalize";
import type { PersonProfile, TimelineEvent, TimelinePageData, TimelineTabKey } from "@/lib/timeline/types";
import { getReadClient } from "./client";
import { portfolioQuery } from "./queries";

interface SanityLink {
  label?: string;
  url?: string;
}

interface SanityMedia {
  type?: "image" | "video";
  url?: string;
  alt?: string;
}

interface SanityChild {
  _key?: string;
  title?: string;
  subtitle?: string;
  detail?: string;
  url?: string;
}

interface SanityEvent {
  id?: string;
  slug?: string;
  title?: string;
  tabs?: string[];
  dateStart?: string;
  dateEnd?: string;
  displayDate?: string;
  lane?: "top" | "bottom";
  summary?: string;
  details?: string;
  tags?: string[];
  links?: SanityLink[];
  media?: SanityMedia[];
  priority?: number;
  status?: "past" | "current" | "future";
  location?: string;
  visibility?: "public" | "private";
  children?: SanityChild[];
}

interface PortfolioQueryResult {
  profile?: Partial<PersonProfile>;
  events?: SanityEvent[];
  publicationGroups?: SanityEvent[];
}

function normalizeLinks(links?: SanityLink[]) {
  return (links ?? []).flatMap((link) =>
    link.label && link.url ? [{ label: link.label, url: link.url }] : [],
  );
}

function normalizeMedia(media?: SanityMedia[]) {
  return (media ?? []).flatMap((item) =>
    item.url
      ? [
          {
            type: item.type ?? "image",
            url: item.url,
            alt: item.alt || "",
          },
        ]
      : [],
  );
}

function normalizeChildren(children?: SanityChild[]) {
  return (children ?? []).flatMap((child, index) =>
    child.title
      ? [
          {
            id: child._key || `${child.title}-${index}`,
            title: child.title,
            subtitle: child.subtitle,
            detail: child.detail,
            url: child.url,
          },
        ]
      : [],
  );
}

function normalizeEvent(event: SanityEvent): TimelineEvent | null {
  if (!event.title || !event.dateStart) {
    return null;
  }

  return {
    id: event.id || event.slug || event.title,
    slug: event.slug || event.id || event.title.toLowerCase().replace(/\s+/g, "-"),
    title: event.title,
    tabs: coerceTabList(event.tabs),
    dateStart: event.dateStart,
    dateEnd: event.dateEnd,
    displayDate: event.displayDate || event.dateStart,
    lane: event.lane || "top",
    summary: event.summary || "Add a concise summary for this milestone.",
    details: event.details || event.summary || "",
    tags: event.tags ?? [],
    links: normalizeLinks(event.links),
    media: normalizeMedia(event.media),
    priority: event.priority ?? 1,
    status: event.status || deriveStatusFromDates(event.dateEnd),
    children: normalizeChildren(event.children),
    location: event.location,
    visibility: event.visibility ?? "public",
  };
}

function normalizeProfile(profile?: Partial<PersonProfile>): PersonProfile {
  return {
    name: profile?.name || demoProfile.name,
    role: profile?.role || demoProfile.role,
    intro: profile?.intro || demoProfile.intro,
    futureTeaser: profile?.futureTeaser || demoProfile.futureTeaser,
    location: profile?.location || demoProfile.location,
    note: profile?.note || demoProfile.note,
    socialLinks: profile?.socialLinks?.length ? profile.socialLinks : demoProfile.socialLinks,
  };
}

export async function getTimelinePageData(tabKey: TimelineTabKey): Promise<TimelinePageData> {
  const client = getReadClient();

  if (!client) {
    return {
      profile: demoProfile,
      events: filterEventsForTab(demoEvents, tabKey),
      dataSource: "demo",
    };
  }

  try {
    const data = await client.fetch<PortfolioQueryResult>(portfolioQuery, {}, { next: { revalidate: 60 } });
    const mergedEvents = [...(data.events ?? []), ...(data.publicationGroups ?? [])]
      .map(normalizeEvent)
      .filter((event): event is TimelineEvent => Boolean(event));

    if (mergedEvents.length === 0) {
      return {
        profile: normalizeProfile(data.profile),
        events: filterEventsForTab(demoEvents, tabKey),
        dataSource: "demo",
      };
    }

    return {
      profile: normalizeProfile(data.profile),
      events: filterEventsForTab(mergedEvents, tabKey),
      dataSource: "sanity",
    };
  } catch {
    return {
      profile: demoProfile,
      events: filterEventsForTab(demoEvents, tabKey),
      dataSource: "demo",
    };
  }
}
