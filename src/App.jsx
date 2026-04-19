import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { supabase } from './lib/supabase';
import { apiUrl } from './lib/api';
import './App.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Wizard = lazy(() => import('./pages/Wizard'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const CompliancePage = lazy(() => import('./pages/CompliancePage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

const FullscreenLoader = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-dark)',
      color: 'var(--text-main)'
    }}
  >
    <p>Laden...</p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useAppContext();

  if (authLoading) {
    return <FullscreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
};

function AppRoutes() {
  const { user, authLoading, setIsAdmin } = useAppContext();
  const [onboardingState, setOnboardingState] = React.useState({
    loading: false,
    checked: false,
    completed: false,
    step: 1
  });

  React.useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      if (!user) {
        if (!cancelled) {
          setIsAdmin(false);
          setOnboardingState({
            loading: false,
            checked: false,
            completed: false,
            step: 1
          });
        }
        return;
      }

      if (!cancelled) {
        setOnboardingState((prev) => ({
          ...prev,
          loading: true,
          checked: false
        }));
      }

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        const token = session?.access_token;
        if (!token) {
          if (!cancelled) {
            setIsAdmin(false);
            setOnboardingState({
              loading: false,
              checked: true,
              completed: false,
              step: 1
            });
          }
          return;
        }

        const response = await fetch(apiUrl('/api/assistant/state'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || 'Onboardingstatus kon niet worden geladen.');
        }

        setIsAdmin(Boolean(payload?.viewer?.isAdmin));

        const step = Math.min(
          5,
          Math.max(1, Number(payload?.wizard?.step || payload?.assistant?.setup_step || 1))
        );
        const completed = Boolean(payload?.wizard?.completed || payload?.assistant?.setup_completed);

        if (!cancelled) {
          setOnboardingState({
            loading: false,
            checked: true,
            completed,
            step
          });
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setOnboardingState({
            loading: false,
            checked: true,
            completed: false,
            step: 1
          });
        }
      }
    };

    if (!authLoading) {
      checkOnboarding();
    }

    return () => {
      cancelled = true;
    };
  }, [authLoading, setIsAdmin, user]);

  const onboardingLoading = Boolean(user) && (onboardingState.loading || !onboardingState.checked);

  if (authLoading || onboardingLoading) {
    return <FullscreenLoader />;
  }

  const mustFinishSetup = Boolean(user) && !onboardingState.completed;
  const defaultAuthedPath = mustFinishSetup ? '/setup-wizard' : '/dashboard';

  return (
    <div className="app-container">
      <Suspense fallback={<FullscreenLoader />}>
        <Routes>
          <Route path="/" element={user ? <Navigate to={defaultAuthedPath} replace /> : <LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={user ? <Navigate to={defaultAuthedPath} replace /> : <AuthPage />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                {mustFinishSetup ? <Navigate to="/setup-wizard" replace /> : <Dashboard />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup-wizard"
            element={
              <ProtectedRoute>
                <Wizard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
