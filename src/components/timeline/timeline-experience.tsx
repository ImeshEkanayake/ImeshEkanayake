"use client";

import Link from "next/link";
import { gsap } from "gsap";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePageTransition } from "@/components/layout/page-transition-provider";
import { buildRopePath, buildTimelinePoints, getTrackWidth } from "@/lib/timeline/geometry";
import { getInitialEventIndex, getSpotlightEvents } from "@/lib/timeline/normalize";
import type {
  PersonProfile,
  TimelineEvent,
  TimelinePoint,
  TimelineTabDefinition,
} from "@/lib/timeline/types";
import styles from "./timeline-experience.module.css";

interface TimelineExperienceProps {
  profile: PersonProfile;
  events: TimelineEvent[];
  tab: TimelineTabDefinition;
  dataSource: "demo" | "sanity";
}

interface SpotlightLayout {
  left: number;
  top: number;
  placement: "left" | "right";
}

interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface SpotlightSize {
  width: number;
  height: number;
}

interface SpotlightCandidate extends SpotlightLayout {
  penalty: number;
  rect: SpotlightRect;
}

const SPOTLIGHT_MARGIN = 18;
const SPOTLIGHT_SIDE_GAP = 72;
const SPOTLIGHT_ROW_GAP = 34;
const SPOTLIGHT_SHIFT_STEPS = [0, -48, 48, -96, 96, -144, 144];
const TRAVELER_SAFE_RECT = {
  width: 104,
  height: 176,
};

function clampIndex(index: number, count: number) {
  if (count <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), count - 1);
}

function clampValue(value: number, minimum: number, maximum: number) {
  if (minimum > maximum) {
    return (minimum + maximum) / 2;
  }

  return Math.min(Math.max(value, minimum), maximum);
}

function getTimelineAnchor(viewportWidth: number) {
  return viewportWidth < 900 ? 0.48 : 0.36;
}

function getVisibleTrackRange(
  activePoint: TimelinePoint,
  viewportWidth: number,
  trackWidth: number,
) {
  const anchor = getTimelineAnchor(viewportWidth);
  const targetX = activePoint.x - viewportWidth * anchor;
  const maxOffset = Math.max(trackWidth - viewportWidth, 0);
  const centeredOffset = maxOffset === 0 ? (viewportWidth - trackWidth) / 2 : 0;
  const visibleLeft = maxOffset === 0 ? -centeredOffset : Math.max(0, Math.min(targetX, maxOffset));
  const visibleRight = maxOffset === 0 ? trackWidth + centeredOffset : visibleLeft + viewportWidth;

  return {
    anchor,
    visibleLeft,
    visibleRight,
    maxOffset,
    centeredOffset,
  };
}

function estimateSpotlightSize(viewportWidth: number): SpotlightSize {
  const width = Math.min(320, Math.max(viewportWidth - 48, 220));

  return {
    width,
    height: 248,
  };
}

function getPreferredSpotlightSides(
  point: TimelinePoint,
  visibleLeft: number,
  visibleRight: number,
) {
  const roomOnLeft = point.x - visibleLeft;
  const roomOnRight = visibleRight - point.x;

  return roomOnRight >= roomOnLeft ? (["right", "left"] as const) : (["left", "right"] as const);
}

