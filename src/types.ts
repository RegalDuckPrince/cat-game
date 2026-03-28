/**
 * types.ts
 * All shared TypeScript interfaces and type aliases used across the game.
 * No runtime code lives here – import with `import type` where possible.
 */

/** The four possible phases the game can be in at any moment. */
export type Phase = 'building' | 'playing' | 'won' | 'dead';

/** The object the player has selected for placement (or removal). */
export type ToolType = 'bouncer' | 'well' | 'plank' | 'remove';

// ── Physics bodies ─────────────────────────────────────────────────────────

/** A line segment defined by two endpoints. Used for walls and planks. */
export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * The cat's circular physics body.
 * `r` is its radius in pixels; `vx`/`vy` are velocity components per frame.
 */
export interface Cat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/** A player-placed bouncer pad (circular, with radius `r`). */
export interface Bouncer {
  x: number;
  y: number;
  r: number;
}

/** A player-placed gravity-well attractor. */
export interface GravWell {
  x: number;
  y: number;
}

/** A short-lived particle used for hit / win / death effects. */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Remaining lifetime fraction in [0, 1]. */
  life: number;
  /** Starting lifetime fraction (always 1). */
  maxLife: number;
  /** CSS colour string, e.g. `'#00e5ff'`. */
  color: string;
}

/** A row of triangular hazard spikes at a fixed position. */
export interface Spike {
  /** Left edge of the spike strip (canvas x). */
  x: number;
  /** Bottom y-coordinate of the strip (spikes point upward from here). */
  y: number;
  /** Total width of the strip in pixels. */
  w: number;
}

/** How many of each placeable object a player starts with on a level. */
export interface Inventory {
  bouncer: number;
  well: number;
  plank: number;
}

/** Full definition of a single level. */
export interface LevelDef {
  /** Position / size of the start pipe the cat drops from. */
  startPipe: { x: number; y: number; w: number; h: number };
  /** Position / size of the goal basket the cat must land in. */
  basket: { x: number; y: number; w: number; h: number };
  /** Static wall segments built into the level. */
  walls: Segment[];
  /** Hazard spike strips built into the level. */
  spikes: Spike[];
  /** Initial inventory for this level. */
  inventory: Inventory;
  /** Short hint string shown in the status bar. */
  hint: string;
}

/**
 * Return value from the circle–segment collision test.
 * `nx`/`ny` is the separation normal (unit vector pointing away from the
 * segment surface toward the circle centre), and `overlap` is how far the
 * circle penetrates the segment.
 */
export interface CollisionResult {
  nx: number;
  ny: number;
  overlap: number;
}
