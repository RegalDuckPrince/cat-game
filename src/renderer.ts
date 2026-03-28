import { canvas, ctx, W, H } from './canvas';
import type { Segment, Spike, Bouncer, GravWell, Cat, Particle, Phase } from './types';
import { WELL_RADIUS } from './constants';

// Suppress unused variable warnings for canvas/H
void canvas;
void H;

export function drawBackground(): void {
  ctx.fillStyle = '#07111f';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#0d1f35';
  ctx.lineWidth = 1;
  const gridSize = 40;

  ctx.beginPath();
  for (let x = 0; x <= W; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = 0; y <= H; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
}

export function drawWalls(walls: Segment[]): void {
  ctx.strokeStyle = '#4a9fd4';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const seg of walls) {
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
  }
}

export function drawSpikes(spikes: Spike[]): void {
  for (const spike of spikes) {
    const triWidth = 20;
    const triHeight = 20;
    const count = Math.floor(spike.w / triWidth);

    ctx.fillStyle = '#e74c3c';
    ctx.strokeStyle = '#ff6b5a';
    ctx.lineWidth = 1;

    for (let i = 0; i < count; i++) {
      const bx = spike.x + i * triWidth;
      const by = spike.y;
      const apex = spike.y - triHeight;

      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + triWidth / 2, apex);
      ctx.lineTo(bx + triWidth, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

export function drawStartPipe(pipe: { x: number; y: number; w: number; h: number }): void {
  ctx.fillStyle = '#1a3a5c';
  ctx.strokeStyle = '#4a7aa4';
  ctx.lineWidth = 2;

  // Fill pipe body
  ctx.fillRect(pipe.x, pipe.y, pipe.w, pipe.h);

  // Draw left, top, right sides only (open bottom)
  ctx.beginPath();
  ctx.moveTo(pipe.x, pipe.y + pipe.h);
  ctx.lineTo(pipe.x, pipe.y);
  ctx.lineTo(pipe.x + pipe.w, pipe.y);
  ctx.lineTo(pipe.x + pipe.w, pipe.y + pipe.h);
  ctx.stroke();
}

export function drawBasket(
  basket: { x: number; y: number; w: number; h: number },
  phase: Phase
): void {
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;

  if (phase === 'won') {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillRect(basket.x, basket.y, basket.w, basket.h);
  }

  // Draw left, bottom, right sides (open top)
  ctx.beginPath();
  ctx.moveTo(basket.x, basket.y);
  ctx.lineTo(basket.x, basket.y + basket.h);
  ctx.lineTo(basket.x + basket.w, basket.y + basket.h);
  ctx.lineTo(basket.x + basket.w, basket.y);
  ctx.stroke();
}

export function drawBouncers(bouncers: Bouncer[]): void {
  for (const b of bouncers) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00e5ff';

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

export function drawWells(wells: GravWell[]): void {
  for (const w of wells) {
    // Center circle
    ctx.beginPath();
    ctx.arc(w.x, w.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#b44fff';
    ctx.fill();
    ctx.strokeStyle = '#d080ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Outer influence ring (dashed)
    ctx.save();
    ctx.beginPath();
    ctx.arc(w.x, w.y, WELL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180, 79, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawPlanks(planks: Segment[]): void {
  ctx.strokeStyle = '#78c878';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  for (const plank of planks) {
    ctx.beginPath();
    ctx.moveTo(plank.x1, plank.y1);
    ctx.lineTo(plank.x2, plank.y2);
    ctx.stroke();
  }
}

export function drawCat(cat: Cat): void {
  const x = cat.x;
  const y = cat.y;
  const r = cat.r;

  ctx.save();

  // Body
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700';
  ctx.fill();
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Left ear
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y - r * 0.7);
  ctx.lineTo(x - r * 0.9, y - r * 1.5);
  ctx.lineTo(x - r * 0.1, y - r * 1.0);
  ctx.closePath();
  ctx.fillStyle = '#ffd700';
  ctx.fill();
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Right ear
  ctx.beginPath();
  ctx.moveTo(x + r * 0.6, y - r * 0.7);
  ctx.lineTo(x + r * 0.9, y - r * 1.5);
  ctx.lineTo(x + r * 0.1, y - r * 1.0);
  ctx.closePath();
  ctx.fillStyle = '#ffd700';
  ctx.fill();
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.1, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.35, y - r * 0.1, r * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawParticles(particles: Particle[]): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }
}

export function drawPlankPreview(
  start: { x: number; y: number },
  end: { x: number; y: number }
): void {
  ctx.save();
  ctx.strokeStyle = '#78c878';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.setLineDash([8, 5]);
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();
}

export function drawOverlay(phase: Phase, level: number): void {
  if (phase === 'building' || phase === 'playing') return;

  // Semi-transparent backdrop
  ctx.fillStyle = 'rgba(7, 17, 31, 0.65)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (phase === 'won') {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 56px monospace';
    ctx.fillText('YOU WIN! 🐱', W / 2, H / 2 - 30);

    ctx.fillStyle = '#aaddff';
    ctx.font = '22px monospace';
    const isLastLevel = level >= 2;
    ctx.fillText(
      isLastLevel ? 'Click to play again!' : 'Click to continue →',
      W / 2,
      H / 2 + 30
    );
  } else if (phase === 'dead') {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 56px monospace';
    ctx.fillText('OH NO! 🐱', W / 2, H / 2 - 30);

    ctx.fillStyle = '#aaddff';
    ctx.font = '22px monospace';
    ctx.fillText('Click to retry', W / 2, H / 2 + 30);
  }
}
