import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * AuthCallbackPage — handles the OAuth redirect from Supabase/Google (PKCE flow).
 *
 * Flow:
 *  1. User clicks "Continue with Google" → signInWithOAuth stores code_verifier
 *     in localStorage and redirects to Google.
 *  2. Google authenticates → redirects to <origin>/auth/callback?code=xxx
 *  3. This page reads `code` and calls exchangeCodeForSession() with the
 *     stored code_verifier → Supabase validates and creates a session.
 *  4. On success → navigate to dashboard.
 *
 * ⚠️  App.tsx returns this component BEFORE any hooks run on /auth/callback,
 *     so initialize()/getSession() never races with our exchange.
 *     supabase.ts sets detectSessionInUrl:false so the client does NOT
 *     auto-exchange the code during createClient(), leaving us full control.
 */

type Status = 'loading' | 'error' | 'success';

interface CallbackState {
  status: Status;
  message: string;
  detail?: string;
  hint?: string;
  supabaseCode?: string;
}

const REDIRECT_DELAY_MS = 4000;

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Completing sign-in…',
  });
  const didRun = useRef(false);

  useEffect(() => {
    // React StrictMode guard — only run once
    if (didRun.current) return;
    didRun.current = true;

    handleCallback();

    async function handleCallback() {
      // ── Guard: Supabase not configured ─────────────────────────────────────
      if (!isSupabaseConfigured) {
        showError({
          message: 'Supabase is not configured.',
          detail: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing or use placeholder values.',
          hint: 'Set real Supabase credentials in your Vercel project → Settings → Environment Variables, then redeploy.',
        });
        return;
      }

      const params   = new URLSearchParams(window.location.search);
      const code     = params.get('code');
      const errParam = params.get('error');
      const errDesc  = params.get('error_description');

      console.log('[AuthCallback] URL params:', {
        code: code ? `${code.slice(0, 8)}…` : null,
        error: errParam,
        error_description: errDesc,
      });

      // ── Explicit OAuth error in URL (from Google / Supabase) ────────────────
      if (errParam) {
        const raw = errDesc ?? errParam;
        showError({
          message: `Sign-in rejected: ${humaniseProviderError(errParam)}`,
          detail: raw,
          hint: providerErrorHint(errParam),
        });
        redirect(`/login?error=${encodeURIComponent(raw)}`);
        return;
      }

      // ── No code at all ──────────────────────────────────────────────────────
      if (!code) {
        // Maybe we already have a session (user refreshed the page)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.replace('/');
          return;
        }
        showError({
          message: 'No authentication code was received.',
          detail: 'The URL did not contain a ?code= parameter.',
          hint: 'Please click "Continue with Google" on the sign-in page instead of navigating here directly.',
        });
        redirect('/login?error=No+auth+code+received');
        return;
      }

      // ── PKCE code exchange ──────────────────────────────────────────────────
      setState({ status: 'loading', message: 'Verifying with Google…' });
      console.log('[AuthCallback] Calling exchangeCodeForSession…');

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[AuthCallback] exchangeCodeForSession failed:', {
          message: exchangeError.message,
          status: exchangeError.status,
          name: exchangeError.name,
        });

        showError({
          message: 'Google sign-in failed — could not complete authentication.',
          detail: `${exchangeError.message} (status ${exchangeError.status ?? 'unknown'})`,
          supabaseCode: exchangeError.name,
          hint: exchangeHint(exchangeError.message, exchangeError.status),
        });
        redirect(`/login?error=${encodeURIComponent(exchangeError.message)}`);
        return;
      }

      // ── Success ─────────────────────────────────────────────────────────────
      console.log('[AuthCallback] Session created for:', data.session?.user?.email);
      setState({
        status: 'success',
        message: `Welcome, ${data.session?.user?.email ?? 'User'}!`,
      });
      navigate('/', { replace: true });
    }

    function showError(opts: Omit<CallbackState, 'status'>) {
      setState({ status: 'error', ...opts });
    }

    function redirect(path: string) {
      setTimeout(() => navigate(path, { replace: true }), REDIRECT_DELAY_MS);
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: 'var(--bg-base, #0f0f14)', gap: 20, padding: '0 24px',
    }}>
      {state.status === 'error' ? <ErrorView state={state} /> :
       state.status === 'success' ? <SuccessView state={state} /> :
       <LoadingView state={state} />}
    </div>
  );
}

// ── Sub-views ────────────────────────────────────────────────────────────────

