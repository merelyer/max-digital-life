import { useState, type ReactElement } from 'react';
import type { ApiSurface } from '../types';

export function SettingsPanel(props: { api: ApiSurface; enabled: boolean; onEnabledChange: (enabled: boolean) => void }): ReactElement {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(): Promise<void> {
    const next = !props.enabled;
    setPending(true);
    setError(null);
    try {
      await props.api.setProactiveEnabled(next);
      props.onEnabledChange(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '主动消息设置没有保存。');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="settings-panel" aria-labelledby="settings-title">
      <div className="panel-header compact"><div><p className="eyebrow">SMALL SETTINGS</p><h2 id="settings-title">相处方式</h2></div><span className="settings-mark" aria-hidden="true">✦</span></div>
      <label className="switch-row">
        <span><strong>允许 Max 主动来找我</strong><small>{props.enabled ? '每天随机来找你，次数不固定。' : 'Max 不会主动发消息'}</small></span>
        <input type="checkbox" role="switch" aria-label="允许 Max 主动来找我" checked={props.enabled} onChange={() => { void toggle(); }} disabled={pending} />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>
  );
}
