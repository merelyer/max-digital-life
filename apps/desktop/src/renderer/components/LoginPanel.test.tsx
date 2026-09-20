import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginPanel } from './LoginPanel';
import type { AuthSurface } from '../types';

function makeAuth(overrides: Partial<AuthSurface> = {}): AuthSurface {
  return {
    getSession: async () => null,
    signIn: async () => null,
    signUp: async () => null,
    signOut: async () => undefined,
    ...overrides
  };
}

describe('LoginPanel', () => {
  it('switches to a separate registration view instead of submitting immediately', async () => {
    const signUp = vi.fn(async () => null);
    render(<LoginPanel auth={makeAuth({ signUp })} onAuthenticated={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '注册' }));

    expect(signUp).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: '创建 Max 账号' })).toBeVisible();
    expect(screen.getByRole('button', { name: '创建账号' })).toBeVisible();
  });

  it('explains that registration needs email confirmation when no session is returned', async () => {
    const onAuthenticated = vi.fn();
    const signUp = vi.fn(async () => null);
    render(<LoginPanel auth={makeAuth({ signUp })} onAuthenticated={onAuthenticated} />);

    await userEvent.click(screen.getByRole('button', { name: '注册' }));
    await userEvent.type(screen.getByRole('textbox', { name: '邮箱' }), 'max@example.com');
    await userEvent.type(screen.getByLabelText('密码'), '12345678');
    await userEvent.click(screen.getByRole('button', { name: '创建账号' }));

    expect(signUp).toHaveBeenCalledWith('max@example.com', '12345678');
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent('注册成功，请检查邮箱完成验证后再登录。');
  });
});
