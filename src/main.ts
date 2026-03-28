import { canvas, W, H } from './canvas';
import { LEVELS } from './levels';
import type { Phase, ToolType, Cat, Bouncer, GravWell, Segment, Particle } from './types';
import {
  circleSegmentCollision,
  circleBouncer,
  resolveSegment,
  resolveBouncer,
  applyWells,
  stepCat,
  catOnSpike,
  catInBasket,
  resolveWalls,
} from './physics';
import {
  drawBackground,
  drawWalls,
  drawSpikes,
  drawStartPipe,
  drawBasket,
  drawBouncers,
  drawWells as renderWells,
  drawPlanks,
  drawCat,
  drawParticles,
  drawPlankPreview,
  drawOverlay,
} from './renderer';

// ── State ──────────────────────────────────────────────────────────────────

let currentLevel = 0;
let phase: Phase = 'building';
let activeTool: ToolType | null = null;

let placedBouncers: Bouncer[] = [];
let placedWells: GravWell[] = [];
let placedPlanks: Segment[] = [];

let plankStart: { x: number; y: number } | null = null;
let mousePos: { x: number; y: number } = { x: 0, y: 0 };

let cat: Cat = { x: 0, y: 0, vx: 0, vy: 0, r: 14 };
let particles: Particle[] = [];

let inventory = { bouncer: 0, well: 0, plank: 0 };

// ── DOM helpers ────────────────────────────────────────────────────────────

function el(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

function btn(id: string): HTMLButtonElement {
  return document.getElementById(id) as HTMLButtonElement;
}

// ── Game functions ─────────────────────────────────────────────────────────

function updateCounts(): void {
  el('count-bouncer').textContent = `×${inventory.bouncer}`;
  el('count-well').textContent = `×${inventory.well}`;
  el('count-plank').textContent = `×${inventory.plank}`;

  (btn('btn-bouncer') as HTMLButtonElement).disabled = inventory.bouncer === 0;
  (btn('btn-well') as HTMLButtonElement).disabled = inventory.well === 0;
  (btn('btn-plank') as HTMLButtonElement).disabled = inventory.plank === 0;
}

function selectTool(tool: ToolType | null): void {
  ['btn-bouncer', 'btn-well', 'btn-plank', 'btn-remove'].forEach((id) =>
    btn(id).classList.remove('active')
  );

  if (tool !== null) {
    const idMap: Record<ToolType, string> = {
      bouncer: 'btn-bouncer',
      well: 'btn-well',
      plank: 'btn-plank',
      remove: 'btn-remove',
    };
    btn(idMap[tool]).classList.add('active');
  }

  plankStart = null;
  activeTool = tool;
}

function spawnParticles(x: number, y: number, color: string, count = 8): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
    color,
    });
  }
}

function loadLevel(idx: number): void {
  currentLevel = idx;
  phase = 'building';
  activeTool = null;

  const level = LEVELS[idx];
  inventory = { ...level.inventory };

  placedBouncers = [];
  placedWells = [];
  placedPlanks = [];
  plankStart = null;
  particles = [];

  const pipe = level.startPipe;
  cat = {
    x: pipe.x + pipe.w / 2,
    y: pipe.y + pipe.h + 14,
    vx: 0,
    vy: 0,
    r: 14,
  };

  el('level-display').textContent = `LEVEL ${idx + 1}`;
  el('status-bar').textContent = level.hint;

  updateCounts();
  selectTool(null);

  btn('btn-play').disabled = false;
  btn('btn-reset').disabled = false;

  // Re-enable tool buttons (may have been disabled)
  btn('btn-bouncer').disabled = inventory.bouncer === 0;
  btn('btn-well').disabled = inventory.well === 0;
  btn('btn-plank').disabled = inventory.plank === 0;
  btn('btn-remove').disabled = false;
}

// ── Update & Render ────────────────────────────────────────────────────────

function update(): void {
  if (phase !== 'playing') {
    // Animate particles even when not playing
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    }
    particles = particles.filter((p) => p.life > 0);
    return;
  }

  const level = LEVELS[currentLevel];

  applyWells(cat, placedWells);
  stepCat(cat);

  // Resolve against level walls
  for (const seg of level.walls) {
    const result = circleSegmentCollision(cat, seg);
    if (result) resolveSegment(cat, result);
  }

  // Resolve against placed planks
  for (const plank of placedPlanks) {
    const result = circleSegmentCollision(cat, plank);
    if (result) resolveSegment(cat, result);
  }

  // Resolve against placed bouncers
  for (const bouncer of placedBouncers) {
    const result = circleBouncer(cat, bouncer);
    if (result) {
      resolveBouncer(cat, result);
      const cx = cat.x - result.nx * bouncer.r;
      const cy = cat.y - result.ny * bouncer.r;
      spawnParticles(cx, cy, '#00e5ff', 8);
    }
  }

  // Resolve against canvas walls
  const fellOff = resolveWalls(cat, W, H);
  if (fellOff) {
    phase = 'dead';
    spawnParticles(cat.x, H - 10, '#e74c3c', 12);
    el('status-bar').textContent = '💀 Oh no! Click to retry...';
    btn('btn-play').disabled = true;
    return;
  }

  // Check spikes
  if (catOnSpike(cat, level.spikes)) {
    phase = 'dead';
    spawnParticles(cat.x, cat.y, '#e74c3c', 12);
    el('status-bar').textContent = '💀 Oh no! Click to retry...';
    btn('btn-play').disabled = true;
    return;
  }

  // Check basket (win)
  if (catInBasket(cat, level.basket)) {
    phase = 'won';
    spawnParticles(cat.x, cat.y, '#ffd700', 12);
    spawnParticles(cat.x, cat.y, '#00e5ff', 8);
    el('status-bar').textContent = '🐱 You got in! Click to continue...';
    btn('btn-play').disabled = true;
    return;
  }

  // Update particles during play
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
  }
  particles = particles.filter((p) => p.life > 0);
}

