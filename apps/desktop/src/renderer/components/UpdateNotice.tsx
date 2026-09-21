import { useEffect, useState, type ReactElement } from 'react';

type UpdateState = {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'disabled';
  version?: string;
  percent?: number;
};

export function UpdateNotice(): ReactElement | null {
  const [state, setState] = useState<UpdateState>({ status: 'idle' });

  useEffect(() => {
    const updates = window.maxDesktop?.updates;
    if (!updates) return undefined;
    let active = true;
    void updates.getState().then((next) => { if (active) setState(next); });
    const unsubscribe = updates.onState((next) => setState(next));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (state.status === 'idle' || state.status === 'checking' || state.status === 'disabled') return null;
  if (state.status === 'error') {
    return <aside className="update-notice" role="status"><span>暂时无法检查更新。</span><button type="button" onClick={() => { void window.maxDesktop.updates.check(); }}>再试一次</button></aside>;
  }
  if (state.status === 'available') {
    return <aside className="update-notice" role="status"><span>Max {state.version} 已准备好下载。</span><button type="button" onClick={() => { void window.maxDesktop.updates.download(); }}>下载更新</button></aside>;
  }
  if (state.status === 'downloading') {
    return <aside className="update-notice" role="status"><span>正在下载更新 {state.percent ?? 0}%</span></aside>;
  }
  return <aside className="update-notice" role="status"><span>更新已下载。</span><button type="button" onClick={() => { void window.maxDesktop.updates.install(); }}>重启并安装</button></aside>;
}
