export const memoryKinds = ['profile', 'study', 'shared'] as const;

export type MemoryKind = (typeof memoryKinds)[number];

export type MemoryDraft = {
  content: string;
  kind: MemoryKind;
  importance: 1 | 2 | 3 | 4 | 5;
};

export function isMemoryDraft(value: unknown): value is MemoryDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Partial<Record<keyof MemoryDraft, unknown>>;
  return (
    typeof draft.content === 'string' &&
    draft.content.trim().length > 0 &&
    draft.content.trim().length <= 800 &&
    typeof draft.kind === 'string' &&
    memoryKinds.includes(draft.kind as MemoryKind) &&
    typeof draft.importance === 'number' &&
    Number.isInteger(draft.importance) &&
    draft.importance >= 1 &&
    draft.importance <= 5
  );
}
