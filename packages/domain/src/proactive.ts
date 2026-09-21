export type ProactiveEligibility = {
  enabled: boolean;
  deliveredToday: number;
  hasReason: boolean;
};

export function shouldDeliverProactiveMessage(input: ProactiveEligibility): boolean {
  return input.enabled && input.hasReason;
}
