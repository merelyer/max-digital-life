import { describe, expect, it } from 'vitest';
import { getServerPort } from './server';

describe('getServerPort', () => {
  it('uses PORT when Render provides it', () => {
    expect(getServerPort({ PORT: '10000' })).toBe(10000);
  });

  it('falls back to the local development port', () => {
    expect(getServerPort({})).toBe(3100);
  });
});
