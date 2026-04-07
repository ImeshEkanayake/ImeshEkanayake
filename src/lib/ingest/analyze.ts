import Papa from "papaparse";
import { z } from "zod";
import type { TimelineLane, TimelineStatus, TimelineTabKey } from "@/lib/timeline/types";
import type { IntakeCandidate, IntakeReviewBundle, IntakeSourceKind, IntakeSources } from "./types";

const intakeSchema = z.object({
  cvText: z.string().default(""),
  linkedInText: z.string().default(""),
  googleScholarText: z.string().default(""),
  manualNotes: z.string().default(""),
});

const MONTH_LOOKUP: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function hashLane(value: string): TimelineLane {
  let total = 0;

  for (const character of value) {
    total += character.charCodeAt(0);
  }

  return total % 2 === 0 ? "top" : "bottom";
}

function normaliseMonth(value: string) {
  const normalized = value.trim().slice(0, 3).toLowerCase();
  return MONTH_LOOKUP[normalized] || "01";
}

function parseDateRange(text: string) {
  const rangePattern =
    /(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(\d{4})\s*(?:-|–|to)\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(\d{4}|present|current|now)/i;
  const yearPattern = /\b(19|20)\d{2}\b/g;
  const rangeMatch = text.match(rangePattern);

  if (rangeMatch) {
    const startMonth = normaliseMonth(rangeMatch[1] || "Jan");
    const startYear = rangeMatch[2];
    const endMonth = rangeMatch[3] ? normaliseMonth(rangeMatch[3]) : "12";
    const endRaw = rangeMatch[4].toLowerCase();
    const isCurrent = endRaw === "present" || endRaw === "current" || endRaw === "now";
    const endYear = isCurrent ? String(new Date().getFullYear()) : endRaw;
    const displayEnd = isCurrent ? "present" : endYear;

    return {
      dateStart: `${startYear}-${startMonth}`,
      dateEnd: `${endYear}-${endMonth}`,
      displayDate: `${startYear}-${displayEnd}`,
      status: isCurrent ? ("current" as TimelineStatus) : ("past" as TimelineStatus),
    };
  }

  const years = [...text.matchAll(yearPattern)].map((match) => match[0]);

  if (years.length > 0) {
    return {
      dateStart: `${years[0]}-01`,
      dateEnd: years.length > 1 ? `${years[years.length - 1]}-12` : undefined,
      displayDate: years.length > 1 ? `${years[0]}-${years[years.length - 1]}` : years[0],
      status: "past" as TimelineStatus,
    };
  }

  return {
    dateStart: `${new Date().getFullYear()}-01`,
    dateEnd: undefined,
    displayDate: "Date needed",
    status: "future" as TimelineStatus,
  };
}

function inferTabs(text: string, source: IntakeSourceKind): TimelineTabKey[] {
  const lower = text.toLowerCase();
  const tabs = new Set<TimelineTabKey>(["full_story"]);

  if (/(phd|master|bachelor|university|school|degree|course|study|education)/.test(lower)) {
    tabs.add("education");
  }

  if (/(research|publication|paper|journal|conference|scholar|preprint|citation|thesis)/.test(lower)) {
    tabs.add("research");
  }

  if (/(engineer|analyst|manager|consultant|intern|role|company|organisation|startup|employment|experience)/.test(lower)) {
    tabs.add("experience");
  }

  if (/(mentor|mentoring|speaker|talk|panel|volunteer|service|committee|award|leadership)/.test(lower)) {
    tabs.add("other_activities");
  }

  if (tabs.size === 1) {
    if (source === "linkedInText") {
      tabs.add("experience");
    } else if (source === "googleScholarText") {
      tabs.add("research");
    } else {
      tabs.add("other_activities");
    }
  }

  return [...tabs];
}

function inferTitle(block: string) {
  const [firstLine] = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (firstLine) {
    return firstLine.slice(0, 96);
  }

  return "Untitled milestone";
}

function summarise(block: string) {
  const compact = block.replace(/\s+/g, " ").trim();

  if (compact.length <= 160) {
    return compact;
  }

  return `${compact.slice(0, 157)}...`;
}

function extractBlocks(source: IntakeSourceKind, text: string) {
  if (!text.trim()) {
    return [] as string[];
  }

  if (source === "linkedInText" && text.includes(",")) {
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    const csvBlocks = parsed.data
      .map((row) => Object.values(row).filter(Boolean).join(" | ").trim())
      .filter(Boolean);

    if (csvBlocks.length > 0) {
      return csvBlocks;
    }
  }

  if (source === "googleScholarText" && text.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as { publications?: Array<Record<string, string>> };
      const jsonBlocks =
        parsed.publications?.map((publication) =>
          Object.values(publication).filter(Boolean).join(" | ").trim(),
        ) ?? [];

      if (jsonBlocks.length > 0) {
        return jsonBlocks;
      }
    } catch {
      return text
        .split(/\n{2,}/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return text
    .split(/\n{2,}|(?:\n[-*]\s+)/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 18);
}

function buildCandidate(source: IntakeSourceKind, block: string, index: number): IntakeCandidate {
  const title = inferTitle(block);
  const dateData = parseDateRange(block);
  const summary = summarise(block);
  const tabs = inferTabs(block, source);
  const tags = tabs.filter((tab) => tab !== "full_story");

  return {
    id: `${source}-${slugify(title)}-${index + 1}`,
    slug: slugify(title),
    source,
    title,
    summary,
    details: block,
    dateStart: dateData.dateStart,
    dateEnd: dateData.dateEnd,
    displayDate: dateData.displayDate,
    tabs,
    lane: hashLane(title),
    status: dateData.status,
    confidence: Number((0.58 + Math.min(summary.length / 400, 0.32)).toFixed(2)),
    approved: source === "manualNotes",
    visibility: "public",
    tags,
  };
}

function sortCandidates(candidates: IntakeCandidate[]) {
  return [...candidates].sort((left, right) => left.dateStart.localeCompare(right.dateStart));
}

function dedupeCandidates(candidates: IntakeCandidate[]) {
  const seen = new Map<string, IntakeCandidate>();
  const warnings: string[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.slug}-${candidate.displayDate}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, candidate);
      continue;
    }

    warnings.push(`Merged duplicate intake item for "${candidate.title}" (${candidate.displayDate}).`);
    seen.set(key, {
      ...existing,
      tabs: [...new Set([...existing.tabs, ...candidate.tabs])],
      tags: [...new Set([...existing.tags, ...candidate.tags])],
      details:
        candidate.details.length > existing.details.length ? candidate.details : existing.details,
      summary:
        candidate.summary.length > existing.summary.length ? candidate.summary : existing.summary,
      confidence: Math.max(existing.confidence, candidate.confidence),
      approved: existing.approved || candidate.approved,
    });
  }

  return {
    candidates: [...seen.values()],
    warnings,
  };
}

