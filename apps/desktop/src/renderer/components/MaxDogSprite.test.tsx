import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MaxDogSprite } from './MaxDogSprite';

describe('MaxDogSprite', () => {
  it('renders independently addressable body parts with the current activity', () => {
    render(<MaxDogSprite activity="thinking" />);

    expect(screen.getByRole('img', { name: 'Max，线条小狗' })).toHaveClass('max-dog-thinking');
    expect(screen.getByTestId('dog-body')).toBeVisible();
    expect(screen.getByTestId('dog-head')).toBeVisible();
    expect(screen.getByTestId('dog-tail')).toBeVisible();
    expect(screen.getAllByTestId(/^dog-leg-/)).toHaveLength(4);
    expect(screen.getAllByTestId(/^dog-ear-/)).toHaveLength(2);
    expect(screen.getByTestId('dog-muzzle')).toBeVisible();
    expect(screen.getByTestId('dog-collar')).toBeVisible();
    expect(screen.getByTestId('dog-nose')).toBeVisible();
    expect(screen.getAllByTestId(/^dog-paw-/)).toHaveLength(4);
    expect(screen.queryByTestId('dog-watermelon')).not.toBeInTheDocument();
  });

  it('keeps a readable puppy silhouette without avatar or fruit parts', () => {
    render(<MaxDogSprite activity="idle" />);

    expect(screen.getByRole('img', { name: 'Max，线条小狗' })).toBeInTheDocument();
    expect(screen.getByTestId('dog-head')).toBeVisible();
    expect(screen.getByTestId('dog-body')).toBeVisible();
    expect(screen.getAllByTestId(/^dog-ear-/)).toHaveLength(2);
    expect(screen.getAllByTestId(/^dog-leg-/)).toHaveLength(4);
    expect(screen.getAllByTestId(/^dog-paw-/)).toHaveLength(4);
    expect(screen.getByTestId('dog-muzzle')).toBeVisible();
    expect(screen.getByTestId('dog-nose')).toBeVisible();
    expect(screen.getByTestId('dog-eye-left')).toBeVisible();
    expect(screen.getByTestId('dog-eye-right')).toBeVisible();
    expect(screen.getByTestId('dog-mouth')).toBeVisible();
    expect(screen.getAllByTestId(/^dog-cheek-/)).toHaveLength(2);
    expect(screen.getByTestId('dog-tail')).toBeVisible();
    expect(screen.queryByTestId('dog-watermelon')).not.toBeInTheDocument();
  });

  it.each(['idle', 'thinking', 'speaking'] as const)('maps %s to the root activity class', (activity) => {
    render(<MaxDogSprite activity={activity} />);

    expect(screen.getByTestId('max-dog-sprite')).toHaveClass(`max-dog-${activity}`);
  });
});
