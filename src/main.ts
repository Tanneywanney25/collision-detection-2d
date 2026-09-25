import { defaultConfig } from './config';
import { render } from './renderer';
import { Panel } from './panel';
import { World, type Body } from './world';

function require<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el;
}

const canvas = require<HTMLCanvasElement>('#scene');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas 2D context unavailable');

const cfg = defaultConfig;
canvas.width = cfg.canvas.width;
canvas.height = cfg.canvas.height;

const world = new World(cfg);

const panel = new Panel(
  require('#controls'),
  require('#stats'),
  require('#pairs'),
  {
    onModeChange: (mode) => {
      world.mode = mode;
    },
    onOptionsChange: () => {
      /* options object is shared; nothing else to do */
    },
    onAddBody: (kind) => {
      world.addBody(kind);
    },
    onRemoveLast: () => {
      world.removeLast();
    },
    onReset: () => world.reset(),
  },
);

// --- Pointer dragging ------------------------------------------------------

let dragged: Body | null = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function canvasPoint(e: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * cfg.canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * cfg.canvas.height,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const { x, y } = canvasPoint(e);
  dragged = world.bodyAt(x, y);
  if (dragged) {
    dragOffsetX = dragged.x - x;
    dragOffsetY = dragged.y - y;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragged) return;
  const { x, y } = canvasPoint(e);
  world.moveBody(dragged, x + dragOffsetX, y + dragOffsetY);
});

canvas.addEventListener('pointerup', (e) => {
  dragged = null;
  canvas.releasePointerCapture(e.pointerId);
  canvas.style.cursor = 'grab';
});

// --- Frame loop -------------------------------------------------------------

function frame(): void {
  const summary = world.evaluate();
  render(ctx as CanvasRenderingContext2D, cfg, world.mode, summary, world.bodies, panel.options);
  panel.update(world, summary);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