export function analyzeIntakePayload(payload: unknown): IntakeReviewBundle {
  const sources = intakeSchema.parse(payload) satisfies IntakeSources;

  const extracted = (Object.keys(sources) as IntakeSourceKind[]).flatMap((source) =>
    extractBlocks(source, sources[source]).map((block, index) => buildCandidate(source, block, index)),
  );

  const deduped = dedupeCandidates(extracted);
  const candidates = sortCandidates(deduped.candidates);
  const stats = {
    total: candidates.length,
    approved: candidates.filter((candidate) => candidate.approved).length,
    sources: {
      cvText: candidates.filter((candidate) => candidate.source === "cvText").length,
      linkedInText: candidates.filter((candidate) => candidate.source === "linkedInText").length,
      googleScholarText: candidates.filter((candidate) => candidate.source === "googleScholarText").length,
      manualNotes: candidates.filter((candidate) => candidate.source === "manualNotes").length,
    },
  };

  const warnings = [...deduped.warnings];

  if (candidates.length === 0) {
    warnings.push("No candidate milestones were extracted. Add source material to begin the intake flow.");
  }

  if (!sources.manualNotes.trim()) {
    warnings.push("Manual notes are empty. Add editorial notes to improve titles, privacy choices, and narrative tone.");
  }

  return {
    createdAt: new Date().toISOString(),
    candidates,
    warnings,
    stats,
  };
}
