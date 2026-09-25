/** Pure collision math — the unit-tested heart of the playground. */

/** Axis-aligned box described by its center and full width/height. */
export interface Aabb {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface AabbResult {
  colliding: boolean;
  /** Overlap extent along each axis (negative = separation gap). */
  overlapX: number;
  overlapY: number;
  /** Penetration depth: the smaller positive overlap, 0 when apart. */
  depth: number;
  /** The separating axis — the axis of minimum overlap. */
  axis: 'x' | 'y';
}

export interface CircleResult {
  colliding: boolean;
  /** Center distance. */
  distance: number;
  /** r1 + r2 − distance, clamped at 0 when apart. */
  depth: number;
  /** Unit vector from a's center toward b's center (x-axis fallback when concentric). */
  normal: { x: number; y: number };
}

/**
 * AABB vs AABB with penetration info.
 * Exactly touching edges (overlap 0) count as NOT colliding.
 */
export function aabbVsAabb(a: Aabb, b: Aabb): AabbResult {
  const overlapX = (a.w + b.w) / 2 - Math.abs(b.x - a.x);
  const overlapY = (a.h + b.h) / 2 - Math.abs(b.y - a.y);
  const colliding = overlapX > 0 && overlapY > 0;
  const axis: 'x' | 'y' = overlapX < overlapY ? 'x' : 'y';
  return {
    colliding,
    overlapX,
    overlapY,
    depth: colliding ? Math.min(overlapX, overlapY) : 0,
    axis,
  };
}

/**
 * Circle vs circle with penetration info.
 * Exactly touching (distance === r1 + r2) counts as NOT colliding.
 */
export function circleVsCircle(a: Circle, b: Circle): CircleResult {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  const depth = Math.max(0, a.r + b.r - distance);
  const colliding = distance < a.r + b.r;
  const normal =
    distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 };
  return { colliding, distance, depth: colliding ? depth : 0, normal };
}

export function pointInAabb(px: number, py: number, box: Aabb): boolean {
  return (
    Math.abs(px - box.x) <= box.w / 2 && Math.abs(py - box.y) <= box.h / 2
  );
}

export function pointInCircle(px: number, py: number, c: Circle): boolean {
  return Math.hypot(px - c.x, py - c.y) <= c.r;
}
