import type { PlaygroundConfig } from './config';
import { bodyAabb, bodyCircle, type Body, type EvaluateSummary, type Mode } from './world';

export interface RenderOptions {
  showBounds: boolean;
  showAxis: boolean;
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  body: Body,
  color: string,
  labelColor: string,
): void {
  ctx.fillStyle = color + '33';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (body.kind === 'rect') {
    ctx.rect(body.x - body.w / 2, body.y - body.h / 2, body.w, body.h);
  } else {
    ctx.arc(body.x, body.y, body.r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = labelColor;
  ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(body.label, body.x, body.y);
}

function drawModeBounds(
  ctx: CanvasRenderingContext2D,
  body: Body,
  mode: Mode,
  color: string,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (mode === 'aabb') {
    const box = bodyAabb(body);
    ctx.rect(box.x - box.w / 2, box.y - box.h / 2, box.w, box.h);
  } else {
    const c = bodyCircle(body);
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.restore();
}

export function render(
  ctx: CanvasRenderingContext2D,
  cfg: PlaygroundConfig,
  mode: Mode,
  summary: EvaluateSummary,
  bodies: readonly Body[],
  options: RenderOptions,
): void {
  ctx.clearRect(0, 0, cfg.canvas.width, cfg.canvas.height);

  if (options.showAxis) {
    for (const pair of summary.pairs) {
      ctx.save();
      ctx.strokeStyle = cfg.colors.axis;
      ctx.globalAlpha = pair.colliding ? 0.95 : 0.25;
      ctx.lineWidth = pair.colliding ? 2 : 1;
      if (pair.aabb) {
        // Draw the minimum-overlap (or separating) axis through the midpoint.
        const midX = (pair.a.x + pair.b.x) / 2;
        const midY = (pair.a.y + pair.b.y) / 2;
        const len = 30 + pair.depth;
        ctx.beginPath();
        if (pair.aabb.axis === 'x') {
          ctx.moveTo(midX - len, midY);
          ctx.lineTo(midX + len, midY);
        } else {
          ctx.moveTo(midX, midY - len);
          ctx.lineTo(midX, midY + len);
        }
        ctx.stroke();
      } else if (pair.circle) {
        ctx.beginPath();
        ctx.moveTo(pair.a.x, pair.a.y);
        ctx.lineTo(pair.b.x, pair.b.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  for (const body of bodies) {
    const color = summary.collidingBodies.has(body.id)
      ? cfg.colors.colliding
      : cfg.colors.clear;
    drawBody(ctx, body, color, cfg.colors.label);
    if (options.showBounds) drawModeBounds(ctx, body, mode, cfg.colors.boundingBox);
  }
}
