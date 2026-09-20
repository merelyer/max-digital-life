import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MaxDogSprite } from './MaxDogSprite';

describe('MaxDogSprite', () => {
  it('renders the local Corgi Scout sprite with an accessible Max name', () => {
    render(<MaxDogSprite activity="idle" />);

    const sprite = screen.getByRole('img', { name: 'Max，动态小狗' });
    expect(sprite).toHaveClass('max-dog', 'max-dog-idle');
    expect(sprite).toHaveAttribute('data-sprite-row', 'idle');
    expect(sprite).toHaveAttribute('data-sprite-src', './assets/max/corgi-scout/spritesheet.webp');
  });

  it.each([
    ['idle', 'idle'],
    ['thinking', 'waiting'],
    ['speaking', 'waving'],
  ] as const)('maps %s activity to the %s sprite row', (activity, row) => {
    render(<MaxDogSprite activity={activity} />);

    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-sprite-row', row);
  });

  it('holds a calm idle state before choosing a different behavior later', () => {
    vi.useFakeTimers();
    const random = vi.fn(() => 0);
    render(<MaxDogSprite activity="idle" random={random} />);

    const sprite = screen.getByTestId('max-dog-sprite');
    expect(sprite).toHaveAttribute('data-idle-behavior', 'settle');

    act(() => vi.advanceTimersByTime(11_999));
    expect(sprite).toHaveAttribute('data-idle-behavior', 'settle');

    act(() => vi.advanceTimersByTime(1));
    expect(sprite).toHaveAttribute('data-idle-behavior', 'rest');
    vi.useRealTimers();
  });
});
