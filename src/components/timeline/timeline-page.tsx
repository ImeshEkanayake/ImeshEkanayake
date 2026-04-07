import { getTimelinePageData } from "@/lib/sanity/fetchers";
import { getTabDefinition } from "@/lib/timeline/tabs";
import type { TimelineTabKey } from "@/lib/timeline/types";
import { TimelineExperience } from "./timeline-experience";
import styles from "./timeline-page.module.css";

interface TimelinePageProps {
  tabKey: TimelineTabKey;
}

export async function TimelinePage({ tabKey }: TimelinePageProps) {
  const tab = getTabDefinition(tabKey);
  const { profile, events, dataSource } = await getTimelinePageData(tabKey);

  return (
    <main className={styles.page}>
      <TimelineExperience
        key={`${tab.key}-${events.length}-${events[0]?.id ?? "empty"}-${events[events.length - 1]?.id ?? "empty"}`}
        profile={profile}
        events={events}
        tab={tab}
        dataSource={dataSource}
      />
    </main>
  );
}
