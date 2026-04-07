import type { TimelinePoint } from "./types";

const HORIZONTAL_STEP = 308;
const HORIZONTAL_PADDING = 220;
const MIN_HORIZONTAL_STEP = 220;
const MIN_HORIZONTAL_PADDING = 96;
const VIEWPORT_GUTTER = 24;
const BASELINE_Y = 284;

function resolveTimelineSpacing(count: number, viewportWidth?: number) {
  if (!viewportWidth || count <= 1) {
    return {
      step: HORIZONTAL_STEP,
      padding: HORIZONTAL_PADDING,
    };
  }

  const maxWidth = Math.max(viewportWidth - VIEWPORT_GUTTER, 0);
  const preferredWidth = HORIZONTAL_PADDING * 2 + (count - 1) * HORIZONTAL_STEP;

  if (preferredWidth <= maxWidth) {
    return {
      step: HORIZONTAL_STEP,
      padding: HORIZONTAL_PADDING,
    };
  }

  const compressedStep = (maxWidth - HORIZONTAL_PADDING * 2) / (count - 1);

  if (compressedStep >= MIN_HORIZONTAL_STEP) {
    return {
      step: compressedStep,
      padding: HORIZONTAL_PADDING,
    };
  }

  return {
    step: MIN_HORIZONTAL_STEP,
    padding: Math.max(MIN_HORIZONTAL_PADDING, (maxWidth - MIN_HORIZONTAL_STEP * (count - 1)) / 2),
  };
}

export function buildTimelinePoints(count: number, viewportWidth?: number): TimelinePoint[] {
  const { step, padding } = resolveTimelineSpacing(count, viewportWidth);

  return Array.from({ length: count }, (_, index) => {
    const x = padding + index * step;
    const y =
      BASELINE_Y +
      Math.sin(index * 0.82) * 72 +
      Math.cos(index * 0.36) * 24 +
      (index % 3 === 0 ? -18 : 18);

    return { x, y };
  });
}

export function getTrackWidth(count: number, viewportWidth?: number) {
  const { step, padding } = resolveTimelineSpacing(count, viewportWidth);

  if (count <= 0) {
    return padding * 2;
  }

  return padding * 2 + (count - 1) * step;
}

export function buildRopePath(points: TimelinePoint[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = current.x + (next.x - current.x) / 2;

    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}
