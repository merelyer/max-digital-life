import { deriveRoomState } from '@max/domain';
import type { ReactElement } from 'react';
import maxDogAsset from '../assets/max-dog.png';

export function MaxRoom(props: { memoryCount: number }): ReactElement {
  const room = deriveRoomState({ nowIso: new Date().toISOString(), memoryCount: props.memoryCount });
  const labels = { morning: '清晨', day: '白天', evening: '傍晚', night: '夜里' } as const;
  return (
    <section className={`room-card room-${room.timeOfDay}`} aria-label="Max 的房间">
      <div className="room-topline">
        <span className="room-tag">ROOM 01 / {labels[room.timeOfDay]}</span>
        <span className="room-pulse" aria-label={`Max 现在${room.mood === 'sleepy' ? '有点困' : room.mood === 'curious' ? '很有好奇心' : '安静地等着'}`} />
      </div>
      <div className="room-scene">
        <div className="window-glow" aria-hidden="true" />
        <div className="desk-line" aria-hidden="true" />
        <div className="room-note">{room.sceneNote}</div>
        <img className="max-dog" src={maxDogAsset} alt="Max，白色小狗" />
        <div className="room-object room-object-book" aria-hidden="true">线性<br />笔记</div>
        <div className="room-object room-object-mug" aria-hidden="true">◒</div>
        <div className="room-carpet" aria-hidden="true" />
      </div>
      <div className="room-caption">
        <div>
          <p className="eyebrow">MAX IS HERE</p>
          <h2>白色小狗，住在你的屏幕里。</h2>
        </div>
        <span className="room-status">{room.mood === 'sleepy' ? '低声陪你' : '等你开口'}</span>
      </div>
    </section>
  );
}
