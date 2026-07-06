import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * AuthCallbackPage — handles the OAuth redirect from Supabase/Google.
 *
 * Flow:
 *  1. User clicks "Continue with Google" → redirected to Google.
 *  2. Google authenticates user → redirects to <origin>/auth/callback?code=xxx
 *  3. This page reads `code` from the URL and calls exchangeCodeForSession().
 *  4. Supabase creates the session → onAuthStateChange fires in the auth store.
 *  5. User is navigated to the dashboard.
 *
 * This must be a publicly accessible route (no auth guard).
 */

interface CallbackState {
  status: 'loading' | 'error' | 'success';
  message: string;
  detail?: string;
  hint?: string;
}

const REDIRECT_DELAY_MS = 3500;

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>({ status: 'loading', message: 'Completing sign-in…' });
  const exchanged = useRef(false);

  useEffect(() => {
    // Prevent double-invocation in React StrictMode
    if (exchanged.current) return;
    exchanged.current = true;

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code          = params.get('code');
      const errorParam    = params.get('error');
      const errorDesc     = params.get('error_description');

      console.log('[AuthCallback] URL params:', { code: !!code, errorParam, errorDesc });

      // ── Explicit OAuth error returned by Supabase / Google ──────────
      if (errorParam) {
        const raw = errorDesc ?? errorParam;
        const { message, hint } = friendlyError(raw, errorParam);
        console.error('[AuthCallback] OAuth error from provider:', raw);
        setState({ status: 'error', message, detail: raw, hint });
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(raw)}`, { replace: true });
        }, REDIRECT_DELAY_MS);
        return;
      }

      // ── PKCE code exchange ───────────────────────────────────────────
      if (code) {
        console.log('[AuthCallback] Exchanging PKCE code for session…');
        setState({ status: 'loading', message: 'Verifying with Google…' });
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('[AuthCallback] exchangeCodeForSession failed:', exchangeError.message);
          const { message, hint } = friendlyError(exchangeError.message, 'exchange_error');
          setState({
            status: 'error',
            message,
            detail: exchangeError.message,
            hint,
          });
          setTimeout(() => {
            navigate(`/login?error=${encodeURIComponent(exchangeError.message)}`, { replace: true });
          }, REDIRECT_DELAY_MS);
          return;
        }

        console.log('[AuthCallback] Session created for:', data.session?.user?.email);
        setState({ status: 'success', message: `Welcome, ${data.session?.user?.email ?? 'User'}!` });
        // Session is now stored; the auth store will pick it up via onAuthStateChange.
        navigate('/', { replace: true });
        return;
      }

      // ── No code and no error — check for existing session ──────────
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[AuthCallback] Session already exists, redirecting to dashboard.');
        navigate('/', { replace: true });
      } else {
        console.warn('[AuthCallback] No code and no session found. Redirecting to login.');
        const raw = 'Authentication failed — no code received.';
        const { message, hint } = friendlyError(raw, 'no_code');
        setState({ status: 'error', message, hint });
        setTimeout(() => {
          navigate('/login?error=Authentication+failed.+Please+try+again.', { replace: true });
        }, REDIRECT_DELAY_MS);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-base, #0f0f14)', gap: 20, padding: '0 24px',
    }}>
      {state.status === 'error' ? (
        <>
          {/* Error icon */}
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', boxShadow: '0 12px 32px rgba(239,68,68,0.45)',
            animation: 'modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}>⚠️</div>

          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#fff', textAlign: 'center' }}>
            Authentication Failed
          </div>

          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', textAlign: 'center', maxWidth: 380, lineHeight: 1.6 }}>
            {state.message}
          </div>

          {/* Hint box */}
          {state.hint && (
            <div style={{
              maxWidth: 420, width: '100%',
              padding: '14px 18px',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 12,
              fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7,
              fontFamily: 'Inter, sans-serif',
            }}>
              <div style={{ fontWeight: 700, color: '#A78BFA', marginBottom: 6 }}>💡 How to fix this</div>
              <div>{state.hint}</div>
            </div>
          )}

          {/* Technical detail (collapsible) */}
          {state.detail && (
            <details style={{ maxWidth: 420, width: '100%' }}>
              <summary style={{
                cursor: 'pointer', fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif',
                userSelect: 'none', listStyle: 'none', textAlign: 'center',
              }}>
                Show technical details
              </summary>
              <div style={{
                marginTop: 8, padding: '10px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)',
                fontFamily: 'monospace', wordBreak: 'break-all',
              }}>
                {state.detail}
              </div>
            </details>
          )}

          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
            Redirecting back to sign in…
          </div>
        </>
      ) : state.status === 'success' ? (
        <>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', boxShadow: '0 12px 32px rgba(16,185,129,0.45)',
          }}>✅</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>
            {state.message}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
            Loading your workspace…
          </div>
        </>
      ) : (
        <>
          {/* Loading state */}
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', boxShadow: '0 12px 32px rgba(99,102,241,0.45)',
            animation: 'spin 1.5s linear infinite',
          }}>✨</div>

          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
            {state.message}
          </div>

          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
            Completing Google authentication
          </div>
        </>
      )}
    </div>
  );
}

// ── Error message mapping ────────────────────────────────────────────────────
function friendlyError(raw: string, code: string): { message: string; hint?: string } {
  const lower = raw.toLowerCase();

  if (lower.includes('exchange') || lower.includes('external code') || code === 'exchange_error') {
    return {
      message: 'Google sign-in failed: the authentication code could not be exchanged.',
      hint:
        'This usually means the Redirect URL is not registered in your Supabase project.\n\n' +
        '1. Open Supabase Dashboard → Authentication → URL Configuration\n' +
        `2. Add "${window.location.origin}/auth/callback" to Redirect URLs\n` +
        '3. Save and try again.\n\n' +
        'Also make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.',
    };
  }

  if (lower.includes('redirect') || lower.includes('callback')) {
    return {
      message: 'OAuth redirect failed — the callback URL is not whitelisted.',
      hint:
        `Add "${window.location.origin}/auth/callback" to your Supabase ` +
        'project\'s allowed Redirect URLs (Auth → URL Configuration).',
    };
  }

  if (lower.includes('access_denied') || code === 'access_denied') {
    return {
      message: 'Access was denied by Google.',
      hint: 'You may have cancelled the sign-in or denied the required permissions. Please try again.',
    };
  }

  if (lower.includes('email') && lower.includes('not confirmed')) {
    return {
      message: 'Your email address has not been confirmed yet.',
      hint: 'Check your inbox for a verification link from Erpixa and click it before signing in.',
    };
  }

  if (lower.includes('no_code') || code === 'no_code') {
    return {
      message: 'No authentication code was received from Google.',
      hint: 'This can happen if you navigated to this page directly. Please click "Continue with Google" from the sign-in page.',
    };
  }

  // Generic fallback
  return {
    message: raw.length > 120 ? raw.slice(0, 120) + '…' : raw,
    hint: 'If this keeps happening, check your Supabase project configuration or contact your administrator.',
  };
}
