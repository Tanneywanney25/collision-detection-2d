import type { BodyKind } from './config';
import type { EvaluateSummary, Mode, World } from './world';
import type { RenderOptions } from './renderer';

export interface PanelHooks {
  onModeChange: (mode: Mode) => void;
  onOptionsChange: (options: RenderOptions) => void;
  onAddBody: (kind: BodyKind) => void;
  onRemoveLast: () => void;
  onReset: () => void;
}

/** Builds the dashboard: mode, overlay toggles, body management, live stats, pair table. */
export class Panel {
  private readonly statsEl: HTMLElement;
  private readonly pairsEl: HTMLElement;
  readonly options: RenderOptions = { showBounds: true, showAxis: true };

  constructor(
    controlsEl: HTMLElement,
    statsEl: HTMLElement,
    pairsEl: HTMLElement,
    hooks: PanelHooks,
  ) {
    this.statsEl = statsEl;
    this.pairsEl = pairsEl;

    controlsEl.innerHTML = '<h2>Controls</h2>';

    const modeWrap = document.createElement('div');
    for (const mode of ['aabb', 'circle'] as const) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'mode';
      input.value = mode;
      input.checked = mode === 'aabb';
      input.addEventListener('change', () => hooks.onModeChange(mode));
      label.append(input, mode === 'aabb' ? ' AABB (boxes)' : ' Circle vs circle');
      modeWrap.append(label);
    }
    controlsEl.append(modeWrap);

    const toggles: { key: keyof RenderOptions; text: string }[] = [
      { key: 'showBounds', text: ' Show mode bounding shapes' },
      { key: 'showAxis', text: ' Show separating / min-overlap axis' },
    ];
    for (const t of toggles) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = this.options[t.key];
      input.addEventListener('change', () => {
        this.options[t.key] = input.checked;
        hooks.onOptionsChange(this.options);
      });
      label.append(input, t.text);
      controlsEl.append(label);
    }

    const row = document.createElement('div');
    row.className = 'row';
    const buttons: [string, () => void][] = [
      ['+ Box', () => hooks.onAddBody('rect')],
      ['+ Circle', () => hooks.onAddBody('circle')],
      ['Remove last', () => hooks.onRemoveLast()],
      ['Reset scene', () => hooks.onReset()],
    ];
    for (const [text, fn] of buttons) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = text;
      btn.addEventListener('click', fn);
      row.append(btn);
    }
    controlsEl.append(row);
  }

  update(world: World, summary: EvaluateSummary): void {
    this.statsEl.innerHTML = `
      <h2>Live stats</h2>
      <div class="grid">
        <div class="stat">Bodies<b>${world.bodies.length}</b></div>
        <div class="stat">Pairs<b>${summary.pairs.length}</b></div>
        <div class="stat">Colliding now<b>${summary.currentCollisions}</b></div>
        <div class="stat">Collision events<b>${world.totalCollisionEvents}</b></div>
      </div>`;

    const rows = summary.pairs
      .map((p) => {
        const cls = p.colliding ? 'colliding' : 'clear';
        const state = p.colliding ? 'HIT' : 'clear';
        return `<tr>
          <td>${p.a.label}–${p.b.label}</td>
          <td class="${cls}">${state}</td>
          <td>${p.depth.toFixed(1)} px</td>
          <td>${p.axisLabel}</td>
        </tr>`;
      })
      .join('');
    this.pairsEl.innerHTML = `
      <h2>Pairs</h2>
      <table>
        <thead><tr><th>Pair</th><th>State</th><th>Depth</th><th>Axis</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">Add at least two bodies</td></tr>'}</tbody>
      </table>`;
  }
}
