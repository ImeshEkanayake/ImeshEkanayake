import type { TimelineLane, TimelineStatus, TimelineTabKey } from "@/lib/timeline/types";

export interface IntakeSources {
  cvText: string;
  linkedInText: string;
  googleScholarText: string;
  manualNotes: string;
}

export type IntakeSourceKind = keyof IntakeSources;

export interface IntakeCandidate {
  id: string;
  slug: string;
  source: IntakeSourceKind;
  title: string;
  summary: string;
  details: string;
  dateStart: string;
  dateEnd?: string;
  displayDate: string;
  tabs: TimelineTabKey[];
  lane: TimelineLane;
  status: TimelineStatus;
  confidence: number;
  approved: boolean;
  visibility: "public" | "private";
  tags: string[];
}

export interface IntakeReviewBundle {
  createdAt: string;
  candidates: IntakeCandidate[];
  warnings: string[];
  stats: {
    total: number;
    approved: number;
    sources: Record<IntakeSourceKind, number>;
  };
}

export interface DraftCreationResult {
  mode: "preview" | "sanity";
  documentsCreated: number;
  documentIds: string[];
  documents: Record<string, unknown>[];
  message: string;
}