function render(): void {
  const level = LEVELS[currentLevel];

  drawBackground();
  drawWalls(level.walls);
  drawSpikes(level.spikes);
  drawStartPipe(level.startPipe);
  drawBasket(level.basket, phase);
  drawPlanks(placedPlanks);
  drawBouncers(placedBouncers);
  renderWells(placedWells);
  drawCat(cat);
  drawParticles(particles);

  if (phase === 'building' && activeTool === 'plank' && plankStart !== null) {
    drawPlankPreview(plankStart, mousePos);
  }

  drawOverlay(phase, currentLevel);
}

// ── Event handlers ─────────────────────────────────────────────────────────

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (W / rect.width);
  const y = (e.clientY - rect.top) * (H / rect.height);

  // Handle win/dead state transitions
  if (phase === 'won') {
    if (currentLevel + 1 < LEVELS.length) {
      loadLevel(currentLevel + 1);
    } else {
      loadLevel(currentLevel);
    }
    return;
  }

  if (phase === 'dead') {
    loadLevel(currentLevel);
    return;
  }

  if (phase !== 'building') return;

  if (activeTool === 'bouncer' && inventory.bouncer > 0) {
    placedBouncers.push({ x, y, r: 22 });
    inventory.bouncer--;
    updateCounts();
    if (inventory.bouncer === 0) selectTool(null);
  } else if (activeTool === 'well' && inventory.well > 0) {
    placedWells.push({ x, y });
    inventory.well--;
    updateCounts();
    if (inventory.well === 0) selectTool(null);
  } else if (activeTool === 'plank' && inventory.plank > 0) {
    if (plankStart === null) {
      plankStart = { x, y };
    } else {
      placedPlanks.push({ x1: plankStart.x, y1: plankStart.y, x2: x, y2: y });
      inventory.plank--;
      plankStart = null;
      updateCounts();
      if (inventory.plank === 0) selectTool(null);
    }
  } else if (activeTool === 'remove') {
    let removed = false;

    for (let i = 0; i < placedBouncers.length; i++) {
      const b = placedBouncers[i];
      if (Math.hypot(b.x - x, b.y - y) < 30) {
        placedBouncers.splice(i, 1);
        inventory.bouncer++;
        updateCounts();
        removed = true;
        break;
      }
    }

    if (!removed) {
      for (let i = 0; i < placedWells.length; i++) {
        const w = placedWells[i];
        if (Math.hypot(w.x - x, w.y - y) < 30) {
          placedWells.splice(i, 1);
          inventory.well++;
          updateCounts();
          removed = true;
          break;
        }
      }
    }

    if (!removed) {
      for (let i = 0; i < placedPlanks.length; i++) {
        const p = placedPlanks[i];
        const mx = (p.x1 + p.x2) / 2;
        const my = (p.y1 + p.y2) / 2;
        if (Math.hypot(mx - x, my - y) < 40) {
          placedPlanks.splice(i, 1);
          inventory.plank++;
          updateCounts();
          break;
        }
      }
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = (e.clientX - rect.left) * (W / rect.width);
  mousePos.y = (e.clientY - rect.top) * (H / rect.height);
});

btn('btn-bouncer').addEventListener('click', () => selectTool('bouncer'));
btn('btn-well').addEventListener('click', () => selectTool('well'));
btn('btn-plank').addEventListener('click', () => selectTool('plank'));
btn('btn-remove').addEventListener('click', () => selectTool('remove'));

btn('btn-play').addEventListener('click', () => {
  if (phase === 'building') {
    phase = 'playing';
    el('status-bar').textContent = 'PLAYING...';
    btn('btn-play').disabled = true;
    btn('btn-bouncer').disabled = true;
    btn('btn-well').disabled = true;
    btn('btn-plank').disabled = true;
    btn('btn-remove').disabled = true;
  }
});

btn('btn-reset').addEventListener('click', () => {
  loadLevel(currentLevel);
});

// ── Game loop ──────────────────────────────────────────────────────────────

function loop(): void {
  update();
  render();
  requestAnimationFrame(loop);
}

loadLevel(0);
requestAnimationFrame(loop);
