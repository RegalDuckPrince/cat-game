/**
 * constants.ts
 * All tunable physics and gameplay constants.
 * Keeping them in one place makes balancing easy without touching logic files.
 */

export const GRAVITY = 0.38;

/** Per-frame velocity multiplier that simulates light air resistance.
 *  Values very close to 1 barely slow the cat; lower values feel sluggish. */
export const AIR_DAMPING = 0.995;

/** Coefficient of restitution for collisions with level walls and planks.
 *  0 = fully inelastic (no bounce), 1 = perfectly elastic. */
export const WALL_RESTITUTION = 0.45;

/** Extra normal-direction speed (px/frame) injected when the cat contacts a
 *  bouncer.  Higher values make bouncers feel more powerful. */
export const BOUNCER_IMPULSE = 14;

/** Attraction force magnitude applied at the centre of a gravity well. */
export const WELL_STRENGTH = 0.18;

/** Pixel radius within which a gravity well exerts force on the cat.
 *  Force falls off linearly to zero at this distance. */
export const WELL_RADIUS = 90;

/**
 * FIX: terminal-velocity cap (pixels / frame).
 * Prevents the cat from moving more than one body-diameter per frame and
 * thereby tunnelling through thin walls, planks, or spike strips at high speed.
 */
export const MAX_SPEED = 18;
