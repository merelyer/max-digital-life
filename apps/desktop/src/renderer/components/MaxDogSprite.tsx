import type { ReactElement } from 'react';
import type { RoomActivity } from '../types';

type MaxDogSpriteProps = {
  activity?: RoomActivity;
};

type SpriteRow = 'idle' | 'waiting' | 'waving';

const spriteRows: Record<RoomActivity, SpriteRow> = {
  idle: 'idle',
  thinking: 'waiting',
  speaking: 'waving',
};

const spriteSrc = './assets/max/corgi-scout/spritesheet.webp';

/** Max's local Corgi Scout sprite with activity-driven animation rows. */
export function MaxDogSprite({ activity = 'idle' }: MaxDogSpriteProps): ReactElement {
  const row = spriteRows[activity];

  return (
    <div
      className={`max-dog max-dog-${activity}`}
      role="img"
      aria-label="Max，动态小狗"
      data-testid="max-dog-sprite"
      data-sprite-row={row}
      data-sprite-src={spriteSrc}
      style={{ backgroundImage: `url('${spriteSrc}')` }}
    />
  );
}
