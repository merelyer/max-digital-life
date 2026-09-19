import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MaxRoom } from './MaxRoom';

describe('MaxRoom', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a living ambient scene and a thinking cue', () => {
    render(<MaxRoom memoryCount={0} activity="thinking" />);

    expect(screen.getByTestId('room-specks')).toBeVisible();
    expect(screen.getByTestId('room-steam')).toBeVisible();
    expect(screen.getByTestId('room-backdrop')).toBeVisible();
    expect(screen.getByLabelText('Max 正在想事情')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Max，动态小狗' })).toHaveClass('max-dog-thinking');
  });

  it('labels the imported animated character without changing activity state', () => {
    render(<MaxRoom memoryCount={0} activity="speaking" />);

    expect(screen.getByRole('img', { name: 'Max，动态小狗' })).toHaveClass('max-dog-speaking');
    expect(screen.getByText('动态小狗，住在你的屏幕里。')).toBeVisible();
  });

  it('keeps the local clock and room label in sync as the evening begins', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 19, 17, 59, 30));
    render(<MaxRoom memoryCount={0} />);

    expect(screen.getByTestId('room-clock')).toHaveTextContent('17:59');
    expect(screen.getByText('ROOM 01 / 白天')).toBeVisible();

    vi.setSystemTime(new Date(2026, 8, 19, 18, 0, 0));
    act(() => vi.advanceTimersByTime(30_000));

    expect(screen.getByTestId('room-clock')).toHaveTextContent('18:00');
    expect(screen.getByText('ROOM 01 / 傍晚')).toBeVisible();
  });
});
