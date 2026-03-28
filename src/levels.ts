import type { LevelDef } from './types';

export const LEVELS: LevelDef[] = [
  {
    // Level 1 - Easy intro
    startPipe: { x: 350, y: 0, w: 100, h: 60 },
    basket: { x: 620, y: 450, w: 80, h: 50 },
    walls: [],
    spikes: [],
    inventory: { bouncer: 2, well: 1, plank: 2 },
    hint: 'Redirect the cat into the basket!',
  },
  {
    // Level 2 - Spikes
    startPipe: { x: 50, y: 0, w: 100, h: 60 },
    basket: { x: 630, y: 440, w: 80, h: 50 },
    walls: [
      { x1: 200, y1: 0, x2: 200, y2: 250 },
      { x1: 200, y1: 250, x2: 450, y2: 250 },
    ],
    spikes: [{ x: 200, y: 530, w: 250 }],
    inventory: { bouncer: 2, well: 2, plank: 2 },
    hint: 'Use planks to bridge over the spikes!',
  },
  {
    // Level 3 - Gravity wells
    startPipe: { x: 640, y: 0, w: 100, h: 60 },
    basket: { x: 80, y: 420, w: 80, h: 50 },
    walls: [
      { x1: 380, y1: 0, x2: 380, y2: 320 },
      { x1: 100, y1: 200, x2: 380, y2: 200 },
    ],
    spikes: [
      { x: 80, y: 530, w: 180 },
      { x: 500, y: 530, w: 200 },
    ],
    inventory: { bouncer: 1, well: 3, plank: 2 },
    hint: 'Use gravity wells to pull the cat around obstacles!',
  },
  {
    // Level 4 - Hot floor
    startPipe: { x: 360, y: 0, w: 80, h: 60 },
    basket: { x: 50, y: 200, w: 80, h: 55 },
    walls: [
      { x1: 0,   y1: 310, x2: 280, y2: 310 },
      { x1: 500, y1: 160, x2: 800, y2: 160 },
    ],
    spikes: [{ x: 0, y: 530, w: 800 }],
    inventory: { bouncer: 2, well: 1, plank: 3 },
    hint: "Don't touch the floor! Guide the cat to the left basket.",
  },
];
