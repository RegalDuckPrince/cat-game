import type { Cat, Segment, Bouncer, GravWell, Spike, CollisionResult } from './types';
import { GRAVITY, AIR_DAMPING, WALL_RESTITUTION, BOUNCER_IMPULSE, WELL_STRENGTH, WELL_RADIUS, MAX_SPEED } from './constants';

export function circleSegmentCollision(cat: Cat, seg: Segment): CollisionResult | null {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return null;

  const t = Math.max(0, Math.min(1, ((cat.x - seg.x1) * dx + (cat.y - seg.y1) * dy) / lenSq));
  const closestX = seg.x1 + t * dx;
  const closestY = seg.y1 + t * dy;

  const distX = cat.x - closestX;
  const distY = cat.y - closestY;
  const dist = Math.sqrt(distX * distX + distY * distY);

  if (dist >= cat.r || dist === 0) return null;

  return {
    nx: distX / dist,
    ny: distY / dist,
    overlap: cat.r - dist,
  };
}

export function circleBouncer(cat: Cat, bouncer: Bouncer): CollisionResult | null {
  const dx = cat.x - bouncer.x;
  const dy = cat.y - bouncer.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = cat.r + bouncer.r;

  if (dist >= minDist || dist === 0) return null;

  return {
    nx: dx / dist,
    ny: dy / dist,
    overlap: minDist - dist,
  };
}

export function resolveSegment(cat: Cat, result: CollisionResult): void {
  const { nx, ny, overlap } = result;

  // Push cat out of segment
  cat.x += nx * overlap;
  cat.y += ny * overlap;

  // Reflect velocity over normal and apply restitution to normal component
  const dot = cat.vx * nx + cat.vy * ny;
  if (dot < 0) {
    cat.vx -= (1 + WALL_RESTITUTION) * dot * nx;
    cat.vy -= (1 + WALL_RESTITUTION) * dot * ny;
  }
}

export function resolveBouncer(cat: Cat, result: CollisionResult): void {
  const { nx, ny, overlap } = result;

  // Push cat out
  cat.x += nx * overlap;
  cat.y += ny * overlap;

  // Reflect velocity over normal
  const dot = cat.vx * nx + cat.vy * ny;
  if (dot < 0) {
    cat.vx -= 2 * dot * nx;
    cat.vy -= 2 * dot * ny;
  }

  // Add bouncer impulse in normal direction
  cat.vx += nx * BOUNCER_IMPULSE;
  cat.vy += ny * BOUNCER_IMPULSE;
}

export function applyWells(cat: Cat, wells: GravWell[]): void {
  for (const well of wells) {
    const dx = well.x - cat.x;
    const dy = well.y - cat.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < WELL_RADIUS && dist > 0) {
      const force = WELL_STRENGTH * (1 - dist / WELL_RADIUS);
      cat.vx += force * dx / dist;
      cat.vy += force * dy / dist;
    }
  }
}

export function stepCat(cat: Cat): void {
  cat.vy += GRAVITY;
  cat.vx *= AIR_DAMPING;
  cat.vy *= AIR_DAMPING;

  // FIX: clamp speed to MAX_SPEED to prevent tunnelling through thin surfaces.
  const speed = Math.sqrt(cat.vx * cat.vx + cat.vy * cat.vy);
  if (speed > MAX_SPEED) {
    const scale = MAX_SPEED / speed;
    cat.vx *= scale;
    cat.vy *= scale;
  }

  cat.x += cat.vx;
  cat.y += cat.vy;
}

// Height of a spike triangle in pixels (must match the renderer's triHeight).
const SPIKE_HEIGHT = 20;

/**
 * FIX: use the cat's radius for accurate circle-vs-spike-strip detection.
 * The old code used a hard-coded 40 px vertical window based on the cat
 * *centre*, which fired too early (false positives above the spike tips).
 * The corrected version tests the cat's lowest/left/right edges.
 */
export function catOnSpike(cat: Cat, spikes: Spike[]): boolean {
  for (const spike of spikes) {
    if (
      cat.x + cat.r > spike.x &&
      cat.x - cat.r < spike.x + spike.w &&
      cat.y + cat.r > spike.y - SPIKE_HEIGHT &&
      cat.y - cat.r < spike.y
    ) {
      return true;
    }
  }
  return false;
}

export function catInBasket(
  cat: Cat,
  basket: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    cat.x > basket.x + 10 &&
    cat.x < basket.x + basket.w - 10 &&
    cat.y > basket.y &&
    cat.y < basket.y + basket.h
  );
}

export function resolveWalls(cat: Cat, W: number, H: number): boolean {
  // Left wall
  if (cat.x - cat.r < 0) {
    cat.x = cat.r;
    cat.vx = Math.abs(cat.vx) * WALL_RESTITUTION;
  }
  // Right wall
  if (cat.x + cat.r > W) {
    cat.x = W - cat.r;
    cat.vx = -Math.abs(cat.vx) * WALL_RESTITUTION;
  }
  // Top wall
  if (cat.y - cat.r < 0) {
    cat.y = cat.r;
    cat.vy = Math.abs(cat.vy) * WALL_RESTITUTION;
  }
  // Fell off bottom
  if (cat.y - cat.r > H) {
    return true;
  }
  return false;
}
