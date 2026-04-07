import type { TimelineTabDefinition, TimelineTabKey } from "./types";

export const timelineTabs: Record<TimelineTabKey, TimelineTabDefinition> = {
  full_story: {
    key: "full_story",
    chapterIndex: 1,
    chapterTitle: "Research, Product, and the Long Rope Between",
    label: "Full Story",
    path: "/",
    eyebrow: "Master timeline",
    description:
      "A complete narrative arc spanning engineering foundations, applied machine learning research, consulting, teaching, and institution building.",
    presentLabel: "The rope reaches the current frontier, with research and product work still unfolding.",
    emptyState: "Add your first public milestone to begin the journey.",
  },
  education: {
    key: "education",
    chapterIndex: 2,
    chapterTitle: "Learning the Craft",
    label: "Education",
    path: "/education",
    slug: "education",
    eyebrow: "Focused tab",
    description:
      "A focused study journey from computer engineering foundations to doctoral work in privacy, accuracy, and machine learning performance.",
    presentLabel: "The doctoral chapter is still in motion.",
    emptyState: "No education milestones are published yet.",
  },
  experience: {
    key: "experience",
    chapterIndex: 3,
    chapterTitle: "From Delivery to Leadership",
    label: "Experience",
    path: "/experience",
    slug: "experience",
    eyebrow: "Focused tab",
    description:
      "Professional roles move from data science delivery and university teaching into consulting, founding, and product leadership.",
    presentLabel: "The work stays live across teaching, research translation, and AI products.",
    emptyState: "No professional experience has been published yet.",
  },
  research: {
    key: "research",
    chapterIndex: 4,
    chapterTitle: "Making Models Explain Themselves",
    label: "Research",
    path: "/research",
    slug: "research",
    eyebrow: "Focused tab",
    description:
      "Research output appears as grouped year nodes, tracking a publication record shaped by explainability, privacy, fairness, and applied machine learning.",
    presentLabel: "New questions are still turning into papers, systems, and experiments.",
    emptyState: "No research milestones are published yet.",
  },
  other_activities: {
    key: "other_activities",
    chapterIndex: 5,
    chapterTitle: "Leadership, Service, and Side Quests",
    label: "Other Activities",
    path: "/other-activities",
    slug: "other-activities",
    eyebrow: "Focused tab",
    description:
      "Competitions, peer review, awards, and institution building live here as the parallel thread around the formal career path.",
    presentLabel: "The side quests keep feeding the main story.",
    emptyState: "No additional activities have been published yet.",
  },
};

export const orderedTabs = [
  timelineTabs.full_story,
  timelineTabs.education,
  timelineTabs.experience,
  timelineTabs.research,
  timelineTabs.other_activities,
];

export function getTabDefinition(tabKey: TimelineTabKey) {
  return timelineTabs[tabKey];
}

export function getTabFromSlug(slug?: string) {
  if (!slug) {
    return timelineTabs.full_story;
  }

  return orderedTabs.find((tab) => tab.slug === slug);
}
