import { describe, expect, it } from 'vitest';
import { shouldDeliverProactiveMessage } from './proactive';

describe('shouldDeliverProactiveMessage', () => {
  it('refuses a third message on the same calendar date', () => {
    expect(shouldDeliverProactiveMessage({ enabled: true, deliveredToday: 2, hasReason: true })).toBe(false);
  });

  it('refuses messages when the user turns them off', () => {
    expect(shouldDeliverProactiveMessage({ enabled: false, deliveredToday: 0, hasReason: true })).toBe(false);
  });
});
