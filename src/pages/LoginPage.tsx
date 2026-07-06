import React, { useState, useEffect } from 'react';
import { useAuthStore, useUIStore } from '../store';

type Tab = 'signin' | 'signup';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const SpinIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const EyeButton = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    style={{
      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'rgba(255,255,255,0.45)', padding: 4, lineHeight: 1,
    }}
    aria-label={show ? 'Hide password' : 'Show password'}
  >
    {show ? '🙈' : '👁️'}
  </button>
);

export default function LoginPage() {
  const signInWithEmail  = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail  = useAuthStore((s) => s.signUpWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const resetPassword    = useAuthStore((s) => s.resetPassword);
  const addToast         = useUIStore((s) => s.addToast);

  const isConfigured = !!(
    import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  );

  // ── Tabs ──────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('signin');

  // ── Shared state ──────────────────────────────────────────────
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // ── Sign-up extras ────────────────────────────────────────────
  const [fullName,   setFullName]   = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Forgot-password mode ──────────────────────────────────────
  const [forgotMode, setForgotMode] = useState(false);

  // Detect OAuth error params redirected back from /auth/callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    const urlErrorDesc = params.get('error_description') ?? params.get('error');
    if (urlError) {
      let msg = urlErrorDesc ?? urlError;
      // Friendlier message for the most common PKCE error
      if (msg.toLowerCase().includes('exchange') || msg.toLowerCase().includes('code')) {
        msg = 'Google sign-in failed: the redirect URL may not be registered in your Supabase dashboard. '
            + 'Add "' + window.location.origin + '/auth/callback" to Supabase → Auth → URL Configuration → Redirect URLs.';
      }
      setError(msg);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Reset form state when switching tabs
  const switchTab = (t: Tab) => {
    setTab(t);
    setError('');
    setSuccess('');
    setForgotMode(false);
    setPassword('');
    setConfirmPw('');
    setShowPassword(false);
    setShowConfirm(false);
  };

  // ── Handlers ──────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError(''); setSuccess('');
    const { error: err } = await signInWithEmail(email, password);
    if (err) { setError(err); setLoading(false); }
    else { addToast({ message: 'Welcome back! 👋', type: 'success' }); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email)           { setError('Please enter your email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(''); setSuccess('');
    const { error: err, message } = await signUpWithEmail(email, password, fullName.trim());
    if (err) { setError(err); setLoading(false); }
    else if (message) {
      setSuccess(message);
      setLoading(false);
    } else {
      addToast({ message: 'Account created! Welcome to Erpixa 🎉', type: 'success' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true); setError(''); setSuccess('');
    const { error: err, message } = await resetPassword(email);
    if (err) { setError(err); }
    else { setSuccess(message ?? 'Reset link sent — check your inbox.'); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('');
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err); setGoogleLoading(false); }
  };

  // ── Shared sub-components ─────────────────────────────────────
  const GoogleButton = () => (
    <button
      type="button"
      id="btn-google-auth"
      onClick={handleGoogle}
      disabled={googleLoading || loading}
      style={{
        width: '100%', height: 48, marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        background: '#fff', borderRadius: 12, border: 'none', cursor: 'pointer',
        fontFamily: 'Inter', fontWeight: 600, fontSize: '0.9375rem', color: '#1a1a1a',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        transition: 'all 0.18s ease',
        opacity: (googleLoading || loading) ? 0.7 : 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)'; }}
    >
      {googleLoading ? <SpinIcon color="#666" /> : <GoogleIcon />}
      {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
    </button>
  );

  const Divider = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div className="login-divider" style={{ flex: 1 }} />
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        or continue with email
      </span>
      <div className="login-divider" style={{ flex: 1 }} />
    </div>
  );

  const ErrorBox = ({ msg }: { msg: string }) => (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(239,68,68,0.15)',
      border: '1px solid rgba(239,68,68,0.4)',
      borderRadius: 10, color: '#FCA5A5', fontSize: '0.85rem',
      display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span>
      <span>{msg}</span>
    </div>
  );

  const SuccessBox = ({ msg }: { msg: string }) => (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(16,185,129,0.15)',
      border: '1px solid rgba(16,185,129,0.4)',
      borderRadius: 10, color: '#6EE7B7', fontSize: '0.85rem',
      display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>✅</span>
      <span>{msg}</span>
    </div>
  );

  const DemoNote = () => !isConfigured ? (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(245,158,11,0.15)',
      border: '1px solid rgba(245,158,11,0.4)',
      borderRadius: 10, color: '#FCD34D', fontSize: '0.8rem', lineHeight: 1.5,
    }}>
      🔧 <strong>Demo Mode:</strong> Supabase not configured. Enter any email + password to explore.
    </div>
  ) : null;

  const SubmitButton = ({ label }: { label: string }) => (
    <button
      type="submit"
      disabled={loading || googleLoading}
      style={{
        width: '100%', height: 48, marginTop: 4,
        background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
        border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter', fontWeight: 700, fontSize: '0.9375rem', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
        opacity: (loading || googleLoading) ? 0.7 : 1,
        transition: 'all 0.18s ease',
      }}
    >
      {loading ? <><SpinIcon /> {tab === 'signin' ? 'Signing in…' : forgotMode ? 'Sending…' : 'Creating account…'}</> : label}
    </button>
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="login-page">
      {/* Animated background blobs */}
      <div className="login-bg-blob" style={{ width: 600, height: 600, background: 'radial-gradient(circle, #4F46E5 0%, #7C3AED 100%)', top: -150, right: -150, opacity: 0.7 }} />
      <div className="login-bg-blob" style={{ width: 450, height: 450, background: 'radial-gradient(circle, #06B6D4 0%, #3B82F6 100%)', bottom: -100, left: -100, animationDelay: '-3s', opacity: 0.6 }} />
      <div className="login-bg-blob" style={{ width: 350, height: 350, background: 'radial-gradient(circle, #EC4899 0%, #F97316 100%)', bottom: 100, right: 300, animationDelay: '-1.5s', opacity: 0.5 }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${8 + i * 4}px`, height: `${8 + i * 4}px`,
          borderRadius: '50%',
          background: `rgba(255,255,255,${0.05 + i * 0.02})`,
          top: `${10 + i * 15}%`, left: `${5 + i * 14}%`,
          animation: `blobFloat ${5 + i}s ease-in-out infinite alternate`,
          animationDelay: `${-i * 0.8}s`,
        }} />
      ))}

      <div
        className="login-card"
        style={{ animation: 'modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* ── Brand ─────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 12px 32px rgba(99,102,241,0.45)',
            fontSize: '1.75rem',
          }}>✨</div>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.75rem', color: '#fff', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Erpixa <span style={{ background: 'linear-gradient(135deg, #A78BFA, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ERP</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', fontWeight: 500 }}>
            {forgotMode ? 'Reset your password' : tab === 'signin' ? 'Sign in to your workspace' : 'Create your account'}
          </p>
        </div>

        {/* ── Tabs (hidden in forgot-password mode) ─────────── */}
        {!forgotMode && (
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 4, marginBottom: 22, gap: 4,
          }}>
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                id={`tab-${t}`}
                onClick={() => switchTab(t)}
                style={{
                  flex: 1, height: 36, border: 'none', borderRadius: 9, cursor: 'pointer',
                  fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  background: tab === t
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.85) 0%, rgba(6,182,212,0.85) 100%)'
                    : 'transparent',
                  color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)',
                  boxShadow: tab === t ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {/* ── Google button (not on forgot-password) ─────────── */}
        {!forgotMode && <GoogleButton />}
        {!forgotMode && <Divider />}

        {/* ═══════════════ SIGN IN FORM ═══════════════ */}
        {tab === 'signin' && !forgotMode && (
          <form onSubmit={handleSignIn} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-wrap">
                <label className="login-field-label">Email address</label>
                <input
                  id="signin-email"
                  type="email"
                  className="login-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="input-wrap">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="login-field-label">Password</label>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setError(''); setSuccess(''); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#A78BFA', fontSize: '0.78rem', fontWeight: 600,
                      fontFamily: 'Inter', padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <EyeButton show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
              </div>

              {error   && <ErrorBox msg={error} />}
              {success && <SuccessBox msg={success} />}
              <DemoNote />

              <SubmitButton label="→ Sign in to Erpixa" />
            </div>
          </form>
        )}

        {/* ═══════════════ SIGN UP FORM ═══════════════ */}
        {tab === 'signup' && !forgotMode && (
          <form onSubmit={handleSignUp} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-wrap">
                <label className="login-field-label">Full name</label>
                <input
                  id="signup-name"
                  type="text"
                  className="login-input"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                />
              </div>

              <div className="input-wrap">
                <label className="login-field-label">Email address</label>
                <input
                  id="signup-email"
                  type="email"
                  className="login-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="input-wrap">
                <label className="login-field-label">Password <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(min. 8 chars)</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: 44 }}
                  />
                  <EyeButton show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4].map((lvl) => {
                      const strength = Math.min(4, Math.floor(password.length / 3));
                      const colors = ['#EF4444', '#F97316', '#EAB308', '#10B981'];
                      return (
                        <div key={lvl} style={{
                          flex: 1, height: 3, borderRadius: 99,
                          background: lvl <= strength ? colors[strength - 1] : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.3s ease',
                        }} />
                      );
                    })}
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: 4, whiteSpace: 'nowrap' }}>
                      {['', 'Weak', 'Fair', 'Good', 'Strong'][Math.min(4, Math.floor(password.length / 3))] }
                    </span>
                  </div>
                )}
              </div>

              <div className="input-wrap">
                <label className="login-field-label">Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Re-enter your password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    autoComplete="new-password"
                    style={{
                      paddingRight: 44,
                      borderColor: confirmPw && confirmPw !== password ? 'rgba(239,68,68,0.6)' : undefined,
                    }}
                  />
                  <EyeButton show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                </div>
                {confirmPw && confirmPw !== password && (
                  <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#FCA5A5' }}>
                    ✗ Passwords don't match
                  </div>
                )}
                {confirmPw && confirmPw === password && (
                  <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#6EE7B7' }}>
                    ✓ Passwords match
                  </div>
                )}
              </div>

              {error   && <ErrorBox msg={error} />}
              {success && <SuccessBox msg={success} />}

              {!isConfigured && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.4)',
                  borderRadius: 10, color: '#FCD34D', fontSize: '0.8rem', lineHeight: 1.5,
                }}>
                  🔧 <strong>Demo Mode:</strong> Sign-up requires Supabase. Switch to Sign In and use any credentials to explore.
                </div>
              )}

              <SubmitButton label="🚀 Create Account" />

              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                By signing up you agree to our Terms &amp; Privacy Policy.
              </p>
            </div>
          </form>
        )}

        {/* ═══════════════ FORGOT PASSWORD ═══════════════ */}
        {forgotMode && (
          <form onSubmit={handleForgotPassword} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                padding: '12px 14px',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 10, color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.6,
              }}>
                💡 Enter your registered email and we'll send you a secure reset link.
              </div>

              <div className="input-wrap">
                <label className="login-field-label">Email address</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="login-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error   && <ErrorBox msg={error} />}
              {success && <SuccessBox msg={success} />}

              <SubmitButton label="📧 Send Reset Link" />

              <button
                type="button"
                onClick={() => { setForgotMode(false); setError(''); setSuccess(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem',
                  fontFamily: 'Inter', padding: '4px 0', textAlign: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── Footer ────────────────────────────────────────── */}
        {!forgotMode && (
          <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', lineHeight: 1.6, margin: 0 }}>
              🔒 Secured by Supabase · Erpixa ERP Platform
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
