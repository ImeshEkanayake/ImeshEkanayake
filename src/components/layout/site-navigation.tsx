"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePageTransition } from "@/components/layout/page-transition-provider";
import { orderedTabs } from "@/lib/timeline/tabs";
import styles from "./site-navigation.module.css";

export function SiteNavigation() {
  const pathname = usePathname();
  const { isTransitionActive, navigateWithRope } = usePageTransition();

  return (
    <header className={styles.shell}>
      <p className={styles.shellLabel}>Chapters</p>

      <nav className={styles.nav} aria-label="Primary">
        {orderedTabs.map((tab) => {
          const isActive = pathname === tab.path;

          return (
            <Link
              key={tab.key}
              href={tab.path}
              className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
              onClick={(event) => {
                if (
                  isActive ||
                  isTransitionActive ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  event.button !== 0
                ) {
                  if (isActive || isTransitionActive) {
                    event.preventDefault();
                  }

                  return;
                }

                event.preventDefault();
                navigateWithRope(tab.path, event.currentTarget);
              }}
            >
              <span className={styles.chapterMeta}>{tab.chapterIndex}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.utilityGroup}>
        <span className={styles.locale}>EN</span>
        <button type="button" className={styles.soundButton} aria-label="Toggle sound">
          <span className={styles.soundBody} />
          <span className={styles.soundWave} />
        </button>
      </div>
    </header>
  );
}