function ErrorView({ state }: { state: CallbackState }) {
  return (
    <>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.875rem', boxShadow: '0 12px 32px rgba(239,68,68,0.4)',
        animation: 'modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>❌</div>

      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#fff', textAlign: 'center' }}>
        Authentication Failed
      </div>

      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 420, lineHeight: 1.7 }}>
        {state.message}
      </div>

      {state.hint && (
        <div style={{
          maxWidth: 460, width: '100%', padding: '16px 20px',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 14, fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ fontWeight: 700, color: '#A78BFA', marginBottom: 8, fontSize: '0.82rem' }}>
            💡 How to fix this
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
            {state.hint}
          </div>
        </div>
      )}

      {(state.detail || state.supabaseCode) && (
        <details style={{ maxWidth: 460, width: '100%' }}>
          <summary style={{
            cursor: 'pointer', fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace',
            listStyle: 'none', textAlign: 'center', userSelect: 'none',
          }}>
            ▸ Show technical details
          </summary>
          <div style={{
            marginTop: 10, padding: '12px 16px',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, fontFamily: 'monospace', fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.45)', wordBreak: 'break-all', lineHeight: 1.8,
          }}>
            {state.supabaseCode && <div><strong>Code:</strong> {state.supabaseCode}</div>}
            {state.detail && <div><strong>Detail:</strong> {state.detail}</div>}
            <div><strong>Origin:</strong> {window.location.origin}</div>
            <div><strong>Callback URL:</strong> {window.location.href.replace(/code=[^&]+/, 'code=REDACTED')}</div>
          </div>
        </details>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
        Redirecting back to sign in…
      </div>
    </>
  );
}

function SuccessView({ state }: { state: CallbackState }) {
  return (
    <>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'linear-gradient(135deg, #10B981, #059669)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.875rem', boxShadow: '0 12px 32px rgba(16,185,129,0.4)',
        animation: 'modalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>✅</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>
        {state.message}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
        Loading your workspace…
      </div>
    </>
  );
}

function LoadingView({ state }: { state: CallbackState }) {
  return (
    <>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.875rem', boxShadow: '0 12px 32px rgba(99,102,241,0.4)',
        animation: 'spin 1.5s linear infinite',
      }}>✨</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
        {state.message}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
        Completing Google authentication
      </div>
    </>
  );
}

// ── Error helpers ────────────────────────────────────────────────────────────

/** Human-readable label for OAuth error codes returned by the provider. */
function humaniseProviderError(code: string): string {
  const map: Record<string, string> = {
    access_denied:         'Access denied by Google',
    redirect_uri_mismatch: 'Redirect URI mismatch',
    invalid_client:        'Invalid OAuth client',
    unauthorized_client:   'Unauthorised client',
    server_error:          'Google OAuth app not published',
  };
  return map[code] ?? code.replace(/_/g, ' ');
}

function providerErrorHint(code: string): string {
  if (code === 'server_error') {
    return (
      'Your Google OAuth app is in "Testing" mode — only manually added test users can sign in.\n\n' +
      'To fix this:\n' +
      '1. Go to Google Cloud Console → APIs & Services → OAuth consent screen\n' +
      '2. If Status is "Testing": either\n' +
      '   a) Add the user\'s email under "Test users" (quick fix), OR\n' +
      '   b) Click "Publish App" to allow any Google account (recommended for production)\n' +
      '3. Save and try signing in again'
    );
  }
  if (code === 'access_denied') {
    return 'You cancelled the sign-in or denied the required Google permissions. Try again and click "Allow".';
  }
  if (code === 'redirect_uri_mismatch') {
    return (
      'The redirect URI in Google Cloud Console does not match Supabase\'s callback URL.\n\n' +
      'In Google Cloud Console → Credentials → your OAuth client, add:\n' +
      'https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback'
    );
  }
  return 'Check your Google OAuth and Supabase configuration.';
}

/** Contextual hint based on the actual Supabase exchange error message/status. */
function exchangeHint(message: string, status?: number): string {
  const lower = message.toLowerCase();

  if (lower.includes('pkce') || lower.includes('code verifier') || lower.includes('code_verifier')) {
    return (
      'The PKCE code verifier is missing. This happens when:\n' +
      '• You opened the Google sign-in link in a different browser tab\n' +
      '• Your browser cleared localStorage between the sign-in steps\n\n' +
      'Fix: close any extra tabs and try signing in again from scratch.'
    );
  }

  if (lower.includes('expired') || lower.includes('invalid_grant')) {
    return (
      'The authentication code expired before it could be used (codes are valid for ~5 minutes).\n\n' +
      'Fix: click "Continue with Google" again and complete the sign-in promptly.'
    );
  }

  if (lower.includes('already') || lower.includes('used')) {
    return (
      'The authentication code was already used. This can happen if the page reloaded during sign-in.\n\n' +
      'Fix: click "Continue with Google" again to get a fresh code.'
    );
  }

  if (status === 400) {
    return (
      'Supabase rejected the code exchange (HTTP 400). Most likely causes:\n' +
      '• The redirect URL "' + window.location.origin + '/auth/callback" is not in Supabase → Auth → URL Configuration\n' +
      '• The Google OAuth redirect URI doesn\'t point to your Supabase project\'s callback\n\n' +
      'Expected Google redirect URI: https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback'
    );
  }

  if (status === 401 || status === 403) {
    return (
      'Authentication credentials were rejected (HTTP ' + status + ').\n\n' +
      'Check that VITE_SUPABASE_ANON_KEY in your Vercel environment variables is correct.\n' +
      'Find it in: Supabase Dashboard → Project Settings → API → anon public'
    );
  }

  // Generic fallback
  return (
    'Possible causes:\n' +
    '• "' + window.location.origin + '/auth/callback" not in Supabase Redirect URLs\n' +
    '• Google OAuth redirect URI doesn\'t point to Supabase (should be https://YOUR_PROJECT.supabase.co/auth/v1/callback)\n' +
    '• VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in Vercel environment variables'
  );
}
