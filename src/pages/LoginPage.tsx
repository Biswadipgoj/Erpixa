import React, { useState } from 'react';
import { useAuthStore, useUIStore } from '../store';

export default function LoginPage() {
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const addToast = useUIStore((s) => s.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isConfigured = !!(import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await signInWithEmail(email, password);
    if (err) { setError(err); setLoading(false); }
    else { addToast({ message: 'Welcome back! 👋', type: 'success' }); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err); setGoogleLoading(false); }
  };

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

      <div className="login-card" style={{ animation: 'modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 12px 32px rgba(99,102,241,0.45)',
            fontSize: '1.75rem',
          }}>✨</div>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.75rem', color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
            Buis <span style={{ background: 'linear-gradient(135deg, #A78BFA, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 500 }}>
            Enterprise Management Platform
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
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
          {googleLoading ? (
            <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="login-divider" style={{ flex: 1 }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>or continue with email</span>
          <div className="login-divider" style={{ flex: 1 }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-wrap">
              <label className="login-field-label">Email address</label>
              <input
                type="email"
                className="login-input"
                placeholder="admin@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>
            <div className="input-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="login-field-label">Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 10, color: '#FCA5A5', fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}

            {!isConfigured && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.4)',
                borderRadius: 10, color: '#FCD34D', fontSize: '0.8rem',
                lineHeight: 1.5,
              }}>
                🔧 <strong>Demo Mode:</strong> Supabase not configured. Enter any email + any password to access.
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              style={{
                width: '100%', height: 48, marginTop: 4,
                background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontFamily: 'Inter', fontWeight: 700, fontSize: '0.9375rem', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
                opacity: (loading || googleLoading) ? 0.7 : 1,
                transition: 'all 0.18s ease',
              }}
            >
              {loading ? (
                <>
                  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Signing in…
                </>
              ) : '→ Sign in to Buis AI'}
            </button>
          </div>
        </form>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', lineHeight: 1.6 }}>
            🔒 Access is restricted to authorized users only.<br/>
            Contact your administrator to get access.
          </p>
        </div>
      </div>
    </div>
  );
}
