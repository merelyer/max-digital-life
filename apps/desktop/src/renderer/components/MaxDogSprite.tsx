import { useEffect, useState, type ReactElement } from 'react';
import type { RoomActivity } from '../types';

type MaxDogSpriteProps = {
  activity?: RoomActivity;
  random?: () => number;
};

type SpriteRow = 'idle' | 'waiting' | 'waving';

const spriteRows: Record<RoomActivity, SpriteRow> = {
  idle: 'idle',
  thinking: 'waiting',
  speaking: 'waving',
};

const spriteSrc = './assets/max/corgi-scout/spritesheet.webp';
const idleBehaviors = ['settle', 'rest', 'wander', 'look'] as const;
type IdleBehavior = (typeof idleBehaviors)[number];
const IDLE_BEHAVIOR_MIN_MS = 12_000;
const IDLE_BEHAVIOR_MAX_MS = 30_000;

function clampRandom(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function nextIdleDelay(random: () => number): number {
  return Math.floor(IDLE_BEHAVIOR_MIN_MS + clampRandom(random()) * (IDLE_BEHAVIOR_MAX_MS - IDLE_BEHAVIOR_MIN_MS));
}

function chooseNextIdleBehavior(current: IdleBehavior, random: () => number): IdleBehavior {
  const choices = idleBehaviors.filter((behavior) => behavior !== current);
  const index = Math.min(choices.length - 1, Math.floor(clampRandom(random()) * choices.length));
  return choices[index] ?? 'settle';
}

/** Max's local Corgi Scout sprite with activity-driven animation rows. */
export function MaxDogSprite({ activity = 'idle', random = Math.random }: MaxDogSpriteProps): ReactElement {
  const row = spriteRows[activity];
  const [idleBehavior, setIdleBehavior] = useState<IdleBehavior>('settle');

  useEffect(() => {
    if (activity !== 'idle') {
      setIdleBehavior('settle');
      return undefined;
    }

    let active = true;
    let timer: number | undefined;
    const scheduleNext = (): void => {
      timer = window.setTimeout(() => {
        if (!active) return;
        setIdleBehavior((current) => chooseNextIdleBehavior(current, random));
        scheduleNext();
      }, nextIdleDelay(random));
    };

    scheduleNext();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [activity, random]);

  const behaviorClass = activity === 'idle' ? `max-dog-idle-behavior-${idleBehavior}` : '';

  return (
    <div
      className={`max-dog max-dog-${activity} ${behaviorClass}`.trim()}
      role="img"
      aria-label="Max，动态小狗"
      data-testid="max-dog-sprite"
      data-sprite-row={row}
      data-sprite-src={spriteSrc}
      data-idle-behavior={idleBehavior}
      style={{ backgroundImage: `url('${spriteSrc}')` }}
    />
  );
}
