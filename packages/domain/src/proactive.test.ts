import { describe, expect, it } from 'vitest';
import { shouldDeliverProactiveMessage } from './proactive';

describe('shouldDeliverProactiveMessage', () => {
  it('does not impose a daily message limit when Max is enabled', () => {
    expect(shouldDeliverProactiveMessage({ enabled: true, deliveredToday: 2, hasReason: true })).toBe(true);
    expect(shouldDeliverProactiveMessage({ enabled: true, deliveredToday: 200, hasReason: true })).toBe(true);
  });

  it('refuses messages when the user turns them off', () => {
    expect(shouldDeliverProactiveMessage({ enabled: false, deliveredToday: 0, hasReason: true })).toBe(false);
  });
});
