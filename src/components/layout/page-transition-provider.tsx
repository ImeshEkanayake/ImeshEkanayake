"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import { usePathname, useRouter } from "next/navigation";
import styles from "./page-transition-provider.module.css";

type TransitionPhase = "idle" | "outgoing" | "waiting";

interface TransitionState {
  phase: TransitionPhase;
  targetPath: string | null;
  ropeX: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  facing: "left" | "right";
}

interface PageTransitionContextValue {
  isTransitionActive: boolean;
  navigateWithRope: (path: string, triggerElement: HTMLElement) => void;
}

const initialTransitionState: TransitionState = {
  phase: "idle",
  targetPath: null,
  ropeX: 0,
  startX: 0,
  startY: 0,
  targetX: 0,
  targetY: 0,
  facing: "right",
};

const pageTransitionContext = createContext<PageTransitionContextValue>({
  isTransitionActive: false,
  navigateWithRope: () => undefined,
});

function getTimelineTravelerRect() {
  return document.querySelector<HTMLElement>("[data-timeline-traveler='true']")?.getBoundingClientRect() ?? null;
}

function getRectCenterX(rect: DOMRect) {
  return rect.left + rect.width / 2;
}

function getRectCenterY(rect: DOMRect) {
  return rect.top + rect.height / 2;
}

function getSiteShell() {
  return document.querySelector<HTMLElement>(".site-shell");
}

function getSiteShellEdge() {
  return document.querySelector<HTMLElement>(".site-shell-edge");
}

function getTimelineActiveNodeRect() {
  return document.querySelector<HTMLElement>("[data-timeline-active-node='true']")?.getBoundingClientRect() ?? null;
}

function getTimelineRopePointAtScreenX(screenX: number) {
  const path = document.querySelector<SVGPathElement>("[data-timeline-rope-path='true']");
  const svg = path?.ownerSVGElement;

  if (!path || !svg) {
    return null;
  }

  const rect = svg.getBoundingClientRect();
  const localX = screenX - rect.left;
  const totalLength = path.getTotalLength();
  const steps = Math.max(160, Math.round(totalLength / 18));
  let bestPoint = path.getPointAtLength(0);
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let step = 0; step <= steps; step += 1) {
    const point = path.getPointAtLength((totalLength * step) / steps);
    const delta = Math.abs(point.x - localX);

    if (delta < bestDelta) {
      bestDelta = delta;
      bestPoint = point;
    }
  }

  return {
    x: rect.left + bestPoint.x,
    y: rect.top + bestPoint.y,
  };
}

function resetTravelerModes(node: HTMLDivElement | null) {
  if (!node) {
    return;
  }

  node.classList.remove(
    styles.travelerWalking,
    styles.travelerHanging,
    styles.travelerParachuting,
    styles.travelerDropping,
  );
}

function setTravelerMode(node: HTMLDivElement | null, className: string) {
  if (!node) {
    return;
  }

  resetTravelerModes(node);
  node.classList.add(className);
}

