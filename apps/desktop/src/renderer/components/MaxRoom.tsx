import { deriveRoomState } from '@max/domain';
import { useEffect, useState, type ReactElement } from 'react';
import type { RoomActivity } from '../types';
import { MaxDogSprite } from './MaxDogSprite';

export function MaxRoom(props: { memoryCount: number; activity?: RoomActivity }): ReactElement {
  const activity = props.activity ?? 'idle';
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const room = deriveRoomState({ nowIso: now.toISOString(), memoryCount: props.memoryCount });
  const clock = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const labels = { morning: '清晨', day: '白天', evening: '傍晚', night: '夜里' } as const;
  const activityLabels: Record<RoomActivity, string> = { idle: 'Max 正在等你说话', thinking: 'Max 正在想事情', speaking: 'Max 正在回应你' };
  const idleSceneNote = room.sceneNote === 'Max 在桌面上等你。' ? 'Max 在暖木书房等你。' : room.sceneNote;
  const sceneNotes: Record<RoomActivity, string> = { idle: idleSceneNote, thinking: 'Max 正在把你的话放在心上。', speaking: 'Max 有话想认真回应你。' };
  return (
    <section className={`room-card room-${room.timeOfDay} room-study`} aria-label="Max 的暖木书房">
      <div className="room-topline">
        <div className="room-topline-left">
          <span className="room-tag">ROOM 01 / {labels[room.timeOfDay]}</span>
          <span className="room-clock" data-testid="room-clock" aria-label={`本地时间 ${clock}`}>{clock}</span>
        </div>
        <span className={`room-pulse room-pulse-${activity}`} aria-hidden="true" />
      </div>
      <div className={`room-scene scene-${activity}`}>
        <img className="room-art" data-testid="room-backdrop" src="./assets/max/study-room-v2.png" width="1536" height="1024" alt="窗边有书架、绿植和书桌的像素书房，中间铺着暖色地毯" />
        <MaxDogSprite activity={activity} />
        <span className="room-activity" aria-label={activityLabels[activity]}>{activityLabels[activity]}</span>

      </div>
      <div className="room-caption">
        <div>
          <p className="room-description">{sceneNotes[activity]}</p>
          <h2>Max 在暖木书房等你</h2>
        </div>
        <span className={`room-status room-status-${activity}`}>{activity === 'thinking' ? '正在听你说' : activity === 'speaking' ? '正在回应' : room.mood === 'sleepy' ? '低声陪你' : '等你开口'}</span>
      </div>
    </section>
  );
}
