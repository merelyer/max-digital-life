import { useState, type FormEvent, type ReactElement } from 'react';
import type { AuthSurface } from '../types';

export function LoginPanel(props: { auth: AuthSurface; onAuthenticated: () => void }): ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(mode: 'signIn' | 'signUp', event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await props.auth[mode](email.trim(), password);
      props.onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '登录暂时失败，请稍后再试。');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-mark" aria-hidden="true">M<span>。</span></div>
        <p className="eyebrow">MAX · DESKTOP COMPANION</p>
        <h1 id="login-title">让 Max 认出你</h1>
        <p className="login-lede">登录后，你们的对话和共同记忆会跟着你走到下一台电脑。</p>
        <form onSubmit={(event) => { void submit('signIn', event); }}>
          <label>
            邮箱
            <input aria-label="邮箱" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            密码
            <input aria-label="密码" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="login-actions">
            <button className="button button-primary" type="submit" disabled={pending}>{pending ? '正在连接…' : '登录'}</button>
            <button className="button button-quiet" type="button" disabled={pending} onClick={(event) => { void submit('signUp', event as unknown as FormEvent<HTMLFormElement>); }}>注册</button>
          </div>
        </form>
        <p className="login-note">Max 只使用登录后的会话访问你的记忆。</p>
      </section>
    </main>
  );
}
