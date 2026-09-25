/** Central configuration for the collision playground. */

export type BodyKind = 'rect' | 'circle';

export interface BodySpec {
  kind: BodyKind;
  /** Center position. */
  x: number;
  y: number;
  /** Rect half-extents (ignored for circles). */
  w?: number;
  h?: number;
  /** Circle radius (ignored for rects). */
  r?: number;
  label: string;
}

export interface PlaygroundConfig {
  canvas: { width: number; height: number };
  colors: {
    clear: string;
    colliding: string;
    boundingBox: string;
    axis: string;
    label: string;
  };
  /** Default sizes for newly added bodies. */
  newBody: { rectW: number; rectH: number; radius: number };
  maxBodies: number;
  initialScene: BodySpec[];
}

export const defaultConfig: PlaygroundConfig = {
  canvas: { width: 760, height: 520 },
  colors: {
    clear: '#37c871',
    colliding: '#ff5d5d',
    boundingBox: '#58a6ff',
    axis: '#f2c14e',
    label: '#dfe6ee',
  },
  newBody: { rectW: 120, rectH: 80, radius: 55 },
  maxBodies: 8,
  initialScene: [
    { kind: 'rect', x: 200, y: 180, w: 140, h: 90, label: 'A' },
    { kind: 'rect', x: 340, y: 250, w: 110, h: 110, label: 'B' },
    { kind: 'circle', x: 540, y: 200, r: 60, label: 'C' },
    { kind: 'circle', x: 480, y: 380, r: 45, label: 'D' },
  ],
};
