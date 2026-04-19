import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import './AuthPage.css';

const normalizeAuthError = (message) => {
  const raw = String(message || '').trim();
  if (!raw) return 'Inloggen is mislukt. Probeer het opnieuw.';

  if (/email not confirmed/i.test(raw)) {
    return 'Je e-mailadres is nog niet bevestigd. Open je inbox en bevestig je account eerst.';
  }

  if (/invalid login credentials/i.test(raw)) {
    return 'Onjuiste inloggegevens. Controleer je e-mail en wachtwoord.';
  }

  if (/email address .* is invalid/i.test(raw)) {
    return 'Gebruik een geldig e-mailadres (bijvoorbeeld geen example.com).';
  }

  return raw;
};

const getInitialAuthError = () => {
  if (typeof window === 'undefined') return '';

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  const rawOauthError =
    hashParams.get('error_description') ||
    hashParams.get('error') ||
    searchParams.get('error_description') ||
    searchParams.get('error');

  if (!rawOauthError) return '';
  const decoded = decodeURIComponent(String(rawOauthError).replace(/\+/g, ' '));
  return normalizeAuthError(decoded);
};

const clearAuthErrorFromUrl = () => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  let changed = false;

  ['error', 'error_description', 'code', 'state'].forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  });

  if (url.hash && /error|access_token|refresh_token|state|code/i.test(url.hash)) {
    url.hash = '';
    changed = true;
  }

  if (changed) {
    const search = url.searchParams.toString();
    const cleanPath = search ? `${url.pathname}?${search}` : url.pathname;
    window.history.replaceState({}, document.title, cleanPath);
  }
};

const AuthPage = () => {
  const { supabaseConfigured, supabaseConfigMessage, apiConfigured, apiConfigMessage, user, authLoading } = useAppContext();
  const navigate = useNavigate();
  const [initialUrlError] = useState(() => getInitialAuthError());
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(initialUrlError);
  const [notice, setNotice] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (initialUrlError) {
      clearAuthErrorFromUrl();
    }
  }, [initialUrlError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || googleLoading) return;

    setError('');
    setNotice('');

    if (!supabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        navigate('/dashboard');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/login`
          }
        });
        if (signUpError) throw signUpError;

        if (data?.session) {
          navigate('/dashboard');
          return;
        }

        setNotice('Account aangemaakt. Check je e-mail en bevestig je account, daarna kun je inloggen.');
        setIsLogin(true);
      }
    } catch (submitError) {
      setError(normalizeAuthError(submitError?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;

    setError('');
    setNotice('');

    if (!supabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }

    setGoogleLoading(true);

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`
        }
      });

      if (googleError) setError(normalizeAuthError(googleError.message));
    } catch (oauthError) {
      setError(normalizeAuthError(oauthError?.message));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError('');
    setNotice('');

    if (!email.trim()) {
      setError('Vul eerst je e-mailadres in om de bevestigingsmail opnieuw te sturen.');
      return;
    }

    setResendLoading(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (resendError) throw resendError;
      setNotice('Nieuwe bevestigingsmail verstuurd. Controleer ook je spammap.');
    } catch (failedResendError) {
      setError(normalizeAuthError(failedResendError?.message));
    } finally {
      setResendLoading(false);
    }
  };

  const toggleMode = () => {
    if (loading || googleLoading) return;

    setAnimating(true);
    setError('');
    setNotice('');

    setTimeout(() => {
      setIsLogin((prev) => !prev);
      setTimeout(() => setAnimating(false), 60);
    }, 220);
  };

  const canResendConfirmation = /bevestig|confirmed/i.test(error);

  return (
    <div className="auth-login-page">
      <div className="auth-ambient ambient-one" />
      <div className="auth-ambient ambient-two" />

      <main className="auth-login-main">
        <div className={`auth-brand-block ${animating ? 'is-exit' : ''}`}>
          <div className="auth-logo-chip">
            <span className="material-symbols-outlined">graphic_eq</span>
          </div>
          <h1>Belliq</h1>
          <p>AI Call Intelligence</p>
        </div>

        <form className={`auth-form-card glass-effect ${animating ? 'is-exit' : ''}`} onSubmit={handleSubmit}>
          <div className="auth-form-head">
            <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p>
              {isLogin
                ? 'Please enter your details to sign in'
                : 'Start gratis en zet je AI assistent op in enkele minuten'}
            </p>
          </div>

          {error && <div className="auth-feedback auth-feedback-error">{error}</div>}
          {notice && <div className="auth-feedback auth-feedback-success">{notice}</div>}

          {!supabaseConfigured && <div className="auth-feedback auth-feedback-warn">{supabaseConfigMessage}</div>}
          {!apiConfigured && <div className="auth-feedback auth-feedback-warn">{apiConfigMessage}</div>}

          {canResendConfirmation && (
            <button
              type="button"
              className="auth-resend-btn"
              onClick={handleResendConfirmation}
              disabled={resendLoading || loading || googleLoading || !supabaseConfigured}
            >
              {resendLoading ? 'Bevestigingsmail versturen...' : 'Stuur bevestigingsmail opnieuw'}
            </button>
          )}

          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleLogin}
            disabled={!supabaseConfigured || googleLoading || loading}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>
              {googleLoading
                ? 'Doorsturen naar Google...'
                : isLogin
                  ? 'Continue with Google'
                  : 'Sign up with Google'}
            </span>
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          {!isLogin && (
            <label className="auth-field">
              <span>Volledige naam</span>
              <input
                type="text"
                placeholder="Jan de Vries"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              placeholder="naam@bedrijf.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {!isLogin && <small>Minimaal 6 tekens</small>}
          </label>

          <button
            className="auth-submit-btn"
            type="submit"
            disabled={loading || googleLoading || !supabaseConfigured}
          >
            {loading ? 'Even geduld...' : isLogin ? 'Sign in to Belliq' : 'Create account'}
          </button>

          <p className="auth-toggle-row">
            {isLogin ? "Don't have an account yet?" : 'Already have an account?'}
            <button type="button" onClick={toggleMode}>
              {isLogin ? 'Start your free trial' : 'Sign in'}
            </button>
          </p>
        </form>

        <button className="auth-back-link" type="button" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined">arrow_back</span>
          Terug naar homepage
        </button>
      </main>
    </div>
  );
};

export default AuthPage;

