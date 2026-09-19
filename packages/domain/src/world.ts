export type RoomStateInput = {
  nowIso: string;
  memoryCount: number;
};

export type RoomState = {
  timeOfDay: 'morning' | 'day' | 'evening' | 'night';
  mood: 'quiet' | 'curious' | 'sleepy';
  sceneNote: string;
};

export function deriveRoomState(input: RoomStateInput): RoomState {
  const hour = new Date(input.nowIso).getHours();
  const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'day' : hour < 23 ? 'evening' : 'night';
  const mood = timeOfDay === 'night' ? 'sleepy' : input.memoryCount > 0 ? 'curious' : 'quiet';
  const sceneNote = timeOfDay === 'night'
    ? 'Max 把桌面灯调暗了。'
    : input.memoryCount > 0
      ? 'Max 正在整理你们共同留下的记忆。'
      : 'Max 在桌面上等你。';
  return { timeOfDay, mood, sceneNote };
}
