import { useState } from 'react';
import { useAuthStore, useUIStore } from '../store';
import Icon from '../components/ui/Icon';
import AuthCover from '../components/ui/AuthCover';

/**
 * Shown when the user arrives via a password-recovery email link
 * (auth store sets passwordRecovery on the PASSWORD_RECOVERY event).
 */
export default function ResetPasswordPage() {
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const signOut = useAuthStore((s) => s.signOut);
  const addToast = useUIStore((s) => s.addToast);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await updatePassword(password);
    if (err) {
      setError(err);
      setSaving(false);
      return;
    }
    addToast({ message: 'Password updated — you are signed in.', type: 'success' });
  };

  return (
    <div className="auth">
      <AuthCover compact />
      <main className="auth-main">
        <div className="auth-form-wrap">
          <h1 className="auth-title">Choose a new password</h1>
          <p className="auth-sub">You followed a reset link. Set a new password to get back into your workspace.</p>
          <form onSubmit={handleSubmit} className="auth-stack" style={{ marginTop: 28 }} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="new-password">New password</label>
              <div className="input-affix">
                <span className="affix-icon"><Icon name="lock" size={16} /></span>
                <input id="new-password" className="tinput tinput-lg" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus placeholder="At least 8 characters" />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="confirm-password">Confirm password</label>
              <div className="input-affix">
                <span className="affix-icon"><Icon name="lock" size={16} /></span>
                <input id="confirm-password" className="tinput tinput-lg" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Re-enter the password" aria-invalid={(confirm.length > 0 && confirm !== password) || undefined} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--t-sm)', color: 'var(--ink-2)', cursor: 'pointer' }}>
              <span className="switch">
                <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
                <span className="switch-track" />
              </span>
              Show passwords
            </label>
            {error && (
              <div role="alert" className="notice notice-danger"><Icon name="alert" size={16} /><span className="notice-text">{error}</span></div>
            )}
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={saving}>
              {saving ? <><Icon name="spark" size={16} className="spin" /> Saving…</> : <><Icon name="check" size={16} strokeWidth={2.2} /> Update password</>}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={signOut} disabled={saving}>
              Cancel and sign out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
