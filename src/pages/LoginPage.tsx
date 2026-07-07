import { useState, useEffect } from 'react';
import { useAuthStore, useUIStore } from '../store';
import Icon from '../components/ui/Icon';

type Tab = 'signin' | 'signup';

const PW_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const PW_COLORS = ['#DC2626', '#EA580C', '#D97706', '#16A34A'];

function Spinner() {
  return <Icon name="spark" size={16} className="spin" />;
}

function Notice({ tone, children }: { tone: 'danger' | 'success' | 'info'; children: React.ReactNode }) {
  const bg = `var(--${tone}-bg)`;
  const border = `var(--${tone}-border)`;
  const color = `var(--${tone})`;
  return (
    <div role="alert" style={{ padding: '10px 14px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color, fontSize: '0.85rem', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export default function LoginPage() {
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const addToast = useUIStore((s) => s.addToast);

  const [tab, setTab] = useState<Tab>('signin');
  const [forgotMode, setForgotMode] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Surface an OAuth error redirected back from /auth/callback.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      setError(params.get('error_description') ?? urlError);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t); setError(''); setSuccess(''); setForgotMode(false);
    setPassword(''); setConfirmPw(''); setShowPassword(false); setShowConfirm(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true); setError(''); setSuccess('');
    const { error: err } = await signInWithEmail(email, password);
    if (err) { setError(err); setLoading(false); }
    else addToast({ message: 'Welcome back.', type: 'success' });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Enter your full name.'); return; }
    if (!email) { setError('Enter your email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(''); setSuccess('');
    const { error: err, message } = await signUpWithEmail(email, password, fullName.trim());
    if (err) { setError(err); setLoading(false); }
    else if (message) { setSuccess(message); setLoading(false); }
    else addToast({ message: 'Account created — welcome to Erpixa.', type: 'success' });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Enter your email address.'); return; }
    setLoading(true); setError(''); setSuccess('');
    const { error: err, message } = await resetPassword(email);
    if (err) setError(err);
    else setSuccess(message ?? 'Reset link sent — check your inbox.');
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('');
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err); setGoogleLoading(false); }
  };

  const pwStrength = Math.min(4, Math.floor(password.length / 3));
  const busy = loading || googleLoading;

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, background: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>E</div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Erpixa</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {forgotMode ? 'Reset your password' : tab === 'signin' ? 'Sign in to your workspace' : 'Create your account'}
          </p>
        </div>

        {!forgotMode && (
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', padding: 3, marginBottom: 20, gap: 3 }}>
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button key={t} type="button" onClick={() => switchTab(t)}
                style={{ flex: 1, height: 34, borderRadius: 'var(--r-sm)', fontWeight: 600, fontSize: '0.875rem',
                  background: tab === t ? 'var(--bg-surface)' : 'transparent',
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: tab === t ? 'var(--shadow-xs)' : 'none' }}>
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>
        )}

        {!forgotMode && (
          <>
            <button type="button" onClick={handleGoogle} disabled={busy} className="btn btn-secondary w-full" style={{ height: 44, marginBottom: 16 }}>
              {googleLoading ? <Spinner /> : <Icon name="google" size={18} />}
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ color: 'var(--text-disabled)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>or email</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        )}

        {tab === 'signin' && !forgotMode && (
          <form onSubmit={handleSignIn} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-wrap">
              <label className="login-field-label">Email</label>
              <input type="email" className="login-input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
            </div>
            <div className="input-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="login-field-label" style={{ margin: 0 }}>Password</label>
                <button type="button" onClick={() => { setForgotMode(true); setError(''); setSuccess(''); }} style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600 }}>Forgot?</button>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="login-input" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={17} />
                </button>
              </div>
            </div>
            {error && <Notice tone="danger">{error}</Notice>}
            {success && <Notice tone="success">{success}</Notice>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ height: 44 }}>
              {loading ? <><Spinner /> Signing in…</> : 'Sign in'}
            </button>
          </form>
        )}

        {tab === 'signup' && !forgotMode && (
          <form onSubmit={handleSignUp} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-wrap">
              <label className="login-field-label">Full name</label>
              <input className="login-input" placeholder="Jane Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" autoFocus />
            </div>
            <div className="input-wrap">
              <label className="login-field-label">Email</label>
              <input type="email" className="login-input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="input-wrap">
              <label className="login-field-label">Password <span style={{ color: 'var(--text-disabled)', fontWeight: 400 }}>(min. 8)</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="login-input" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={17} />
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[1, 2, 3, 4].map((lvl) => (
                    <div key={lvl} style={{ flex: 1, height: 3, borderRadius: 99, background: lvl <= pwStrength ? PW_COLORS[pwStrength - 1] : 'var(--border)' }} />
                  ))}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 4, whiteSpace: 'nowrap' }}>{PW_LABELS[pwStrength]}</span>
                </div>
              )}
            </div>
            <div className="input-wrap">
              <label className="login-field-label">Confirm password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} className="login-input" placeholder="Re-enter password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" style={{ paddingRight: 42, borderColor: confirmPw && confirmPw !== password ? 'var(--danger)' : undefined }} />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Icon name={showConfirm ? 'eye-off' : 'eye'} size={17} />
                </button>
              </div>
              {confirmPw && confirmPw !== password && <div style={{ marginTop: 4, fontSize: '0.78rem', color: 'var(--danger)' }}>Passwords don’t match</div>}
            </div>
            {error && <Notice tone="danger">{error}</Notice>}
            {success && <Notice tone="success">{success}</Notice>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ height: 44 }}>
              {loading ? <><Spinner /> Creating account…</> : 'Create account'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              By signing up you agree to our Terms &amp; Privacy Policy.
            </p>
          </form>
        )}

        {forgotMode && (
          <form onSubmit={handleForgot} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Notice tone="info">Enter your registered email and we’ll send you a secure reset link.</Notice>
            <div className="input-wrap">
              <label className="login-field-label">Email</label>
              <input type="email" className="login-input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
            </div>
            {error && <Notice tone="danger">{error}</Notice>}
            {success && <Notice tone="success">{success}</Notice>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy} style={{ height: 44 }}>
              {loading ? <><Spinner /> Sending…</> : 'Send reset link'}
            </button>
            <button type="button" onClick={() => { setForgotMode(false); setError(''); setSuccess(''); }} className="btn btn-ghost w-full">
              Back to sign in
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-disabled)', fontSize: '0.72rem', margin: 0 }}>Secured with Supabase authentication</p>
        </div>
      </div>
    </div>
  );
}
