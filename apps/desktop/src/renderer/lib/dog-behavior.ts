// Zero-based occupied cells verified against the local 8 x 9 sheet.
export type DogFrame = readonly [row: number, column: number];
export type DogAction = 'sit' | 'blink' | 'look' | 'walk' | 'sleep' | 'wave';
export const DOG_CLIPS = {
  blink: [[0, 0], [0, 1], [0, 0]],
  look: [[0, 0], [0, 2], [0, 2], [0, 0]],
  wave: [[3, 0], [3, 1], [3, 2], [3, 1], [3, 0]],
  walkRight: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 0], [1, 1], [1, 2], [1, 3]],
  walkLeft: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 0], [2, 1], [2, 2], [2, 3]]
} as const satisfies Record<string, readonly DogFrame[]>;
const sample = (value: number): number => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
export function chooseDogAction(value: number): DogAction {
  const n = sample(value);
  return n < 0.45 ? 'sit' : n < 0.65 ? 'blink' : n < 0.8 ? 'look' : n < 0.9 ? 'walk' : 'sleep';
}
export function restingDelay(value: number, sleeping = false): number {
  return sleeping ? 90_000 + Math.round(sample(value) * 90_000) : 35_000 + Math.round(sample(value) * 55_000);
}
