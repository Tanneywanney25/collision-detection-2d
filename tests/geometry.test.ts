import { describe, expect, it } from 'vitest';
import { aabbVsAabb, circleVsCircle, pointInAabb, pointInCircle } from '../src/geometry';

describe('aabbVsAabb overlap', () => {
  it('detects a plain overlap', () => {
    const res = aabbVsAabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 8, y: 0, w: 10, h: 10 });
    expect(res.colliding).toBe(true);
  });

  it('returns false when separated on x', () => {
    const res = aabbVsAabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 30, y: 0, w: 10, h: 10 });
    expect(res.colliding).toBe(false);
    expect(res.depth).toBe(0);
  });

  it('exactly touching edges do NOT collide', () => {
    // Centers 10 apart, widths 10 each → edges kiss (overlapX === 0).
    const res = aabbVsAabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 });
    expect(res.overlapX).toBe(0);
    expect(res.colliding).toBe(false);
  });

  it('containment collides with depth from the smaller extent', () => {
    const res = aabbVsAabb({ x: 0, y: 0, w: 100, h: 100 }, { x: 0, y: 0, w: 10, h: 20 });
    expect(res.colliding).toBe(true);
    expect(res.depth).toBeGreaterThan(0);
  });

  it('is symmetric', () => {
    const a = { x: 5, y: 2, w: 12, h: 6 };
    const b = { x: 11, y: 4, w: 8, h: 10 };
    const ab = aabbVsAabb(a, b);
    const ba = aabbVsAabb(b, a);
    expect(ab.colliding).toBe(ba.colliding);
    expect(ab.depth).toBeCloseTo(ba.depth);
  });
});

describe('circleVsCircle overlap', () => {
  it('detects overlap when centers are closer than the radius sum', () => {
    const res = circleVsCircle({ x: 0, y: 0, r: 10 }, { x: 15, y: 0, r: 10 });
    expect(res.colliding).toBe(true);
    expect(res.depth).toBeCloseTo(5);
  });

  it('exactly touching circles do NOT collide', () => {
    const res = circleVsCircle({ x: 0, y: 0, r: 10 }, { x: 20, y: 0, r: 10 });
    expect(res.distance).toBeCloseTo(20);
    expect(res.colliding).toBe(false);
    expect(res.depth).toBe(0);
  });

  it('separated circles report zero depth and the true distance', () => {
    const res = circleVsCircle({ x: 0, y: 0, r: 5 }, { x: 30, y: 40, r: 5 });
    expect(res.colliding).toBe(false);
    expect(res.distance).toBeCloseTo(50);
  });

  it('normal points from a toward b', () => {
    const res = circleVsCircle({ x: 0, y: 0, r: 10 }, { x: 3, y: 4, r: 10 });
    expect(res.normal.x).toBeCloseTo(0.6);
    expect(res.normal.y).toBeCloseTo(0.8);
  });

  it('concentric circles collide with a fallback normal', () => {
    const res = circleVsCircle({ x: 5, y: 5, r: 10 }, { x: 5, y: 5, r: 4 });
    expect(res.colliding).toBe(true);
    expect(res.normal).toEqual({ x: 1, y: 0 });
  });
});

describe('point containment', () => {
  it('pointInAabb includes edges', () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    expect(pointInAabb(5, 0, box)).toBe(true);
    expect(pointInAabb(5.01, 0, box)).toBe(false);
    expect(pointInAabb(0, 0, box)).toBe(true);
  });

  it('pointInCircle includes the rim', () => {
    const c = { x: 0, y: 0, r: 5 };
    expect(pointInCircle(3, 4, c)).toBe(true);
    expect(pointInCircle(3.1, 4, c)).toBe(false);
  });
});
