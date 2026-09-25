import { describe, expect, it } from 'vitest';
import { aabbVsAabb, circleVsCircle } from '../src/geometry';

describe('AABB penetration depth and axis', () => {
  it('reports the smaller overlap as depth with its axis', () => {
    // 10x10 boxes, centers offset (8, 2): overlapX = 2, overlapY = 8 → depth 2 on x.
    const res = aabbVsAabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 8, y: 2, w: 10, h: 10 });
    expect(res.overlapX).toBeCloseTo(2);
    expect(res.overlapY).toBeCloseTo(8);
    expect(res.depth).toBeCloseTo(2);
    expect(res.axis).toBe('x');
  });

  it('flips axis when the y overlap is smaller', () => {
    const res = aabbVsAabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 2, y: 8, w: 10, h: 10 });
    expect(res.depth).toBeCloseTo(2);
    expect(res.axis).toBe('y');
  });

  it('negative overlap on the separating axis when apart', () => {
    const res = aabbVsAabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 25, y: 0, w: 10, h: 10 });
    expect(res.overlapX).toBeCloseTo(-15);
    expect(res.axis).toBe('x');
    expect(res.depth).toBe(0);
  });

  it('depth equals full smaller extent under symmetric containment', () => {
    // Small 4-wide box centered inside a big one: overlapX = (100+4)/2 - 0 = 52 → min is y overlap 27.
    const res = aabbVsAabb({ x: 0, y: 0, w: 100, h: 50 }, { x: 0, y: 0, w: 4, h: 4 });
    expect(res.depth).toBeCloseTo(27);
    expect(res.axis).toBe('y');
  });

  it('handles differently sized boxes', () => {
    // half-extents 15+5=20; centers 18 apart → overlapX 2.
    const res = aabbVsAabb({ x: 0, y: 0, w: 30, h: 30 }, { x: 18, y: 0, w: 10, h: 30 });
    expect(res.depth).toBeCloseTo(2);
    expect(res.axis).toBe('x');
  });
});

describe('circle penetration depth', () => {
  it('depth = r1 + r2 - distance while overlapping', () => {
    const res = circleVsCircle({ x: 0, y: 0, r: 12 }, { x: 9, y: 12, r: 8 });
    // distance = 15, radius sum = 20 → depth 5.
    expect(res.distance).toBeCloseTo(15);
    expect(res.depth).toBeCloseTo(5);
  });

  it('deep containment: depth grows as centers approach', () => {
    const shallow = circleVsCircle({ x: 0, y: 0, r: 10 }, { x: 8, y: 0, r: 5 });
    const deep = circleVsCircle({ x: 0, y: 0, r: 10 }, { x: 2, y: 0, r: 5 });
    expect(deep.depth).toBeGreaterThan(shallow.depth);
    expect(deep.depth).toBeCloseTo(13);
  });
});
