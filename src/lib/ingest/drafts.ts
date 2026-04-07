import { getWriteClient } from "@/lib/sanity/client";
import type { TimelineStatus } from "@/lib/timeline/types";
import { z } from "zod";
import type { DraftCreationResult, IntakeCandidate } from "./types";

type DraftDocument = {
  _id: string;
  _type: string;
  [key: string]: unknown;
};

const draftCandidateSchema = z.object({
  id: z.string(),
  slug: z.string(),
  source: z.enum(["cvText", "linkedInText", "googleScholarText", "manualNotes"]),
  title: z.string(),
  summary: z.string(),
  details: z.string(),
  dateStart: z.string(),
  dateEnd: z.string().optional(),
  displayDate: z.string(),
  tabs: z.array(
    z.enum(["full_story", "education", "experience", "research", "other_activities"]),
  ),
  lane: z.enum(["top", "bottom"]),
  status: z.enum(["past", "current", "future"]),
  confidence: z.number(),
  approved: z.boolean(),
  visibility: z.enum(["public", "private"]),
  tags: z.array(z.string()),
});

const draftRequestSchema = z.object({
  candidates: z.array(draftCandidateSchema),
});

function titleToSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeTimelineDocument(candidate: IntakeCandidate): DraftDocument {
  return {
    _id: `drafts.${candidate.id}`,
    _type: "timelineEvent",
    title: candidate.title,
    slug: {
      _type: "slug",
      current: candidate.slug || titleToSlug(candidate.title),
    },
    tabs: candidate.tabs,
    dateStart: candidate.dateStart,
    dateEnd: candidate.dateEnd,
    displayDate: candidate.displayDate,
    lane: candidate.lane,
    summary: candidate.summary,
    details: candidate.details,
    tags: candidate.tags,
    priority: 2,
    status: candidate.status,
    visibility: candidate.visibility,
    links: [],
    media: [],
  };
}

function buildResearchGroup(items: IntakeCandidate[], year: string): DraftDocument {
  const titles = items.map((item) => item.title);
  const status: TimelineStatus = items.some((item) => item.status === "current")
    ? "current"
    : "past";

  return {
    _id: `drafts.research-${year}`,
    _type: "publicationYearGroup",
    title: `Research output in ${year}`,
    slug: {
      _type: "slug",
      current: `research-${year}`,
    },
    tabs: ["full_story", "research"],
    dateStart: `${year}-01`,
    displayDate: year,
    lane: items[0]?.lane || "top",
    summary: `${items.length} research item${items.length === 1 ? "" : "s"} extracted for ${year}.`,
    details:
      "This grouped draft was generated from the intake flow. Review each child item, refine publication metadata, and publish when ready.",
    tags: ["research"],
    priority: 2,
    status,
    visibility: "public",
    publications: titles.map((title, index) => ({
      _key: `${titleToSlug(title)}-${index + 1}`,
      title,
      subtitle: items[index]?.source,
      detail: items[index]?.details,
      url: undefined,
    })),
    links: [],
  };
}

export async function createDraftDocuments(payload: unknown): Promise<DraftCreationResult> {
  const parsed = draftRequestSchema.parse(payload);
  const approved = parsed.candidates.filter(
    (candidate) => candidate.approved && candidate.visibility === "public",
  );

  const nonResearch = approved.filter((candidate) => !candidate.tabs.includes("research"));
  const research = approved.filter((candidate) => candidate.tabs.includes("research"));
  const researchByYear = new Map<string, IntakeCandidate[]>();

  for (const candidate of research) {
    const year = candidate.dateStart.slice(0, 4);
    const group = researchByYear.get(year) ?? [];
    group.push(candidate);
    researchByYear.set(year, group);
  }

  const documents: DraftDocument[] = [
    ...nonResearch.map(makeTimelineDocument),
    ...[...researchByYear.entries()].map(([year, items]) => buildResearchGroup(items, year)),
  ];

  const writeClient = getWriteClient();

  if (!writeClient) {
    return {
      mode: "preview",
      documentsCreated: documents.length,
      documentIds: documents.map((document) => String(document._id)),
      documents,
      message:
        "Sanity write credentials are not configured, so the intake flow generated draft payloads locally instead of publishing them.",
    };
  }

  const documentIds: string[] = [];

  for (const document of documents) {
    await writeClient.createOrReplace(document);
    documentIds.push(String(document._id));
  }

  return {
    mode: "sanity",
    documentsCreated: documents.length,
    documentIds,
    documents,
    message: "Draft documents were written to Sanity. Review them in Studio before publishing.",
  };
}
