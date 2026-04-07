import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TimelinePage } from "@/components/timeline/timeline-page";
import { getTabFromSlug, orderedTabs } from "@/lib/timeline/tabs";

type PageProps = {
  params: Promise<{ tab: string }>;
};

export function generateStaticParams() {
  return orderedTabs
    .filter((tab) => tab.slug)
    .map((tab) => ({
      tab: tab.slug,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tab } = await params;
  const definition = getTabFromSlug(tab);

  if (!definition) {
    return {};
  }

  return {
    title: definition.label,
    description: definition.description,
  };
}

export default async function RoutedTimelinePage({ params }: PageProps) {
  const { tab } = await params;
  const definition = getTabFromSlug(tab);

  if (!definition || definition.key === "full_story") {
    notFound();
  }

  return <TimelinePage tabKey={definition.key} />;
}
