import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Bot, Mail, Lock, ChevronRight, ArrowLeft, User, Sparkles } from 'lucide-react';
import './LandingPage.css';

const AuthPage = () => {
  const { supabaseConfigured, supabaseConfigMessage, user, authLoading } = useAppContext();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const searchParams = new URLSearchParams(window.location.search);
    const rawOauthError =
      hashParams.get('error_description') ||
      hashParams.get('error') ||
      searchParams.get('error_description') ||
      searchParams.get('error');

    if (!rawOauthError) return;

    const decoded = decodeURIComponent(String(rawOauthError).replace(/\+/g, ' '));
    setError(normalizeAuthError(decoded));
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!supabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/login`
          }
        });
        if (error) throw error;

        if (data?.session) {
          navigate('/dashboard');
          return;
        }

        setNotice('Account aangemaakt. Check je e-mail en bevestig je account, daarna kun je inloggen.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(normalizeAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setNotice('');

    if (!supabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/login'
      }
    });
    if (error) setError(normalizeAuthError(error.message));
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
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) throw error;
      setNotice('Nieuwe bevestigingsmail verstuurd. Controleer ook je spammap.');
    } catch (resendError) {
      setError(normalizeAuthError(resendError?.message));
    } finally {
      setResendLoading(false);
    }
  };

  const toggleMode = () => {
    setAnimating(true);
    setError('');
    setNotice('');
    setTimeout(() => {
      setIsLogin(!isLogin);
      setTimeout(() => setAnimating(false), 50);
    }, 250);
  };

  const canResendConfirmation = /bevestig|confirmed/i.test(error);

  return (
    <div className="landing-container" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div className="abstract-shape shape-1" style={{ position: 'fixed' }}></div>
      <div className="abstract-shape shape-2" style={{ position: 'fixed' }}></div>

      <style>{`
        @keyframes authSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes authSlideOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-16px) scale(0.97); }
        }
        .auth-card {
          animation: authSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .auth-card.exit {
          animation: authSlideOut 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .auth-field {
          animation: authSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .auth-field:nth-child(1) { animation-delay: 0.05s; }
        .auth-field:nth-child(2) { animation-delay: 0.1s; }
        .auth-field:nth-child(3) { animation-delay: 0.15s; }
        .auth-field:nth-child(4) { animation-delay: 0.2s; }
        .auth-field:nth-child(5) { animation-delay: 0.25s; }
        .auth-field:nth-child(6) { animation-delay: 0.3s; }
        .auth-field:nth-child(7) { animation-delay: 0.35s; }
        .auth-field:nth-child(8) { animation-delay: 0.4s; }
        .toggle-link:hover { text-decoration: underline; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '420px', padding: '0 1rem', zIndex: 10 }}>
        
        <div key={isLogin ? 'login-header' : 'register-header'} className={`auth-card ${animating ? 'exit' : ''}`} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Bot className="text-gradient" size={36} />
            <span className="text-gradient font-heading" style={{ fontSize: '1.75rem', fontWeight: 700 }}>AI Hub</span>
          </div>
          
          {isLogin ? (
            <>
              <h1 className="font-heading" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welkom terug</h1>
              <p className="text-muted">Log in om je dashboard te openen.</p>
            </>
          ) : (
            <>
              <h1 className="font-heading" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Start Gratis <Sparkles size={24} color="var(--primary)" />
              </h1>
              <p className="text-muted">Zet je AI assistent op in 5 minuten. Geen creditcard nodig.</p>
            </>
          )}
        </div>

        <form 
          key={isLogin ? 'login-form' : 'register-form'} 
          onSubmit={handleSubmit} 
          className={`glass-panel auth-card ${animating ? 'exit' : ''}`} 
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {error && (
            <div className="auth-field" style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#EF4444', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {notice && (
            <div className="auth-field" style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#86efac', fontSize: '0.85rem' }}>
              {notice}
            </div>
          )}

          {canResendConfirmation && (
            <button
              type="button"
              className="auth-field"
              onClick={handleResendConfirmation}
              disabled={resendLoading || !supabaseConfigured}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#86efac',
                background: 'rgba(16, 185, 129, 0.08)'
              }}
            >
              {resendLoading ? 'Bevestigingsmail versturen...' : 'Stuur bevestigingsmail opnieuw'}
            </button>
          )}

          {!supabaseConfigured && (
            <div className="auth-field" style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '8px', color: '#FDE68A', fontSize: '0.85rem' }}>
              {supabaseConfigMessage}
            </div>
          )}

          {/* Google Login Button */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={!supabaseConfigured}
            className="auth-field"
            style={{ 
              width: '100%', padding: '12px', borderRadius: '8px', 
              background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)', 
              color: 'var(--text-main)', fontSize: '1rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              cursor: supabaseConfigured ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
              opacity: supabaseConfigured ? 1 : 0.6
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            {isLogin ? 'Inloggen met Google' : 'Registreren met Google'}
          </button>

          {/* Divider */}
          <div className="auth-field" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>of met e-mail</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          </div>

          {/* Name field - only for Register */}
          {!isLogin && (
            <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Volledige naam</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Jan de Vries"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
            </div>
          )}

          <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>E-mailadres</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="naam@bedrijf.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Wachtwoord</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>
            {!isLogin && <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Minimaal 6 tekens</small>}
          </div>

          <button className="btn-primary auth-field" type="submit" disabled={loading || !supabaseConfigured} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '0.5rem', opacity: supabaseConfigured ? 1 : 0.7 }}>
            {loading ? 'Even geduld...' : (isLogin ? 'Inloggen' : 'Account Aanmaken')}
            {!loading && <ChevronRight size={18} />}
          </button>

          <div className="auth-field" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? 'Nog geen account?' : 'Al een account?'}
            <button type="button" onClick={toggleMode} className="toggle-link" style={{ color: 'var(--primary)', marginLeft: '4px', fontWeight: 600 }}>
              {isLogin ? 'Registreer gratis' : 'Log in'}
            </button>
          </div>
        </form>

        <div className={`auth-card ${animating ? 'exit' : ''}`} style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => navigate('/')} style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            <ArrowLeft size={14}/> Terug naar homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
