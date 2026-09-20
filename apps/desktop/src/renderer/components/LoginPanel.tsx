import { useState, type FormEvent, type ReactElement } from 'react';
import type { AuthSurface } from '../types';

export function LoginPanel(props: { auth: AuthSurface; onAuthenticated: () => void }): ReactElement {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isSignUp = mode === 'signUp';

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const session = await props.auth[mode](email.trim(), password);
      if (session) {
        props.onAuthenticated();
      } else if (isSignUp) {
        setNotice('注册成功，请检查邮箱完成验证后再登录。');
      } else {
        setError('登录未完成，请检查邮箱和密码。');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '登录暂时失败，请稍后再试。');
    } finally {
      setPending(false);
    }
  }

  function switchMode(): void {
    if (pending) return;
    setMode((current) => current === 'signIn' ? 'signUp' : 'signIn');
    setError(null);
    setNotice(null);
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-mark" aria-hidden="true">M<span>。</span></div>
        <p className="eyebrow">MAX · DESKTOP COMPANION</p>
        <h1 id="login-title">{isSignUp ? '创建 Max 账号' : '让 Max 认出你'}</h1>
        <p className="login-lede">{isSignUp ? '注册后，Max 会记住你们共同生活的点滴。' : '登录后，你们的对话和共同记忆会跟着你走到下一台电脑。'}</p>
        <form onSubmit={(event) => { void submit(event); }}>
          <label>
            邮箱
            <input aria-label="邮箱" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            密码
            <input aria-label="密码" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {notice ? <p className="form-success" role="status">{notice}</p> : null}
          <div className="login-actions">
            <button className="button button-primary" type="submit" disabled={pending}>{pending ? (isSignUp ? '正在创建…' : '正在连接…') : (isSignUp ? '创建账号' : '登录')}</button>
            <button className="button button-quiet" type="button" disabled={pending} onClick={switchMode}>{isSignUp ? '返回登录' : '注册'}</button>
          </div>
        </form>
        <p className="login-note">{isSignUp ? '已有账号？点击“返回登录”。' : 'Max 只使用登录后的会话访问你的记忆。'}</p>
      </section>
    </main>
  );
}