function computeSpotlightLayouts({
  activePoint,
  events,
  points,
  sizesById,
  trackWidth,
  viewportHeight,
  viewportWidth,
  visibleSpotlightEvents,
}: {
  activePoint?: TimelinePoint;
  events: TimelineEvent[];
  points: TimelinePoint[];
  sizesById?: Record<string, SpotlightSize>;
  trackWidth: number;
  viewportHeight: number;
  viewportWidth: number;
  visibleSpotlightEvents: TimelineEvent[];
}) {
  if (
    !activePoint ||
    viewportWidth === 0 ||
    viewportHeight === 0 ||
    visibleSpotlightEvents.length === 0
  ) {
    return {};
  }

  const { visibleLeft, visibleRight } = getVisibleTrackRange(activePoint, viewportWidth, trackWidth);
  const placedRects: SpotlightRect[] = [
    {
      left: activePoint.x - TRAVELER_SAFE_RECT.width / 2,
      top: activePoint.y - TRAVELER_SAFE_RECT.height,
      width: TRAVELER_SAFE_RECT.width,
      height: TRAVELER_SAFE_RECT.height,
    },
  ];
  const nextLayouts: Record<string, SpotlightLayout> = {};

  visibleSpotlightEvents.forEach((event) => {
    const eventIndex = events.findIndex((entry) => entry.id === event.id);
    const point = points[eventIndex];

    if (!point) {
      return;
    }

    const estimatedSize = estimateSpotlightSize(viewportWidth);
    const size = sizesById?.[event.id] ?? estimatedSize;
    const preferredRow = event.lane === "top" ? "top" : "bottom";
    const candidateRows =
      preferredRow === "top" ? (["top", "bottom"] as const) : (["bottom", "top"] as const);
    const candidateSides = getPreferredSpotlightSides(point, visibleLeft, visibleRight);
    let bestCandidate: SpotlightCandidate | null = null;

    for (const row of candidateRows) {
      for (const placement of candidateSides) {
      for (const shift of SPOTLIGHT_SHIFT_STEPS) {
        const sideBaseLeft =
          placement === "left"
            ? point.x - size.width - SPOTLIGHT_SIDE_GAP
            : point.x + SPOTLIGHT_SIDE_GAP;
        const idealLeft = sideBaseLeft + shift;
        const left = clampValue(
          idealLeft,
          visibleLeft + SPOTLIGHT_MARGIN,
          visibleRight - size.width - SPOTLIGHT_MARGIN,
        );
        const idealTop =
          row === "top"
            ? point.y - size.height - SPOTLIGHT_ROW_GAP
            : point.y + SPOTLIGHT_ROW_GAP;
        const top = clampValue(
          idealTop,
          SPOTLIGHT_MARGIN,
          viewportHeight - size.height - SPOTLIGHT_MARGIN,
        );
        const rect = {
          left,
          top,
          width: size.width,
          height: size.height,
        };
        const overlapPenalty = placedRects.reduce(
          (total, rectCandidate) => total + getRectOverlapArea(rect, rectCandidate),
          0,
        );
        const penalty =
          Math.abs(left - idealLeft) * 1.2 +
          Math.abs(top - idealTop) * 1.6 +
          Math.abs(shift) * 0.12 +
          (row === preferredRow ? 0 : 95) +
          overlapPenalty * 12;

        if (!bestCandidate || penalty < bestCandidate.penalty) {
          bestCandidate = {
            left,
            top,
            placement,
            penalty,
            rect,
          };
        }
      }
      }
    }

    if (!bestCandidate) {
      return;
    }

    nextLayouts[event.id] = {
      left: bestCandidate.left,
      top: bestCandidate.top,
      placement: bestCandidate.placement,
    };
    placedRects.push(bestCandidate.rect);
  });

  return nextLayouts;
}

function isExternalLink(url: string) {
  return /^(https?:\/\/|mailto:)/.test(url);
}

function getRectOverlapArea(left: SpotlightRect, right: SpotlightRect) {
  const overlapWidth =
    Math.min(left.left + left.width, right.left + right.width) - Math.max(left.left, right.left);
  const overlapHeight =
    Math.min(left.top + left.height, right.top + right.height) - Math.max(left.top, right.top);

  if (overlapWidth <= 0 || overlapHeight <= 0) {
    return 0;
  }

  return overlapWidth * overlapHeight;
}

