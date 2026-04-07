export type TimelineTabKey =
  | "full_story"
  | "education"
  | "experience"
  | "research"
  | "other_activities";

export type TimelineLane = "top" | "bottom";

export type TimelineStatus = "past" | "current" | "future";

export interface TimelineLink {
  label: string;
  url: string;
}

export interface TimelineMedia {
  type: "image" | "video";
  url: string;
  alt: string;
}

export interface TimelineChild {
  id: string;
  title: string;
  subtitle?: string;
  detail?: string;
  url?: string;
}

export interface TimelineEvent {
  id: string;
  slug: string;
  tabs: TimelineTabKey[];
  title: string;
  dateStart: string;
  dateEnd?: string;
  displayDate: string;
  lane: TimelineLane;
  summary: string;
  details: string;
  tags: string[];
  links: TimelineLink[];
  media: TimelineMedia[];
  priority: number;
  status: TimelineStatus;
  children?: TimelineChild[];
  location?: string;
  sourceLabel?: string;
  visibility?: "public" | "private";
}

export interface PersonProfile {
  name: string;
  role: string;
  intro: string;
  futureTeaser: string;
  location?: string;
  note?: string;
  socialLinks: TimelineLink[];
}

export interface TimelinePoint {
  x: number;
  y: number;
}

export interface TimelinePageData {
  profile: PersonProfile;
  events: TimelineEvent[];
  dataSource: "demo" | "sanity";
}

export interface TimelineTabDefinition {
  key: TimelineTabKey;
  chapterIndex: number;
  chapterTitle: string;
  label: string;
  path: string;
  slug?: string;
  eyebrow: string;
  description: string;
  presentLabel: string;
  emptyState: string;
}
