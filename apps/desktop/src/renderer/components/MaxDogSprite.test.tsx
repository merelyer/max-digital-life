import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MaxDogSprite } from './MaxDogSprite';

describe('MaxDogSprite', () => {
  it('renders the local Corgi Scout sprite with an accessible Max name', () => {
    render(<MaxDogSprite activity="idle" />);

    const sprite = screen.getByRole('img', { name: 'Max，动态小狗' });
    expect(sprite).toHaveClass('max-dog', 'max-dog-idle');
    expect(sprite).toHaveAttribute('data-sprite-row', 'idle');
    expect(sprite).toHaveAttribute('data-sprite-src', '/assets/max/corgi-scout/spritesheet.webp');
  });

  it.each([
    ['idle', 'idle'],
    ['thinking', 'waiting'],
    ['speaking', 'waving'],
  ] as const)('maps %s activity to the %s sprite row', (activity, row) => {
    render(<MaxDogSprite activity={activity} />);

    expect(screen.getByTestId('max-dog-sprite')).toHaveAttribute('data-sprite-row', row);
  });
});
