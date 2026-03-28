/**
 * canvas.ts
 * Exports the single shared canvas element, its 2-D context, and dimensions.
 */

export const canvas = document.getElementById('canvas') as HTMLCanvasElement;
export const ctx    = canvas.getContext('2d') as CanvasRenderingContext2D;
export const W      = canvas.width;
export const H      = canvas.height;
