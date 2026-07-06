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
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const exchanged = useRef(false);

  useEffect(() => {
    // Prevent double-invocation in React StrictMode
    if (exchanged.current) return;
    exchanged.current = true;

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');
      const errorDescription = params.get('error_description');

      console.log('[AuthCallback] URL params:', { code: !!code, errorParam, errorDescription });

      // Handle explicit error from Supabase/Google
      if (errorParam) {
        const msg = errorDescription ?? errorParam;
        console.error('[AuthCallback] OAuth error from provider:', msg);
        setError(msg);
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(msg)}`, { replace: true });
        }, 2000);
        return;
      }

      // Handle PKCE code exchange
      if (code) {
        console.log('[AuthCallback] Exchanging code for session…');
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('[AuthCallback] exchangeCodeForSession failed:', exchangeError.message);
          setError(exchangeError.message);
          setTimeout(() => {
            navigate(`/login?error=${encodeURIComponent(exchangeError.message)}`, { replace: true });
          }, 2000);
          return;
        }
        console.log('[AuthCallback] Session created for:', data.session?.user?.email);
        // Session is now stored; the auth store will pick it up via onAuthStateChange.
        // Navigate to root — App.tsx will redirect to the dashboard.
        navigate('/', { replace: true });
        return;
      }

      // No code and no error — check if session already exists (e.g. implicit flow fallback)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[AuthCallback] Session already exists, redirecting to dashboard.');
        navigate('/', { replace: true });
      } else {
        console.warn('[AuthCallback] No code and no session found. Redirecting to login.');
        navigate('/login?error=Authentication+failed.+Please+try+again.', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-base, #0f0f14)',
      gap: 20,
    }}>
      {error ? (
        <>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', boxShadow: '0 12px 32px rgba(239,68,68,0.45)',
          }}>⚠️</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
            Authentication Failed
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 340 }}>
            {error}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
            Redirecting back to sign in…
          </div>
        </>
      ) : (
        <>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', boxShadow: '0 12px 32px rgba(99,102,241,0.45)',
            animation: 'spin 1.5s linear infinite',
          }}>✨</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
            Signing you in to Erpixa…
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
            Completing Google authentication
          </div>
        </>
      )}
    </div>
  );
}
