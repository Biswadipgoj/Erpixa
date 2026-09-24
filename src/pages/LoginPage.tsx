import { useState, useEffect } from 'react';
import { useAuthStore, useUIStore } from '../store';
import Icon from '../components/ui/Icon';
import AuthCover from '../components/ui/AuthCover';

type Tab = 'signin' | 'signup';

const PW_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const PW_TONES = ['var(--danger)', 'var(--warning)', 'var(--info)', 'var(--success)'];

function Spinner() {
  return <Icon name="spark" size={16} className="spin" />;
}

function Notice({ tone, children }: { tone: 'danger' | 'success' | 'info'; children: React.ReactNode }) {
  const icon = tone === 'danger' ? 'alert' : tone === 'success' ? 'check' : 'info';
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`notice notice-${tone}`}>
      <Icon name={icon} size={16} />
      <span className="notice-text">{children}</span>
    </div>
  );
}

function PasswordInput({ id, value, onChange, show, onToggle, placeholder, autoComplete, invalid }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: string;
  invalid?: boolean;
}) {
  return (
    <div className="input-affix has-btn">
      <span className="affix-icon"><Icon name="lock" size={16} /></span>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="tinput tinput-lg"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
      />
      <button type="button" className="icon-btn sm affix-btn" onClick={onToggle} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
        <Icon name={show ? 'eye-off' : 'eye'} size={16} />
      </button>
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
  const mismatch = confirmPw.length > 0 && confirmPw !== password;

  const title = forgotMode ? 'Reset your password' : tab === 'signin' ? 'Welcome back' : 'Open your books';
  const sub = forgotMode
    ? 'We’ll email you a secure link to choose a new one.'
    : tab === 'signin' ? 'Sign in to pick up where your team left off.' : 'Create an account — setup takes about two minutes.';

  const emailField = (autoFocus: boolean) => (
    <div className="field">
      <label className="field-label" htmlFor="auth-email">Work email</label>
      <div className="input-affix">
        <span className="affix-icon"><Icon name="mail" size={16} /></span>
        <input id="auth-email" type="email" className="tinput tinput-lg" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus={autoFocus} />
      </div>
    </div>
  );

  return (
    <div className="auth">
      <AuthCover />

      <main className="auth-main">
        <div className="auth-form-wrap">
          <div key={`${tab}-${forgotMode}`} className="auth-panel">
            <h1 className="auth-title">{title}</h1>
            <p className="auth-sub">{sub}</p>
          </div>

          <div className="auth-stack" style={{ marginTop: 28 }}>
            {!forgotMode && (
              <div className="segmented" role="tablist" aria-label="Sign in or create an account">
                <span className="segmented-thumb" aria-hidden="true" style={{ width: 'calc(50% - 3px)', transform: `translateX(${tab === 'signin' ? 0 : 100}%)` }} />
                {(['signin', 'signup'] as Tab[]).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => switchTab(t)}>
                    {t === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>
            )}

            {!forgotMode && (
              <>
                <button type="button" onClick={handleGoogle} disabled={busy} className="btn btn-secondary btn-lg btn-block">
                  {googleLoading ? <Spinner /> : <Icon name="google" size={18} />}
                  {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
                </button>
                <div className="or-rule">or with email</div>
              </>
            )}

            {tab === 'signin' && !forgotMode && (
              <form onSubmit={handleSignIn} noValidate className="auth-stack auth-panel" key="signin">
                {emailField(true)}
                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="field-label" htmlFor="auth-password">Password</label>
                    <button type="button" className="link-btn" onClick={() => { setForgotMode(true); setError(''); setSuccess(''); }}>Forgot password?</button>
                  </div>
                  <PasswordInput id="auth-password" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((v) => !v)} placeholder="Your password" autoComplete="current-password" />
                </div>
                {error && <Notice tone="danger">{error}</Notice>}
                {success && <Notice tone="success">{success}</Notice>}
                <button type="submit" className="btn btn-primary btn-lg btn-block btn-arrow" disabled={busy}>
                  {loading ? <><Spinner /> Signing in…</> : <>Sign in <Icon name="arrow-right" size={16} /></>}
                </button>
              </form>
            )}

            {tab === 'signup' && !forgotMode && (
              <form onSubmit={handleSignUp} noValidate className="auth-stack auth-panel" key="signup">
                <div className="field">
                  <label className="field-label" htmlFor="auth-name">Full name</label>
                  <div className="input-affix">
                    <span className="affix-icon"><Icon name="user" size={16} /></span>
                    <input id="auth-name" className="tinput tinput-lg" placeholder="Priya Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" autoFocus />
                  </div>
                </div>
                {emailField(false)}
                <div className="field">
                  <label className="field-label" htmlFor="auth-new-password">Password <span className="muted" style={{ fontWeight: 400 }}>· at least 8 characters</span></label>
                  <PasswordInput id="auth-new-password" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((v) => !v)} placeholder="Create a password" autoComplete="new-password" />
                  {password.length > 0 && (
                    <div className="pw-meter" aria-live="polite">
                      {[1, 2, 3, 4].map((lvl) => (
                        <i key={lvl} className={lvl <= pwStrength ? 'on' : ''} style={{ background: lvl <= pwStrength ? PW_TONES[pwStrength - 1] : undefined }} />
                      ))}
                      <span>{PW_LABELS[pwStrength]}</span>
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="auth-confirm">Confirm password</label>
                  <PasswordInput id="auth-confirm" value={confirmPw} onChange={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} placeholder="Re-enter password" autoComplete="new-password" invalid={mismatch} />
                  {mismatch && <span className="field-error" role="alert"><Icon name="alert" size={12} strokeWidth={2} /> Passwords don’t match</span>}
                </div>
                {error && <Notice tone="danger">{error}</Notice>}
                {success && <Notice tone="success">{success}</Notice>}
                <button type="submit" className="btn btn-primary btn-lg btn-block btn-arrow" disabled={busy}>
                  {loading ? <><Spinner /> Creating account…</> : <>Create account <Icon name="arrow-right" size={16} /></>}
                </button>
                <p className="auth-legal">By creating an account you agree to our Terms &amp; Privacy Policy.</p>
              </form>
            )}

            {forgotMode && (
              <form onSubmit={handleForgot} noValidate className="auth-stack auth-panel" key="forgot">
                {emailField(true)}
                {error && <Notice tone="danger">{error}</Notice>}
                {success && <Notice tone="success">{success}</Notice>}
                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
                  {loading ? <><Spinner /> Sending…</> : <><Icon name="mail" size={16} /> Send reset link</>}
                </button>
                <button type="button" onClick={() => { setForgotMode(false); setError(''); setSuccess(''); }} className="btn btn-ghost btn-block btn-arrow btn-back">
                  <Icon name="arrow-left" size={16} /> Back to sign in
                </button>
              </form>
            )}
          </div>

          <div className="auth-secure">
            <Icon name="lock" size={13} /> Sessions secured by Supabase Auth · data isolated per workspace
          </div>
        </div>
      </main>
    </div>
  );
}
