import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { adminApi, AdminApiError } from './adminApi';
import { Button, Input, Field } from './ui';

export type LoginMode = 'login' | 'forgot' | 'reset';

interface AdminLoginProps {
  mode: LoginMode;
  token?: string;
  onAuthenticated: () => void;
  onNavigate: (mode: LoginMode, token?: string) => void;
}

/**
 * Dedicated Super Admin authentication screen — completely separate from the
 * storefront. Sign in, request a reset link, or set a new password.
 */
export const AdminLogin: React.FC<AdminLoginProps> = ({
  mode,
  token,
  onAuthenticated,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState(token ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi.auth.login(email, password);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    setDevLink(null);
    try {
      const res = await adminApi.auth.forgotPassword(email);
      setNotice(res.message);
      if (res.devResetUrl) setDevLink(res.devResetUrl);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await adminApi.auth.resetPassword(resetToken, password, confirmPassword);
      setNotice(
        `Password updated. ${res.sessionsRevoked} existing session(s) were signed out. You can sign in now.`
      );
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  const heading =
    mode === 'login'
      ? { title: 'Super Admin', subtitle: 'Restricted access — authorized personnel only' }
      : mode === 'forgot'
        ? { title: 'Reset your password', subtitle: 'We will email a secure, single-use reset link' }
        : { title: 'Choose a new password', subtitle: 'Your reset link is valid for 30 minutes' };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Komback Control Centre</span>
          </div>
          <h1 className="text-2xl font-black text-white font-['Plus_Jakarta_Sans',sans-serif]">
            {heading.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">{heading.subtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-7">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Administrator email">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@komback.com"
                    className="pl-9"
                  />
                </div>
              </Field>

              <Field label="Password">
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </Field>

              {error && (
                <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                  <span>{error}</span>
                </p>
              )}

              <Button type="submit" loading={busy} className="w-full py-2.5">
                {!busy && <ArrowRight className="w-4 h-4" />}
                Sign in to control centre
              </Button>

              <button
                type="button"
                onClick={() => onNavigate('forgot')}
                className="w-full text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Forgot your password?
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <Field
                label="Administrator email"
                hint="For security we always show the same confirmation, whether or not the address exists."
              >
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@komback.com"
                    className="pl-9"
                  />
                </div>
              </Field>

              {error && (
                <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  {error}
                </p>
              )}

              {notice && (
                <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px" />
                  <span>{notice}</span>
                </p>
              )}

              {devLink && (
                <div className="text-[11px] bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <p className="font-bold text-amber-900">
                    No email provider is configured, so the link below was also written to the server
                    log. Set <code className="font-mono">EMAIL_API_URL</code> /{' '}
                    <code className="font-mono">EMAIL_API_KEY</code> / <code className="font-mono">EMAIL_FROM</code>{' '}
                    to send it by email instead.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const url = new URL(devLink, window.location.origin);
                      onNavigate('reset', url.searchParams.get('token') ?? '');
                    }}
                    className="font-mono text-[10px] break-all text-emerald-700 underline cursor-pointer text-left"
                  >
                    {devLink}
                  </button>
                </div>
              )}

              <Button type="submit" loading={busy} className="w-full py-2.5">
                Send reset link
              </Button>

              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-bold text-slate-600">
                  Reset token loaded from your link
                </span>
              </div>

              {!token && (
                <Field label="Reset token" hint="Paste the token from your reset email.">
                  <Input value={resetToken} onChange={(e) => setResetToken(e.target.value)} required />
                </Field>
              )}

              <Field label="New password" hint="Minimum 8 characters.">
                <Input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              <Field label="Confirm new password">
                <Input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>

              {error && (
                <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  {error}
                </p>
              )}

              {notice && (
                <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  {notice}
                </p>
              )}

              <Button type="submit" loading={busy} className="w-full py-2.5">
                Update password
              </Button>

              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          <a href="/" className="hover:text-emerald-400 transition-colors">
            ← Return to the Komback storefront
          </a>
        </p>
        <p className="text-center text-[10px] text-slate-600 mt-3 flex items-center justify-center gap-1.5">
          <Loader2 className="w-3 h-3" />
          Every sign-in attempt and change is recorded in the audit trail.
        </p>
      </div>
    </div>
  );
};
