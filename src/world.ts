import type { BodyKind, BodySpec, PlaygroundConfig } from './config';
import {
  aabbVsAabb,
  circleVsCircle,
  pointInAabb,
  pointInCircle,
  type Aabb,
  type AabbResult,
  type Circle,
  type CircleResult,
} from './geometry';

export type Mode = 'aabb' | 'circle';

export interface Body {
  id: number;
  kind: BodyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  label: string;
}

export interface PairState {
  key: string;
  a: Body;
  b: Body;
  colliding: boolean;
  depth: number;
  /** Human-readable axis/normal description for the dashboard. */
  axisLabel: string;
  aabb?: AabbResult;
  circle?: CircleResult;
}

export interface EvaluateSummary {
  pairs: PairState[];
  collidingBodies: Set<number>;
  currentCollisions: number;
}

/** The AABB used for a body under AABB mode (circles use their bounding square). */
export function bodyAabb(body: Body): Aabb {
  if (body.kind === 'rect') return { x: body.x, y: body.y, w: body.w, h: body.h };
  return { x: body.x, y: body.y, w: body.r * 2, h: body.r * 2 };
}

/** The circle used for a body under circle mode (rects use their circumscribed circle). */
export function bodyCircle(body: Body): Circle {
  if (body.kind === 'circle') return { x: body.x, y: body.y, r: body.r };
  return { x: body.x, y: body.y, r: Math.hypot(body.w, body.h) / 2 };
}

export class World {
  readonly bodies: Body[] = [];
  mode: Mode = 'aabb';
  /** Cumulative count of pair-enter collision events (edge triggered). */
  totalCollisionEvents = 0;

  private nextId = 1;
  private nextLabelIndex = 0;
  private previouslyColliding = new Set<string>();

  constructor(private readonly cfg: PlaygroundConfig) {
    this.reset();
  }

  reset(): void {
    this.bodies.length = 0;
    this.nextId = 1;
    this.nextLabelIndex = 0;
    this.totalCollisionEvents = 0;
    this.previouslyColliding.clear();
    for (const spec of this.cfg.initialScene) this.spawn(spec);
  }

  private nextLabel(): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const label = alphabet[this.nextLabelIndex % alphabet.length] ?? '?';
    this.nextLabelIndex += 1;
    return label;
  }

  private spawn(spec: BodySpec): Body {
    const body: Body = {
      id: this.nextId++,
      kind: spec.kind,
      x: spec.x,
      y: spec.y,
      w: spec.w ?? this.cfg.newBody.rectW,
      h: spec.h ?? this.cfg.newBody.rectH,
      r: spec.r ?? this.cfg.newBody.radius,
      label: spec.label || this.nextLabel(),
    };
    this.nextLabelIndex = Math.max(
      this.nextLabelIndex,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(body.label) + 1,
    );
    this.bodies.push(body);
    return body;
  }

  /** Add a body near the canvas center; returns null when at the configured cap. */
  addBody(kind: BodyKind): Body | null {
    if (this.bodies.length >= this.cfg.maxBodies) return null;
    const { width, height } = this.cfg.canvas;
    const jitter = (this.bodies.length % 5) * 24;
    return this.spawn({
      kind,
      x: width / 2 + jitter - 48,
      y: height / 2 + jitter - 48,
      label: this.nextLabel(),
    });
  }

  removeLast(): Body | null {
    if (this.bodies.length === 0) return null;
    return this.bodies.pop() ?? null;
  }

  /** Topmost body containing the point (last drawn wins). */
  bodyAt(x: number, y: number): Body | null {
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const body = this.bodies[i];
      if (!body) continue;
      const hit =
        body.kind === 'rect'
          ? pointInAabb(x, y, bodyAabb(body))
          : pointInCircle(x, y, bodyCircle(body));
      if (hit) return body;
    }
    return null;
  }

  /** Clamp a body's center inside the canvas. */
  moveBody(body: Body, x: number, y: number): void {
    const { width, height } = this.cfg.canvas;
    body.x = Math.min(width, Math.max(0, x));
    body.y = Math.min(height, Math.max(0, y));
  }

  /** Evaluate every unordered pair under the current mode and update event counters. */
  evaluate(): EvaluateSummary {
    const pairs: PairState[] = [];
    const collidingBodies = new Set<number>();
    const nowColliding = new Set<string>();

    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const a = this.bodies[i];
        const b = this.bodies[j];
        if (!a || !b) continue;
        const key = `${a.id}-${b.id}`;
        let state: PairState;
        if (this.mode === 'aabb') {
          const res = aabbVsAabb(bodyAabb(a), bodyAabb(b));
          state = {
            key,
            a,
            b,
            colliding: res.colliding,
            depth: res.depth,
            axisLabel: res.colliding ? `min axis ${res.axis}` : `separated on ${res.axis}`,
            aabb: res,
          };
        } else {
          const res = circleVsCircle(bodyCircle(a), bodyCircle(b));
          state = {
            key,
            a,
            b,
            colliding: res.colliding,
            depth: res.depth,
            axisLabel: `n=(${res.normal.x.toFixed(2)}, ${res.normal.y.toFixed(2)})`,
            circle: res,
          };
        }
        if (state.colliding) {
          collidingBodies.add(a.id).add(b.id);
          nowColliding.add(key);
          if (!this.previouslyColliding.has(key)) this.totalCollisionEvents += 1;
        }
        pairs.push(state);
      }
    }

    this.previouslyColliding = nowColliding;
    return { pairs, collidingBodies, currentCollisions: nowColliding.size };
  }
}
