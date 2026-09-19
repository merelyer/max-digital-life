import type { ReactElement } from 'react';
import type { RoomActivity } from '../types';

type MaxDogSpriteProps = {
  activity?: RoomActivity;
};

/** A soft, original line-dog with separately addressable parts for room motion. */
export function MaxDogSprite({ activity = 'idle' }: MaxDogSpriteProps): ReactElement {
  return (
    <svg
      className={`max-dog max-dog-${activity}`}
      viewBox="0 0 360 300"
      role="img"
      aria-labelledby="max-dog-title"
      data-testid="max-dog-sprite"
    >
      <title id="max-dog-title">Max，线条小狗</title>

      <g className="dog-tail" data-testid="dog-tail">
        <path
          d="M262 183C302 196 333 175 334 145c1-22-14-38-30-32-15 5-16 24-3 31"
          fill="none"
          strokeWidth="18"
        />
        <path d="M304 132c6-2 11 2 13 7" fill="none" strokeWidth="4" />
      </g>

      <g className="dog-leg dog-leg-back-left" data-testid="dog-leg-back-left">
        <path d="M111 197c-4 20-4 42 2 58 4 11 17 15 27 8 8-6 5-16 0-25l3-43Z" />
        <path className="dog-paw" data-testid="dog-paw-back-left" d="M111 247c-9 5-10 14-2 20 10 8 28 5 33-5 2-5 0-10-5-13-8 4-17 4-26-2Z" />
      </g>
      <g className="dog-leg dog-leg-back-right" data-testid="dog-leg-back-right">
        <path d="M143 201c-1 19 1 40 7 55 4 11 17 14 26 7 7-6 4-15-1-24l-3-42Z" />
        <path className="dog-paw" data-testid="dog-paw-back-right" d="M149 248c-7 7-4 16 6 20 11 5 27 0 30-10 1-5-2-9-7-12-8 4-19 5-29 2Z" />
      </g>

      <g className="dog-body" data-testid="dog-body">
        <path d="M101 153c12-28 43-43 82-43 44 0 77 18 88 49 13 36 1 68-29 83-31 16-85 16-119 4-29-11-43-32-40-57 1-13 7-25 18-36Z" />
        <path className="dog-belly-line" d="M117 222c28 14 79 17 116 2" />
        <path className="dog-chest-line" d="M226 139c-7 18-4 39 8 54" />
      </g>

      <g className="dog-leg dog-leg-front-left" data-testid="dog-leg-front-left">
        <path d="M194 190c-2 21-1 44 5 62 4 11 17 14 26 7 7-6 4-15-1-24l-3-47Z" />
        <path className="dog-paw" data-testid="dog-paw-front-left" d="M201 247c-6 8-2 16 8 20 11 4 26-2 28-12 1-5-2-9-7-12-8 4-18 5-29 4Z" />
      </g>
      <g className="dog-leg dog-leg-front-right" data-testid="dog-leg-front-right">
        <path d="M226 188c1 20 4 42 11 58 5 11 18 13 26 5 6-6 2-15-4-23l-7-44Z" />
        <path className="dog-paw" data-testid="dog-paw-front-right" d="M238 242c-4 8 1 16 11 19 11 3 25-4 26-14 0-5-3-9-8-11-7 5-17 7-29 6Z" />
      </g>

      <g className="dog-ear dog-ear-left" data-testid="dog-ear-left">
        <path d="M126 82C101 67 78 76 73 98c-7 27 12 53 39 58l26-17 10-31Z" />
        <path className="dog-ear-inner" d="M104 88c-13-1-19 7-16 19 3 13 12 22 24 26" />
      </g>
      <g className="dog-ear dog-ear-right" data-testid="dog-ear-right">
        <path d="M244 69c22-19 47-12 53 10 6 24-9 48-34 56l-29-17-10-28Z" />
        <path className="dog-ear-inner" d="M259 79c12-8 22-3 24 8 2 12-4 23-14 29" />
      </g>

      <g className="dog-head" data-testid="dog-head">
        <path d="M125 74c15-31 54-47 94-40 37 6 61 30 62 62 17-2 30 7 31 21 1 16-14 27-31 24-10 24-38 38-70 37-42-1-76-20-85-50-16 0-29-10-29-24 0-16 11-28 28-30Z" />
        <path className="dog-head-highlight" d="M148 56c20-13 44-18 64-14" />
      </g>

      <g className="dog-muzzle" data-testid="dog-muzzle">
        <path d="M199 112c18-15 50-15 64 1 14 16 4 36-17 43l-27 2c-20-7-30-30-20-46Z" />
        <ellipse className="dog-nose" data-testid="dog-nose" cx="231" cy="122" rx="10" ry="8" fill="currentColor" stroke="none" />
        <path className="dog-mouth" data-testid="dog-mouth" d="M231 130c0 11-8 18-17 18M231 130c2 10 11 15 20 11" fill="none" />
      </g>

      <g className="dog-collar" data-testid="dog-collar">
        <path d="M133 155c28 22 74 29 112 9l-4 17c-36 24-83 15-111-4Z" />
        <circle cx="190" cy="181" r="7" />
      </g>

      <g className="dog-face" aria-hidden="true">
        <ellipse className="dog-eye" data-testid="dog-eye-left" cx="171" cy="100" rx="7" ry="10" />
        <ellipse className="dog-eye" data-testid="dog-eye-right" cx="226" cy="91" rx="7" ry="10" />
        <path className="dog-brow dog-brow-left" d="M160 82c8-6 16-6 23-1" />
        <path className="dog-brow dog-brow-right" d="M217 74c8-5 16-4 22 2" />
        <ellipse className="dog-cheek" data-testid="dog-cheek-left" cx="146" cy="124" rx="13" ry="7" />
        <ellipse className="dog-cheek" data-testid="dog-cheek-right" cx="267" cy="119" rx="13" ry="7" />
        <path className="dog-tongue" d="M231 146c7 0 12 4 12 10 0 8-6 13-12 13-7 0-11-6-10-13 0-6 4-10 10-10Z" />
      </g>
    </svg>
  );
}
