import { describe, expect, it } from 'vitest';
import { defaultConfig, type PlaygroundConfig } from '../src/config';
import { World, bodyAabb, bodyCircle } from '../src/world';

function makeConfig(overrides: Partial<PlaygroundConfig> = {}): PlaygroundConfig {
  return { ...defaultConfig, ...overrides };
}

const emptyScene = makeConfig({ initialScene: [] });

describe('pair enumeration', () => {
  it('evaluates n(n-1)/2 unordered pairs', () => {
    const world = new World(defaultConfig); // 4 bodies
    expect(world.evaluate().pairs).toHaveLength(6);
  });

  it('reports zero pairs with fewer than two bodies', () => {
    const world = new World(emptyScene);
    expect(world.evaluate().pairs).toHaveLength(0);
    world.addBody('rect');
    expect(world.evaluate().pairs).toHaveLength(0);
  });
});

describe('collision event counter (edge triggered)', () => {
  function twoRects(): World {
    const world = new World(
      makeConfig({
        initialScene: [
          { kind: 'rect', x: 100, y: 100, w: 50, h: 50, label: 'A' },
          { kind: 'rect', x: 300, y: 100, w: 50, h: 50, label: 'B' },
        ],
      }),
    );
    return world;
  }

  it('counts enter events once, not per frame', () => {
    const world = twoRects();
    world.evaluate();
    expect(world.totalCollisionEvents).toBe(0);

    const [a, b] = world.bodies;
    world.moveBody(b!, a!.x + 20, a!.y); // overlap
    world.evaluate();
    world.evaluate();
    world.evaluate();
    expect(world.totalCollisionEvents).toBe(1);
  });

  it('increments again after separation and re-entry', () => {
    const world = twoRects();
    const [a, b] = world.bodies;
    world.moveBody(b!, a!.x + 10, a!.y);
    world.evaluate(); // enter 1
    world.moveBody(b!, a!.x + 400, a!.y);
    world.evaluate(); // exit
    world.moveBody(b!, a!.x + 10, a!.y);
    world.evaluate(); // enter 2
    expect(world.totalCollisionEvents).toBe(2);
  });
});

describe('mode differences', () => {
  it('two rects can overlap as AABBs but not as bounding circles... and vice versa', () => {
    // Diagonal placement: AABBs overlap on both axes only if close;
    // circumscribed circles reach further into corners.
    const world = new World(
      makeConfig({
        initialScene: [
          { kind: 'rect', x: 100, y: 100, w: 80, h: 80, label: 'A' },
          { kind: 'rect', x: 190, y: 190, w: 80, h: 80, label: 'B' },
        ],
      }),
    );
    world.mode = 'aabb';
    const aabbResult = world.evaluate().pairs[0]!;
    // Corner gap: AABB overlap requires |dx| < 80 and |dy| < 80 → 90 apart → no hit.
    expect(aabbResult.colliding).toBe(false);

    world.mode = 'circle';
    const circleResult = world.evaluate().pairs[0]!;
    // Circumscribed radius = hypot(80,80)/2 ≈ 56.6 → sum ≈ 113 > dist ≈ 127? No…
    // dist = hypot(90,90) ≈ 127.3 → still clear; move closer to show the flip.
    expect(circleResult.colliding).toBe(false);

    const [, b] = world.bodies;
    world.moveBody(b!, 185, 185); // dist ≈ 120.2 > 80: AABB still clear on neither axis? |dx|=85 ≥ 80 → clear
    world.mode = 'aabb';
    expect(world.evaluate().pairs[0]!.colliding).toBe(false);
    world.mode = 'circle';
    // dist ≈ 120.2 vs radius sum ≈ 113.1 → still clear; 175 gives dist ≈ 106 < 113 → hit.
    world.moveBody(b!, 175, 175);
    expect(world.evaluate().pairs[0]!.colliding).toBe(true);
    world.mode = 'aabb';
    expect(world.evaluate().pairs[0]!.colliding).toBe(true); // |dx|=75 < 80 both axes
  });

  it('bodyAabb and bodyCircle derive the mode shapes', () => {
    const world = new World(emptyScene);
    const rect = world.addBody('rect')!;
    const circle = world.addBody('circle')!;
    expect(bodyAabb(circle).w).toBeCloseTo(circle.r * 2);
    expect(bodyCircle(rect).r).toBeCloseTo(Math.hypot(rect.w, rect.h) / 2);
  });
});

describe('body management', () => {
  it('enforces the configured body cap', () => {
    const world = new World(makeConfig({ initialScene: [], maxBodies: 3 }));
    expect(world.addBody('rect')).not.toBeNull();
    expect(world.addBody('circle')).not.toBeNull();
    expect(world.addBody('rect')).not.toBeNull();
    expect(world.addBody('rect')).toBeNull();
    expect(world.bodies).toHaveLength(3);
  });

  it('reset restores the initial scene and clears counters', () => {
    const world = new World(defaultConfig);
    const [a, b] = world.bodies;
    world.moveBody(b!, a!.x, a!.y);
    world.evaluate();
    expect(world.totalCollisionEvents).toBeGreaterThan(0);
    world.reset();
    expect(world.bodies).toHaveLength(defaultConfig.initialScene.length);
    expect(world.totalCollisionEvents).toBe(0);
  });

  it('moveBody clamps to canvas bounds', () => {
    const world = new World(defaultConfig);
    const body = world.bodies[0]!;
    world.moveBody(body, -50, 99999);
    expect(body.x).toBe(0);
    expect(body.y).toBe(defaultConfig.canvas.height);
  });

  it('bodyAt returns the topmost (last) body under the point', () => {
    const world = new World(
      makeConfig({
        initialScene: [
          { kind: 'rect', x: 100, y: 100, w: 60, h: 60, label: 'A' },
          { kind: 'rect', x: 100, y: 100, w: 60, h: 60, label: 'B' },
        ],
      }),
    );
    expect(world.bodyAt(100, 100)?.label).toBe('B');
    expect(world.bodyAt(400, 400)).toBeNull();
  });
});
