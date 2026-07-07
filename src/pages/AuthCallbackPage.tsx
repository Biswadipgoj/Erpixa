import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store';
import Icon from '../components/ui/Icon';

/**
 * Handles the redirect from Supabase for OAuth (Google) and password-recovery
 * links, both of which use the PKCE code-exchange flow. App.tsx routes
 * /auth/callback straight here so initialize()/getSession() never races with
 * the exchange (supabase.ts sets detectSessionInUrl:false for the same reason).
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
  const [state, setState] = useState<CallbackState>({ status: 'loading', message: 'Completing sign-in…' });
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    handleCallback();

    async function handleCallback() {
      if (!isSupabaseConfigured) {
        showError({
          message: 'Supabase is not configured.',
          detail: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing or use placeholder values.',
          hint: 'Set real Supabase credentials in your hosting provider’s environment variables, then redeploy.',
        });
        return;
      }

      const params   = new URLSearchParams(window.location.search);
      const code      = params.get('code');
      const errParam  = params.get('error');
      const errDesc   = params.get('error_description');
      const isRecovery = params.get('type') === 'recovery';

      if (errParam) {
        const raw = errDesc ?? errParam;
        showError({ message: `Sign-in rejected: ${humaniseProviderError(errParam)}`, detail: raw, hint: providerErrorHint(errParam) });
        redirect(`/login?error=${encodeURIComponent(raw)}`);
        return;
      }

      if (!code) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) { window.location.replace('/'); return; }
        showError({
          message: 'No authentication code was received.',
          detail: 'The URL did not contain a ?code= parameter.',
          hint: 'Please start again from the sign-in page rather than navigating here directly.',
        });
        redirect('/login?error=No+auth+code+received');
        return;
      }

      setState({ status: 'loading', message: 'Verifying…' });
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        showError({
          message: 'Sign-in failed — could not complete authentication.',
          detail: `${exchangeError.message} (status ${exchangeError.status ?? 'unknown'})`,
          supabaseCode: exchangeError.name,
          hint: exchangeHint(exchangeError.message, exchangeError.status),
        });
        redirect(`/login?error=${encodeURIComponent(exchangeError.message)}`);
        return;
      }

      // Password-recovery link: flag the store so AppShell shows the reset screen
      // instead of dropping the user straight into the workspace.
      if (isRecovery) {
        useAuthStore.setState({ passwordRecovery: true });
        setState({ status: 'success', message: 'Choose a new password' });
        navigate('/', { replace: true });
        return;
      }

      setState({ status: 'success', message: `Welcome, ${data.session?.user?.email ?? 'back'}!` });
      navigate('/', { replace: true });
    }

    function showError(opts: Omit<CallbackState, 'status'>) { setState({ status: 'error', ...opts }); }
    function redirect(path: string) { setTimeout(() => navigate(path, { replace: true }), REDIRECT_DELAY_MS); }
  }, [navigate]);

  const accent = state.status === 'error' ? 'var(--danger)' : state.status === 'success' ? 'var(--success)' : 'var(--accent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)', gap: 18, padding: '0 24px', color: 'var(--text-primary)' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon
          name={state.status === 'error' ? 'alert' : state.status === 'success' ? 'check' : 'spark'}
          size={26}
          className={state.status === 'loading' ? 'spin' : undefined}
        />
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', textAlign: 'center' }}>
        {state.status === 'error' ? 'Authentication failed' : state.message}
      </div>
      {state.status === 'error' && (
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>{state.message}</div>
      )}
      {state.status !== 'error' && (
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Just a moment…</div>
      )}

      {state.hint && (
        <div className="card" style={{ maxWidth: 460, width: '100%', padding: '14px 18px', background: 'var(--accent-soft)' }}>
          <div style={{ fontWeight: 700, color: 'var(--accent-text)', marginBottom: 6, fontSize: '0.82rem' }}>How to fix this</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{state.hint}</div>
        </div>
      )}

      {(state.detail || state.supabaseCode) && (
        <details style={{ maxWidth: 460, width: '100%' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', textAlign: 'center', userSelect: 'none' }}>
            Show technical details
          </summary>
          <div style={{ marginTop: 10, padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all', lineHeight: 1.8 }}>
            {state.supabaseCode && <div><strong>Code:</strong> {state.supabaseCode}</div>}
            {state.detail && <div><strong>Detail:</strong> {state.detail}</div>}
            <div><strong>Origin:</strong> {window.location.origin}</div>
          </div>
        </details>
      )}

      {state.status === 'error' && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Redirecting back to sign in…</div>
      )}
    </div>
  );
}

// ── Provider / exchange error helpers ────────────────────────────────────────
function humaniseProviderError(code: string): string {
  const map: Record<string, string> = {
    access_denied: 'Access denied by Google',
    redirect_uri_mismatch: 'Redirect URI mismatch',
    invalid_client: 'Invalid OAuth client',
    unauthorized_client: 'Unauthorised client',
    server_error: 'Google OAuth app not published',
  };
  return map[code] ?? code.replace(/_/g, ' ');
}

function providerErrorHint(code: string): string {
  if (code === 'server_error') {
    return (
      'Your Google OAuth app is in "Testing" mode — only added test users can sign in.\n\n' +
      '1. Google Cloud Console → APIs & Services → OAuth consent screen\n' +
      '2. Either add the user under "Test users", or click "Publish App"\n' +
      '3. Save and try again'
    );
  }
  if (code === 'access_denied') return 'You cancelled the sign-in or denied the required permissions. Try again and click "Allow".';
  if (code === 'redirect_uri_mismatch') {
    return 'The redirect URI in Google Cloud Console does not match Supabase’s callback URL.\nAdd: https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback';
  }
  return 'Check your Google OAuth and Supabase configuration.';
}

function exchangeHint(message: string, status?: number): string {
  const lower = message.toLowerCase();
  if (lower.includes('pkce') || lower.includes('code verifier') || lower.includes('code_verifier')) {
    return 'The PKCE code verifier is missing — this happens if the link opened in a different browser or storage was cleared.\nFix: start the sign-in again in this browser.';
  }
  if (lower.includes('expired') || lower.includes('invalid_grant')) {
    return 'The link expired (codes are valid ~5 minutes). Request a new one and use it promptly.';
  }
  if (lower.includes('already') || lower.includes('used')) {
    return 'The code was already used — this can happen if the page reloaded. Request a fresh link and try again.';
  }
  if (status === 400) {
    return 'Supabase rejected the exchange (HTTP 400). Add "' + window.location.origin + '/auth/callback" to Supabase → Auth → URL Configuration → Redirect URLs.';
  }
  if (status === 401 || status === 403) {
    return 'Credentials were rejected (HTTP ' + status + '). Check VITE_SUPABASE_ANON_KEY in your environment variables.';
  }
  return 'Add "' + window.location.origin + '/auth/callback" to your Supabase Redirect URLs, and confirm VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set.';
}