function layoutsMatch(
  current: Record<string, SpotlightLayout>,
  next: Record<string, SpotlightLayout>,
) {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return currentKeys.every((key) => {
    const currentLayout = current[key];
    const nextLayout = next[key];

    if (!currentLayout || !nextLayout) {
      return false;
    }

    return (
      currentLayout.placement === nextLayout.placement &&
      Math.abs(currentLayout.left - nextLayout.left) < 1 &&
      Math.abs(currentLayout.top - nextLayout.top) < 1
    );
  });
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

export function TimelineExperience({
  profile,
  events,
  tab,
  dataSource,
}: TimelineExperienceProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { isTransitionActive } = usePageTransition();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const travelerRef = useRef<HTMLDivElement>(null);
  const spotlightRefs = useRef<Record<string, HTMLElement | null>>({});
  const wheelLockRef = useRef(0);
  const initialIndex = getInitialEventIndex(events);
  const [hasStarted, setHasStarted] = useState(isTransitionActive);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [spotlightLayouts, setSpotlightLayouts] = useState<Record<string, SpotlightLayout>>({});

  const points = useMemo(
    () => buildTimelinePoints(events.length, viewportSize.width),
    [events.length, viewportSize.width],
  );
  const ropePath = buildRopePath(points);
  const trackWidth = getTrackWidth(events.length, viewportSize.width);
  const currentEvent = events[currentIndex];
  const currentPoint = points[currentIndex];
  const spotlightEvents = useMemo(
    () => (currentEvent ? getSpotlightEvents(events, currentEvent, tab.key) : []),
    [currentEvent, events, tab.key],
  );
  const activeDetailEventId =
    detailEventId && spotlightEvents.some((event) => event.id === detailEventId)
      ? detailEventId
      : currentEvent?.id ?? null;
  const detailEvent =
    spotlightEvents.find((event) => event.id === activeDetailEventId) ?? currentEvent ?? null;
  const hasParallelMoment = tab.key === "full_story" && spotlightEvents.length > 1;
  const visibleSpotlightEvents = hasParallelMoment
    ? spotlightEvents.filter((event) => event.id === activeDetailEventId)
    : spotlightEvents;
  const chapterLabel = `Chapter ${tab.chapterIndex} · ${tab.chapterTitle}`;
  const announcement = currentEvent ? `${currentEvent.displayDate}: ${currentEvent.title}` : "";
  const introMeta =
    dataSource === "sanity"
      ? "Live narrative loaded from Sanity"
      : "Curated from CV, LinkedIn, and Google Scholar";
  const introSummary = [profile.location, profile.intro].filter(Boolean).join(" · ");
  const fallbackSpotlightLayouts = useMemo(
    () =>
      computeSpotlightLayouts({
        activePoint: currentPoint,
        events,
        points,
        trackWidth,
        viewportHeight: viewportSize.height,
        viewportWidth: viewportSize.width,
        visibleSpotlightEvents,
      }),
    [currentPoint, events, points, trackWidth, viewportSize.height, viewportSize.width, visibleSpotlightEvents],
  );

  function beginExperience() {
    setHasStarted(true);
  }

  function moveBy(delta: number) {
    if (events.length === 0) {
      return;
    }

    setCurrentIndex((previous) => clampIndex(previous + delta, events.length));
    setIsDetailOpen(false);
    setDetailEventId(null);
  }

  function jumpToIndex(targetIndex: number) {
    if (events.length === 0) {
      return;
    }

    setCurrentIndex(clampIndex(targetIndex, events.length));
    setIsDetailOpen(false);
    setDetailEventId(null);
  }

  const moveByEffect = useEffectEvent((delta: number) => {
    if (!hasStarted) {
      beginExperience();
      return;
    }

    moveBy(delta);
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }

      if (!hasStarted && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setHasStarted(true);
        return;
      }

      if (event.key === " " || event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        moveByEffect(1);
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        moveByEffect(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasStarted]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 20) {
        return;
      }

      const now = Date.now();

      if (now - wheelLockRef.current < 700) {
        event.preventDefault();
        return;
      }

      wheelLockRef.current = now;
      event.preventDefault();
      moveByEffect(event.deltaY > 0 ? 1 : -1);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });

    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const updateViewportSize = () =>
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });

    updateViewportSize();

    const resizeObserver = new ResizeObserver(() => updateViewportSize());
    resizeObserver.observe(viewport);

    return () => resizeObserver.disconnect();
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const activePoint = points[currentIndex];

    if (!viewport || !track || !activePoint || viewportSize.width === 0) {
      return;
    }

    const { anchor, maxOffset, centeredOffset } = getVisibleTrackRange(
      activePoint,
      viewportSize.width,
      trackWidth,
    );
    const targetX = activePoint.x - viewportSize.width * anchor;

    gsap.to(track, {
      x: maxOffset === 0 ? centeredOffset : -Math.max(0, Math.min(targetX, maxOffset)),
      duration: reducedMotion || isTransitionActive ? 0 : 1.1,
      ease: "power3.inOut",
    });
  }, [currentIndex, isTransitionActive, points, reducedMotion, trackWidth, viewportSize.width]);

  useLayoutEffect(() => {
    const traveler = travelerRef.current;

    if (!traveler || !currentPoint) {
      return;
    }

    if (!hasStarted || reducedMotion || isTransitionActive) {
      gsap.set(traveler, {
        x: currentPoint.x,
        y: currentPoint.y,
      });
      return;
    }

    gsap.to(traveler, {
      x: currentPoint.x,
      y: currentPoint.y,
      duration: 0.92,
      ease: "power2.inOut",
    });
  }, [currentPoint, hasStarted, isTransitionActive, reducedMotion]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const activePoint = points[currentIndex];

    if (
      !viewport ||
      !activePoint ||
      viewportSize.width === 0 ||
      viewportSize.height === 0 ||
      visibleSpotlightEvents.length === 0
    ) {
      return;
    }

    const sizesById = Object.fromEntries(
      visibleSpotlightEvents.flatMap((event) => {
        const card = spotlightRefs.current[event.id];

        if (!card) {
          return [];
        }

        return [
          [
            event.id,
            {
              width: card.offsetWidth || estimateSpotlightSize(viewportSize.width).width,
              height: card.offsetHeight || estimateSpotlightSize(viewportSize.width).height,
            },
          ] as const,
        ];
      }),
    );
    const nextLayouts = computeSpotlightLayouts({
      activePoint,
      events,
      points,
      sizesById,
      trackWidth,
      viewportHeight: viewportSize.height,
      viewportWidth: viewportSize.width,
      visibleSpotlightEvents,
    });

    const frameId = window.requestAnimationFrame(() => {
      setSpotlightLayouts((current) => (layoutsMatch(current, nextLayouts) ? current : nextLayouts));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    currentIndex,
    events,
    points,
    trackWidth,
    viewportSize.height,
    viewportSize.width,
    visibleSpotlightEvents,
  ]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const cards = viewport.querySelectorAll<HTMLElement>("[data-spotlight='true']");

    if (!cards.length) {
      return;
    }

    gsap.fromTo(
      cards,
      {
        opacity: 0,
        y: (index) => (index % 2 === 0 ? 24 : -24),
      },
      {
        opacity: 1,
        y: 0,
        duration: reducedMotion || isTransitionActive ? 0 : 0.6,
        stagger: reducedMotion || isTransitionActive ? 0 : 0.08,
        ease: "power2.out",
      },
    );
  }, [currentIndex, isTransitionActive, reducedMotion, tab.key, visibleSpotlightEvents.length]);

  useLayoutEffect(() => {
    if (!detailRef.current || !isDetailOpen) {
      return;
    }

    gsap.fromTo(
      detailRef.current,
      {
        opacity: 0,
        y: 18,
      },
      {
        opacity: 1,
        y: 0,
        duration: reducedMotion ? 0 : 0.4,
        ease: "power2.out",
      },
    );
  }, [detailEvent, isDetailOpen, reducedMotion]);

  if (events.length === 0 || !currentEvent) {
    return (
      <section className={styles.emptyState}>
        <p className={styles.emptyEyebrow}>{tab.label}</p>
        <h2>{tab.emptyState}</h2>
        <p>Publish a timeline event in Sanity or generate draft candidates from the intake workspace.</p>
      </section>
    );
  }

  return (
    <section className={styles.experience}>
      <div className={`${styles.introScreen} ${hasStarted ? styles.introHidden : ""}`}>
        <div className={styles.wordmark}>
          <h1>{tab.key === "full_story" ? profile.name : tab.label}</h1>
          {tab.key === "full_story" ? <p className={styles.wordmarkRole}>{profile.role}</p> : null}
          <svg
            className={styles.wordmarkLine}
            viewBox="0 0 360 120"
            aria-hidden="true"
          >
            <path d="M16 34 C 82 6, 146 22, 182 44 S 250 78, 344 108" />
            <path d="M48 18 C 118 28, 128 36, 160 54" />
          </svg>
        </div>

        <p className={styles.introChapter}>{chapterLabel}</p>
        {tab.key === "full_story" && introSummary ? (
          <p className={styles.introSummary}>{introSummary}</p>
        ) : null}
        <p className={styles.introPrompt}>Press the space bar to begin the experience</p>
        <button type="button" className={styles.handButton} onClick={beginExperience}>
          Space Bar
        </button>
        <p className={styles.introMeta}>{introMeta}</p>
      </div>

      <div className={`${styles.stage} ${hasStarted ? styles.stageActive : ""}`}>
        <div className={styles.stageHeader}>
          <p className={styles.stageChapter}>{chapterLabel}</p>
          <p className={styles.stageProgress}>
            {String(currentIndex + 1).padStart(2, "0")} / {String(events.length).padStart(2, "0")}
          </p>
        </div>

        <div className={styles.viewportFrame}>
        <div
          className={styles.viewport}
          ref={viewportRef}
          onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
          onTouchEnd={(event) => {
            const endX = event.changedTouches[0]?.clientX;

            if (touchStartX === null || typeof endX !== "number") {
              return;
            }

            const delta = endX - touchStartX;

            if (Math.abs(delta) > 40) {
              if (!hasStarted) {
                beginExperience();
              } else {
                moveBy(delta < 0 ? 1 : -1);
              }
            }

            setTouchStartX(null);
          }}
        >
          <button
            type="button"
            className={`${styles.hotspot} ${styles.hotspotLeft}`}
            onClick={() => moveBy(-1)}
            aria-label="Move backward"
          />
          <button
            type="button"
            className={`${styles.hotspot} ${styles.hotspotRight}`}
            onClick={() => moveBy(1)}
            aria-label="Move forward"
          />

          <div className={styles.track} ref={trackRef} style={{ width: `${trackWidth}px` }}>
            <svg
              className={styles.ropeSvg}
              width={trackWidth}
              height="560"
              viewBox={`0 0 ${trackWidth} 560`}
              aria-hidden="true"
            >
              <path d={ropePath} className={styles.ropeShadow} />
              <path d={ropePath} className={styles.ropePath} data-timeline-rope-path="true" />
            </svg>

            {events.map((event, index) => {
              const point = points[index];
              const isActive = index === currentIndex;
              const isSpotlight = spotlightEvents.some((spotlight) => spotlight.id === event.id);

              return (
                <button
                  key={event.id}
                  type="button"
                  className={`${styles.node} ${isActive ? styles.nodeActive : ""} ${
                    isSpotlight ? styles.nodeSpotlight : ""
                  }`}
                  style={{
                    left: `${point?.x ?? 0}px`,
                    top: `${point?.y ?? 0}px`,
                  }}
                  data-timeline-active-node={isActive ? "true" : undefined}
                  onClick={() => jumpToIndex(index)}
                  aria-label={`${event.displayDate}: ${event.title}`}
                >
                  <span className={styles.nodeCore} />
                  <span className={styles.nodeLabel}>{event.displayDate}</span>
                </button>
              );
            })}

            {currentPoint ? (
              <div
                className={`${styles.traveler} ${isTransitionActive ? styles.travelerHidden : ""}`}
                ref={travelerRef}
                data-timeline-traveler="true"
                aria-hidden="true"
              >
                <div
                  className={`${styles.travelerInner} ${
                    hasStarted && !reducedMotion ? styles.travelerWalking : ""
                  }`}
                >
                  <span className={styles.travelerShadow} />
                  <svg
                    className={styles.travelerSvg}
                    viewBox="0 0 78 136"
                    aria-hidden="true"
                  >
                    <g className={styles.travelerFigure}>
                      <path
                        className={styles.travelerHair}
                        d="M14 33 L2 20 L18 20 L8 7 L26 14 L22 0 L36 11 L40 2 L50 14 L56 4 L61 18 L72 10 L69 27 L77 33 L67 42 L70 56 L58 52 L50 61 L32 61 L22 56 L15 65 L18 49 L7 46 L17 39 Z"
                      />
                      <path
                        className={styles.travelerHead}
                        d="M26 33 C21 37 17 45 17 55 C17 70 27 81 41 82 C52 83 61 79 67 70 L71 70 L75 66 L71 62 L76 57 L71 53 L69 43 C65 34 57 30 46 30 C37 30 30 31 26 33 Z"
                      />
                      <path className={styles.travelerFace} d="M22 49 C28 43 34 42 39 48" />
                      <path className={styles.travelerFace} d="M42 47 C48 42 55 42 61 48" />
                      <path className={styles.travelerFace} d="M50 61 C54 64 54 71 49 75" />
                      <path className={styles.travelerFace} d="M28 75 C36 83 51 83 60 73" />
                      <path className={styles.travelerFace} d="M30 73 C38 78 49 78 57 73" />
                      <ellipse className={styles.travelerFace} cx="31" cy="58" rx="10" ry="11" />
                      <ellipse className={styles.travelerFace} cx="49" cy="56" rx="10" ry="11" />
                      <circle className={styles.travelerPupil} cx="31" cy="58" r="2.9" />
                      <circle className={styles.travelerPupil} cx="49" cy="56" r="2.9" />
                      <path
                        className={styles.travelerTorso}
                        d="M42 82 C37 86 34 95 34 106 L34 118 C34 124 37 128 41 129 L40 132 L48 132 L47 116 L52 116 L53 132 L61 132 L59 129 C64 127 67 123 67 116 L67 92 C62 86 55 82 47 82 Z"
                      />
                      <path className={styles.travelerFace} d="M47 86 L41 97 L47 105" />
                      <path className={styles.travelerFace} d="M56 86 L62 97 L56 105" />
                      <path className={styles.travelerFace} d="M52 83 L52 104" />
                      <g className={styles.travelerArmBack}>
                        <path d="M40 92 C35 100 33 111 35 123" />
                      </g>
                      <g className={styles.travelerArmFront}>
                        <path d="M58 92 C62 101 63 112 61 124" />
                      </g>
                      <g className={styles.travelerLegBack}>
                        <path d="M47 116 C45 122 45 128 46 134" />
                        <path d="M46 134 L55 134" />
                      </g>
                      <g className={styles.travelerLegFront}>
                        <path d="M54 116 C57 123 58 129 59 134" />
                        <path d="M59 134 L69 132" />
                      </g>
                    </g>
                  </svg>
                </div>
              </div>
            ) : null}

            {visibleSpotlightEvents.map((event) => {
              const eventIndex = events.findIndex((entry) => entry.id === event.id);
              const point = points[eventIndex];
              const spotlightLayout = spotlightLayouts[event.id] ?? fallbackSpotlightLayouts[event.id];

              return (
                <article
                  key={event.id}
                  className={`${styles.spotlightCard} ${
                    spotlightLayout
                      ? spotlightLayout.placement === "left"
                        ? styles.spotlightLeft
                        : styles.spotlightRight
                      : ""
                  } ${detailEvent?.id === event.id ? styles.spotlightCardActive : ""}`}
                  style={{
                    left: `${spotlightLayout ? spotlightLayout.left : point?.x ?? 0}px`,
                    top: `${spotlightLayout ? spotlightLayout.top : point?.y ?? 0}px`,
                  }}
                  data-spotlight="true"
                  ref={(node) => {
                    spotlightRefs.current[event.id] = node;
                  }}
                >
                  <p className={styles.cardDate}>{event.displayDate}</p>
                  <h3>{event.title}</h3>
                  <p>{event.summary}</p>
                  <div className={styles.cardFooter}>
                    <span>
                      {event.children?.length ? `${event.children.length} nested items` : "Single milestone"}
                    </span>
                    <button
                      type="button"
                      className={styles.cardButton}
                      onClick={() => {
                        setDetailEventId(event.id);
                        setIsDetailOpen(true);
                      }}
                    >
                      Inspect
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        </div>

        <div className={styles.footerPanel}>
          <div className={styles.footerCopy}>
            <p className={styles.footerDate}>{detailEvent?.displayDate}</p>
            <h2>{detailEvent?.title}</h2>
            <p>{detailEvent?.summary}</p>
          </div>
          <div className={styles.footerControls}>
            <button
              type="button"
              className={styles.handButton}
              onClick={() => setIsDetailOpen((open) => !open)}
            >
              {isDetailOpen ? "Hide Detail" : "Open Detail"}
            </button>
            <button type="button" className={styles.handButton} onClick={() => moveBy(1)}>
              Next Step
            </button>
          </div>
          <p className={styles.footerHint}>
            {hasParallelMoment
              ? "This moment carries more than one strand of the story."
              : "Use space, arrows, scroll, or swipe to continue the journey."}
          </p>
        </div>

        {isDetailOpen && detailEvent ? (
          <div className={styles.detailPanel} ref={detailRef}>
            <p className={styles.detailLead}>{detailEvent.details}</p>

            {detailEvent.children?.length ? (
              <div className={styles.childList}>
                {detailEvent.children.map((child) => (
                  <article key={child.id} className={styles.childItem}>
                    <div>
                      <h4>{child.title}</h4>
                      {child.subtitle ? <p>{child.subtitle}</p> : null}
                    </div>
                    {child.detail ? <p>{child.detail}</p> : null}
                    {child.url ? (
                      <a href={child.url} target="_blank" rel="noreferrer">
                        Original paper
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}

            {detailEvent.links.length ? (
              <div className={styles.detailLinks}>
                {detailEvent.links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {currentIndex === events.length - 1 ? (
          <div className={styles.presentTeaser}>
            <p className={styles.presentMeta}>{profile.role}</p>
            <p className={styles.presentLead}>{profile.futureTeaser || tab.presentLabel}</p>
            {profile.note ? <p className={styles.presentNote}>{profile.note}</p> : null}
            <div className={styles.presentLinks}>
              {profile.socialLinks.map((link) => (
                isExternalLink(link.url) ? (
                  <a
                    key={link.url}
                    href={link.url}
                    target={link.url.startsWith("http") ? "_blank" : undefined}
                    rel={link.url.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.url} href={link.url}>
                    {link.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
