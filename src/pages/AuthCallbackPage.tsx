import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * AuthCallbackPage — handles the OAuth redirect from Supabase/Google.
 *
 * Flow (Supabase PKCE with detectSessionInUrl: true):
 *  1. User clicks "Continue with Google" → redirected to Google.
 *  2. Google authenticates → redirects to <origin>/auth/callback?code=xxx
 *  3. Supabase JS client auto-exchanges the PKCE code via detectSessionInUrl.
 *  4. onAuthStateChange fires with SIGNED_IN event.
 *  5. This page listens for that event and navigates to the dashboard.
 *
 * ⚠️  Do NOT call exchangeCodeForSession() here manually.
 *     With detectSessionInUrl: true, the Supabase client already does it
 *     internally. Calling it again would attempt to spend the one-time code
 *     a second time → "Unable to exchange external code" error.
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
  const listenerSet = useRef(false);

  useEffect(() => {
    if (listenerSet.current) return;
    listenerSet.current = true;

    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDesc  = params.get('error_description');

    // ── Explicit OAuth error returned in the URL ─────────────────────────────
    if (errorParam) {
      const raw = errorDesc ?? errorParam;
      const { message, hint } = friendlyError(raw, errorParam);
      console.error('[AuthCallback] OAuth error in URL:', raw);
      setState({ status: 'error', message, detail: raw, hint });
      setTimeout(() => {
        navigate(`/login?error=${encodeURIComponent(raw)}`, { replace: true });
      }, REDIRECT_DELAY_MS);
      return;
    }

    // ── Listen for the SIGNED_IN event from Supabase's auto-exchange ─────────
    // Supabase v2 with detectSessionInUrl:true + flowType:'pkce' exchanges the
    // ?code= param automatically. We simply wait for the resulting SIGNED_IN event.
    setState({ status: 'loading', message: 'Verifying with Google…' });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthCallback] onAuthStateChange:', event, session?.user?.email ?? null);

      if (event === 'SIGNED_IN' && session) {
        setState({ status: 'success', message: `Welcome, ${session.user.email ?? 'User'}!` });
        subscription.unsubscribe();
        navigate('/', { replace: true });
        return;
      }

      if (event === 'TOKEN_REFRESHED' && session) {
        // Already had a valid session — just go to dashboard
        subscription.unsubscribe();
        navigate('/', { replace: true });
        return;
      }
    });

    // ── Fallback: check for an already-existing session ──────────────────────
    // In case onAuthStateChange fired before we subscribed (rare but possible)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('[AuthCallback] Session already exists, navigating to dashboard.');
        subscription.unsubscribe();
        navigate('/', { replace: true });
      }
    });

    // ── Timeout: if nothing fires in 10s, show an error ─────────────────────
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      const raw = 'Authentication timed out — no session was established.';
      const { message, hint } = friendlyError('exchange', 'exchange_error');
      setState({ status: 'error', message, detail: raw, hint });
      setTimeout(() => {
        navigate('/login?error=Authentication+timed+out.+Please+try+again.', { replace: true });
      }, REDIRECT_DELAY_MS);
    }, 10_000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
              whiteSpace: 'pre-line',
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
