# Collision Detection 2D

Collision Detection 2D is an interactive collision-geometry playground that grew out of a two-rectangle AABB demo into a typed TypeScript + Canvas2D dashboard. Up to eight draggable boxes and circles live on a canvas, and every unordered pair is evaluated each frame in one of two modes: axis-aligned bounding boxes or circle-versus-circle. A live panel reports each pair's overlap state, penetration depth in pixels, and the minimum-overlap or separating axis, alongside counters for bodies, pairs, current collisions, and cumulative edge-triggered collision events. Overlays visualize the mode's bounding shapes and the separating axis, making the underlying math visible while you drag. All geometry lives in a pure, dependency-free module — strict AABB and circle tests where touching edges don't collide — covered by a Vitest suite including penetration-depth and edge cases. Vite builds it, ESLint and Prettier keep it clean, GitHub Actions verifies every push, Vercel-ready.

## Using the playground

- **Drag** any body with the mouse or touch; colliding bodies turn red.
- **Mode** switches the test applied to every pair:
  - *AABB* — rects use their own box, circles use their bounding square.
  - *Circle vs circle* — circles use their own radius, rects their circumscribed circle.
- **Overlays** — dashed bounding shapes per mode, and the yellow minimum-overlap /
  separating axis per pair (bright when colliding, faint when clear).
- **+ Box / + Circle / Remove last / Reset** manage the scene (capped at 8 bodies).
- The **Pairs** table lists overlap state, penetration depth, and axis for every pair;
  **Collision events** counts pair *entries* (edge-triggered), not frames.

## The math (src/geometry.ts)

- `aabbVsAabb` — overlap per axis from center distances vs summed half-extents;
  penetration depth is the smaller positive overlap and the axis of minimum overlap is
  reported. Exactly touching edges (overlap = 0) do **not** collide.
- `circleVsCircle` — depth is `r₁ + r₂ − distance` (clamped at 0), with the contact
  normal from the first center toward the second and a deterministic fallback for the
  concentric case.
- Pure functions, no DOM, no rendering — the whole module is unit-testable.

## Tech stack

TypeScript (strict) · Vite · Canvas2D · Vitest · ESLint (flat config) + Prettier · GitHub Actions

## Local development

```bash
npm install
npm run dev        # start dev server
npm test           # run unit tests
npm run lint       # eslint
npm run build      # typecheck + production build
```

## Testing

`tests/geometry.test.ts` covers overlap truth tables including exact-touch cases,
`tests/penetration.test.ts` pins depth/axis values against hand-computed geometry, and
`tests/world.test.ts` verifies pair enumeration, the edge-triggered event counter,
mode-dependent results, body caps, clamped dragging, and reset. CI runs lint, tests,
and build on every push.

## Deploy

```bash
npm i -g vercel   # once
vercel deploy
```

`vercel.json` is preconfigured for the Vite static build (`dist/`).

## Project history

Originally a 2021 course exercise: one mouse-following rectangle turning red on overlap.
Rebuilt in 2026 as a multi-body playground with real penetration math, a live dashboard,
tests, CI, and deploy config.
