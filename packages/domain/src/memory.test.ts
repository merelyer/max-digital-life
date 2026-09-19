import { describe, expect, it } from 'vitest';
import { isMemoryDraft } from './memory';

describe('isMemoryDraft', () => {
  it('accepts a bounded, typed memory draft', () => {
    expect(isMemoryDraft({ content: 'Max should remember my exam date.', kind: 'study', importance: 4 })).toBe(true);
  });

  it('rejects empty content and out-of-range importance', () => {
    expect(isMemoryDraft({ content: '', kind: 'study', importance: 4 })).toBe(false);
    expect(isMemoryDraft({ content: 'too important', kind: 'study', importance: 6 })).toBe(false);
  });
});
