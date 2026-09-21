import { act, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MaxDogSprite } from './MaxDogSprite';
import { DOG_CLIPS, chooseDogAction, restingDelay } from '../lib/dog-behavior';
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
describe('Max finite frame playback', () => {
  it('uses only complete occupied cells including the final wave frame', () => {
    const occupied = [6, 8, 8, 4, 5, 8, 6, 6, 6];
    for (const clip of Object.values(DOG_CLIPS)) for (const [row, column] of clip) {
      expect(Number.isInteger(column)).toBe(true);
      expect(column).toBeLessThan(occupied[row]!);
    }
    expect(DOG_CLIPS.wave.at(-1)).toEqual([3, 0]);
  });
  it('keeps the same frame throughout the quiet period and can continue resting', () => {
    vi.useFakeTimers();
    render(<MaxDogSprite random={() => 0} />);
    act(() => vi.advanceTimersByTime(34_999));
    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-frame', '0:0');
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-idle-behavior', 'sit');
  });
  it('finishes a response on a visible frame and stops scheduling frames', () => {
    vi.useFakeTimers();
    render(<MaxDogSprite activity="speaking" />);
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId('max-dog-sprite').getAttribute('data-frame')).toBe(`3:${DOG_CLIPS.wave[i]![1]}`);
      act(() => vi.advanceTimersByTime(260));
    }
    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-frame', '0:0');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('walks to a new position and rests there without snapping back', () => {
    vi.useFakeTimers();
    const random = vi.fn(() => 0.85);
    render(<MaxDogSprite random={random} />);
    act(() => vi.advanceTimersByTime(restingDelay(0.85)));
    act(() => vi.advanceTimersByTime(12 * 180));
    const sprite = screen.getByTestId('max-dog-sprite');
    expect(sprite).toHaveAttribute('data-frame', '0:0');
    expect(parseFloat(sprite.parentElement!.style.left)).toBeCloseTo(59.6);
    act(() => vi.advanceTimersByTime(20_000));
    expect(parseFloat(sprite.parentElement!.style.left)).toBeCloseTo(59.6);
  });
  it('selects long naps using only the two verified lying-down cells', () => {
    vi.useFakeTimers();
    render(<MaxDogSprite random={() => 0.95} />);
    act(() => vi.advanceTimersByTime(restingDelay(0.95)));
    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-frame', '5:2');
    act(() => vi.advanceTimersByTime(450));
    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-frame', '5:3');
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-frame', '5:3');
    expect(chooseDogAction(0.4)).toBe('sit');
    expect(restingDelay(0, true)).toBe(90_000);
    expect(restingDelay(1, true)).toBe(180_000);
  });
  it('cancels playback on unmount', () => {
    vi.useFakeTimers();
    const view = render(<MaxDogSprite activity="speaking" />);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('does not schedule motion when the page is hidden', () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    render(<MaxDogSprite activity="speaking" />);
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-frame', '0:0');
  });
  it('respects reduced motion without hiding the dog', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<MaxDogSprite activity="speaking" />);
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-frame', '0:0');
    vi.unstubAllGlobals();
  });
});
