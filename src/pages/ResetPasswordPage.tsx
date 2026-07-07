import { useState } from 'react';
import { useAuthStore, useUIStore } from '../store';

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
    <div className="onboarding-page">
      <div className="onboarding-card" style={{ maxWidth: 440 }}>
        <div className="onboarding-header">
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>
            Choose a new password
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
            You followed a password-reset link. Set a new password to continue.
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="onboarding-body">
            <div className="input-wrap">
              <label className="input-label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                className="tinput"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <div className="input-wrap">
              <label className="input-label" htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                className="tinput"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              Show passwords
            </label>
            {error && (
              <div role="alert" style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10, color: 'var(--danger)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
          </div>
          <div className="onboarding-footer">
            <button type="button" className="btn btn-ghost" onClick={signOut} disabled={saving}>
              Cancel &amp; sign out
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