const travelerAnchor = {
  xPercent: -50,
  yPercent: -100,
};

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const ropeRef = useRef<HTMLDivElement>(null);
  const travelerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [transition, setTransition] = useState(initialTransitionState);
  const transitionRef = useRef(initialTransitionState);

  useEffect(() => {
    transitionRef.current = transition;
  }, [transition]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (transition.phase !== "idle") {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [transition.phase]);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  const navigateWithRope = (path: string, triggerElement: HTMLElement) => {
    if (transitionRef.current.phase !== "idle" || path === pathname) {
      return;
    }

    const travelerRect = getTimelineTravelerRect();

    if (!travelerRect) {
      router.push(path);
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const ropeX = getRectCenterX(triggerRect);
    const startX = getRectCenterX(travelerRect);
    const startY = travelerRect.bottom - 2;

    router.prefetch(path);

    setTransition({
      phase: "outgoing",
      targetPath: path,
      ropeX,
      startX,
      startY,
      targetX: 0,
      targetY: 0,
      facing: ropeX >= startX ? "right" : "left",
    });
  };

  useLayoutEffect(() => {
    if (transition.phase !== "outgoing") {
      return;
    }

    const overlay = overlayRef.current;
    const rope = ropeRef.current;
    const traveler = travelerRef.current;
    const pageEdge = getSiteShellEdge();

    if (!overlay || !rope || !traveler || !transition.targetPath) {
      return;
    }

    timelineRef.current?.kill();
    resetTravelerModes(traveler);

    const walkStartPoint = getTimelineRopePointAtScreenX(transition.startX) ?? {
      x: transition.startX,
      y: transition.startY,
    };
    const ropeGroundPoint = getTimelineRopePointAtScreenX(transition.ropeX) ?? {
      x: transition.ropeX,
      y: walkStartPoint.y,
    };
    const ropeCatchY = ropeGroundPoint.y;
    const walkDistance = Math.abs(ropeGroundPoint.x - walkStartPoint.x);
    const walkDuration = Math.min(Math.max(walkDistance / 520, 0.44), 1.05);
    const ropeDropDuration = 0.72;
    const walkStart = ropeDropDuration - 0.02;
    const catchStart = walkStart + walkDuration;
    const walkingFacing = ropeGroundPoint.x >= walkStartPoint.x ? 1 : -1;

    gsap.set(overlay, { autoAlpha: 1 });
    gsap.set(pageEdge, { opacity: 0 });
    gsap.set(rope, {
      left: transition.ropeX,
      height: 0,
      opacity: 1,
      transformOrigin: "top center",
    });
    gsap.set(traveler, {
      ...travelerAnchor,
      x: walkStartPoint.x,
      y: walkStartPoint.y,
      scaleX: walkingFacing,
    });

    setTravelerMode(traveler, styles.travelerWalking);

    const walkState = { x: walkStartPoint.x };

    const tl = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        window.requestAnimationFrame(() => {
          setTransition((current) =>
            current.phase === "outgoing"
              ? {
                  ...current,
                  phase: "waiting",
                }
              : current,
          );
          router.push(transition.targetPath!);
        });
      },
    });

    tl.to(
      rope,
      {
        height: ropeCatchY,
        duration: ropeDropDuration,
        ease: "bounce.out",
      },
      0,
    );
    tl.to(
      walkState,
      {
        x: ropeGroundPoint.x,
        duration: walkDuration,
        ease: "none",
        onUpdate: () => {
          const ropePoint = getTimelineRopePointAtScreenX(walkState.x) ?? {
            x: walkState.x,
            y: walkStartPoint.y,
          };

          gsap.set(traveler, {
            ...travelerAnchor,
            x: ropePoint.x,
            y: ropePoint.y,
            scaleX: walkingFacing,
          });
        },
      },
      walkStart,
    );
    tl.call(() => {
      setTravelerMode(traveler, styles.travelerHanging);
      gsap.set(traveler, { scaleX: 1 });
    }, [], catchStart);
    tl.to(
      traveler,
      {
        x: transition.ropeX,
        y: ropeCatchY - 10,
        duration: 0.28,
        ease: "power2.out",
      },
      catchStart,
    );
    tl.to(
      rope,
      {
        height: ropeCatchY + 16,
        duration: 0.18,
        ease: "power1.out",
      },
      catchStart + 0.12,
    );

    timelineRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [router, transition]);

  useLayoutEffect(() => {
    if (transition.phase !== "waiting" || transition.targetPath !== pathname) {
      return;
    }

    const overlay = overlayRef.current;
    const rope = ropeRef.current;
    const traveler = travelerRef.current;
    const siteShell = getSiteShell();
    const pageEdge = getSiteShellEdge();

    if (!overlay || !pageEdge || !rope || !traveler || !siteShell) {
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let incomingTimeline: gsap.core.Timeline | null = null;

    const resolveTarget = () => {
      if (cancelled) {
        return;
      }

      const activeNodeRect = getTimelineActiveNodeRect();
      const travelerRect = getTimelineTravelerRect();
      const targetX = activeNodeRect ? getRectCenterX(activeNodeRect) : travelerRect ? getRectCenterX(travelerRect) : null;
      const targetY = activeNodeRect
        ? getRectCenterY(activeNodeRect)
        : travelerRect
          ? travelerRect.bottom - 2
          : null;

      if (targetX === null || targetY === null) {
        rafId = window.requestAnimationFrame(resolveTarget);
        return;
      }

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const skyEntryY = -Math.max(240, viewportHeight * 0.24);
      const initialPageY = -viewportHeight;
      const initialPageBottom = initialPageY + viewportHeight;
      const currentTravelerY = parseFloat(String(gsap.getProperty(traveler, "y"))) || 0;
      const currentRopeHeight = parseFloat(String(gsap.getProperty(rope, "height"))) || 0;
      const hangingLength = Math.max(
        currentTravelerY - initialPageBottom,
        currentRopeHeight,
        Math.min(Math.max(viewportHeight * 0.26, 180), 260),
      );
      const pullState = {
        pageY: initialPageY,
      };
      const parachuteStart = 1.0;
      const parachuteDuration = 1.56;
      const parachuteEntryX = targetX + Math.min(Math.max(viewportWidth * 0.03, 16), 34);

      const renderPullFrame = () => {
        gsap.set(siteShell, { y: pullState.pageY });
        gsap.set(rope, {
          left: transition.ropeX,
          top: pullState.pageY + viewportHeight,
          height: hangingLength,
          opacity: 1,
        });
        gsap.set(traveler, {
          ...travelerAnchor,
          x: transition.ropeX,
          y: pullState.pageY + viewportHeight + hangingLength,
          scaleX: 1,
          autoAlpha: 1,
        });
      };

      gsap.set(overlay, { autoAlpha: 1 });
      gsap.set(pageEdge, {
        top: viewportHeight,
        opacity: 1,
      });
      setTravelerMode(traveler, styles.travelerHanging);
      renderPullFrame();

      incomingTimeline = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          resetTravelerModes(traveler);
          gsap.set(siteShell, { clearProps: "transform" });
          gsap.set(overlay, { autoAlpha: 0 });
          gsap.set(pageEdge, { clearProps: "all" });
          gsap.set(rope, { clearProps: "all" });
          window.requestAnimationFrame(() => setTransition(initialTransitionState));
        },
      });

      incomingTimeline.to(
        pullState,
        {
          pageY: 0,
          duration: 1.02,
          ease: "power4.inOut",
          onUpdate: renderPullFrame,
        },
        0,
      );
      incomingTimeline.call(() => {
        gsap.set(traveler, {
          ...travelerAnchor,
          x: parachuteEntryX,
          y: skyEntryY,
          scaleX: 1,
          autoAlpha: 1,
        });
        gsap.set(pageEdge, { opacity: 0 });
        gsap.set(rope, { opacity: 0 });
        setTravelerMode(traveler, styles.travelerParachuting);
      }, [], parachuteStart);
      incomingTimeline.to(
        traveler,
        {
          x: targetX,
          y: targetY,
          duration: parachuteDuration,
          ease: "sine.out",
        },
        parachuteStart,
      );
    };

    gsap.set(overlay, { autoAlpha: 1 });

    rafId = window.requestAnimationFrame(resolveTarget);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      incomingTimeline?.kill();
    };
  }, [pathname, transition.phase, transition.ropeX, transition.targetPath]);
  const contextValue = {
    isTransitionActive: transition.phase !== "idle",
    navigateWithRope,
  };

  return (
    <pageTransitionContext.Provider value={contextValue}>
      {children}

      <div className={styles.overlay} ref={overlayRef} aria-hidden="true">
        <div className={styles.rope} ref={ropeRef} />

        <div className={styles.traveler} ref={travelerRef}>
          <div className={styles.travelerStanding}>
            <svg className={styles.travelerSvg} viewBox="0 0 78 136">
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

          <div className={styles.travelerHangingPose}>
            <svg className={styles.hangingSvg} viewBox="0 0 120 180">
              <path className={styles.hangingRope} d="M62 0 L62 88" />
              <path
                className={styles.travelerHair}
                d="M30 40 L18 28 L34 28 L24 15 L42 22 L38 8 L52 19 L56 10 L66 22 L72 12 L77 26 L88 18 L85 35 L93 41 L83 50 L86 64 L74 60 L66 69 L48 69 L38 64 L31 73 L34 57 L23 54 L33 47 Z"
              />
              <path
                className={styles.hangingHead}
                d="M41 40 C36 44 32 52 32 62 C32 77 42 88 56 89 C67 90 76 86 82 77 L86 77 L90 73 L86 69 L91 64 L86 60 L84 50 C80 41 72 37 61 37 C52 37 45 38 41 40 Z"
              />
              <path className={styles.travelerFace} d="M38 57 C44 51 50 50 55 56" />
              <path className={styles.travelerFace} d="M58 55 C64 50 71 50 77 56" />
              <path className={styles.travelerFace} d="M66 69 C70 72 70 79 65 82" />
              <path className={styles.travelerFace} d="M44 82 C52 90 67 90 76 80" />
              <ellipse className={styles.travelerFace} cx="47" cy="66" rx="9" ry="10" />
              <ellipse className={styles.travelerFace} cx="64" cy="64" rx="9" ry="10" />
              <circle className={styles.travelerPupil} cx="47" cy="66" r="2.6" />
              <circle className={styles.travelerPupil} cx="64" cy="64" r="2.6" />
              <path
                className={styles.hangingTorso}
                d="M56 89 C50 93 46 103 46 115 L46 127 C46 133 49 137 54 139 L53 144 L62 144 L61 129 L66 129 L67 144 L76 144 L74 139 C79 137 82 133 82 126 L82 100 C76 93 69 89 61 89 Z"
              />
              <path className={styles.hangingArm} d="M55 99 C50 89 49 74 50 58" />
              <path className={styles.hangingArm} d="M72 99 C77 89 78 74 78 58" />
              <path className={styles.hangingLeg} d="M61 129 C59 139 59 150 61 160" />
              <path className={styles.hangingLeg} d="M68 129 C78 136 84 143 93 149" />
            </svg>
          </div>

          <div className={styles.travelerParachutePose}>
            <svg className={styles.parachuteSvg} viewBox="0 0 240 320">
              <path
                className={styles.parachuteCanopy}
                d="M26 88 C34 48 62 20 88 14 C104 10 118 10 120 10 C122 10 136 10 152 14 C178 20 206 48 214 88 C208 100 198 108 186 116 C176 92 150 76 120 76 C90 76 64 92 54 116 C42 108 32 100 26 88 Z"
              />
              <path className={styles.parachutePanel} d="M52 28 C60 54 64 82 64 112" />
              <path className={styles.parachutePanel} d="M82 16 C90 46 94 74 94 108" />
              <path className={styles.parachutePanel} d="M120 12 C120 44 120 72 120 104" />
              <path className={styles.parachutePanel} d="M158 16 C150 46 146 74 146 108" />
              <path className={styles.parachutePanel} d="M188 28 C180 54 176 82 176 112" />
              <path className={styles.parachuteLine} d="M60 112 L101 176" />
              <path className={styles.parachuteLine} d="M95 108 L111 176" />
              <path className={styles.parachuteLine} d="M145 108 L129 176" />
              <path className={styles.parachuteLine} d="M180 112 L139 176" />

              <g className={styles.parachuteTravelerGroup}>
                <path
                  className={styles.travelerHair}
                  d="M92 152 L78 136 L96 136 L84 121 L105 129 L100 113 L116 126 L121 116 L133 129 L140 118 L146 134 L159 124 L156 144 L166 151 L154 161 L158 178 L144 173 L135 184 L114 184 L102 178 L94 189 L97 169 L84 165 L96 158 Z"
                />
                <path
                  className={styles.travelerHead}
                  d="M105 151 C99 155 94 164 94 176 C94 193 106 206 122 207 C135 208 145 203 151 194 L156 194 L160 189 L156 185 L161 179 L156 175 L154 164 C150 154 141 149 128 149 C118 149 110 149 105 151 Z"
                />
                <path className={styles.travelerFace} d="M100 169 C107 162 115 161 121 168" />
                <path className={styles.travelerFace} d="M125 167 C132 161 141 161 148 168" />
                <path className={styles.travelerFace} d="M136 182 C141 186 141 194 135 199" />
                <path className={styles.travelerFace} d="M108 198 C118 209 136 209 147 196" />
                <path className={styles.travelerFace} d="M111 196 C120 201 134 201 144 195" />
                <ellipse className={styles.travelerFace} cx="111" cy="178" rx="12" ry="13" />
                <ellipse className={styles.travelerFace} cx="134" cy="176" rx="12" ry="13" />
                <circle className={styles.travelerPupil} cx="111" cy="178" r="3.4" />
                <circle className={styles.travelerPupil} cx="134" cy="176" r="3.4" />
                <path
                  className={styles.travelerTorso}
                  d="M122 207 C114 212 109 223 109 237 L109 252 C109 260 113 266 119 268 L118 276 L129 276 L127 253 L134 253 L135 276 L146 276 L143 268 C149 266 153 260 153 251 L153 220 C146 212 137 207 127 207 Z"
                />
                <path className={styles.travelerFace} d="M127 216 L120 231 L127 241" />
                <path className={styles.travelerFace} d="M139 216 L146 231 L139 241" />
                <path className={styles.travelerFace} d="M133 209 L133 231" />
                <path className={styles.parachuteArm} d="M121 221 C114 208 113 191 115 173" />
                <path className={styles.parachuteArm} d="M140 221 C148 209 153 194 157 176" />
                <path className={styles.parachuteHand} d="M109 170 L115 173" />
                <path className={styles.parachuteHand} d="M155 173 L161 170" />
                <path className={styles.parachuteLeg} d="M127 253 C125 261 125 269 126 277" />
                <path className={styles.parachuteLeg} d="M126 277 L138 277" />
                <path className={styles.parachuteLeg} d="M136 253 C140 262 143 270 146 277" />
                <path className={styles.parachuteLeg} d="M146 277 L158 273" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </pageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  return useContext(pageTransitionContext);
}
