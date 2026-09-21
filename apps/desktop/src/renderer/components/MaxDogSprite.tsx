import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { RoomActivity } from '../types';
import { DOG_CLIPS, chooseDogAction, restingDelay, type DogAction, type DogFrame } from '../lib/dog-behavior';

const spriteSrc = './assets/max/corgi-scout/spritesheet.webp';
type Pose = { frame: DogFrame; action: DogAction; x: number };

export function MaxDogSprite({ activity = 'idle', random = Math.random }: { activity?: RoomActivity; random?: () => number }): ReactElement {
  const position = useRef(0.5);
  const [pose, setPose] = useState<Pose>({ frame: [0, 0], action: 'sit', x: 0.5 });
  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const clear = (): void => { if (timer !== undefined) window.clearTimeout(timer); };
    const show = (frame: DogFrame, action: DogAction): void => {
      setPose({ frame, action, x: position.current });
    };
    const later = (fn: () => void, ms: number): void => {
      clear();
      if (!stopped && !document.hidden && !motion?.matches) timer = window.setTimeout(fn, ms);
    };
    const rest = (sleeping = false): void => {
      show(sleeping ? [5, 3] : [0, 0], sleeping ? 'sleep' : 'sit');
      later(() => play(chooseDogAction(random())), restingDelay(random(), sleeping));
    };
    const play = (action: DogAction): void => {
      if (action === 'sit') { rest(); return; }
      if (action === 'sleep') { show([5, 2], 'sleep'); later(() => rest(true), 450); return; }
      const walking = action === 'walk';
      const direction = position.current >= 0.56 ? -1 : position.current <= 0.44 ? 1 : random() < 0.5 ? -1 : 1;
      const clip = action === 'walk' ? DOG_CLIPS[direction > 0 ? 'walkRight' : 'walkLeft'] : DOG_CLIPS[action];
      let index = 0;
      const tick = (): void => {
        if (stopped) return;
        if (index === clip.length) {
          if (activity === 'idle') rest();
          else show(activity === 'thinking' ? [6, 0] : [0, 0], 'sit');
          return;
        }
        if (walking) position.current = Math.max(0.36, Math.min(0.64, position.current + direction * 0.008));
        show(clip[index]!, action);
        index += 1;
        later(tick, walking ? 180 : 260);
      };
      tick();
    };
    const start = (): void => {
      clear();
      show(activity === 'thinking' ? [6, 0] : [0, 0], 'sit');
      if (document.hidden || motion?.matches) return;
      if (activity === 'speaking') play('wave');
      else if (activity === 'thinking') play('look');
      else rest();
    };
    document.addEventListener('visibilitychange', start);
    motion?.addEventListener('change', start);
    start();
    return () => {
      stopped = true;
      clear();
      document.removeEventListener('visibilitychange', start);
      motion?.removeEventListener('change', start);
    };
  }, [activity, random]);
  return <div className="dog-position" style={{ left: `${pose.x * 100}%` }}>
    <div className={`max-dog max-dog-${activity}`} role="img" aria-label="Max，动态小狗"
      data-testid="max-dog-sprite" data-sprite-src={spriteSrc} data-idle-behavior={pose.action}
      data-frame={`${pose.frame[0]}:${pose.frame[1]}`}
      style={{ backgroundImage: `url('${spriteSrc}')`, backgroundPosition: `${pose.frame[1] * 100 / 7}% ${pose.frame[0] * 100 / 8}%` }} />
  </div>;
}
