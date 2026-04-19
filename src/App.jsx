import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
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
  const { user, authLoading } = useAppContext();

  if (authLoading) {
    return <FullscreenLoader />;
  }

  return (
    <div className="app-container">
      <Suspense fallback={<FullscreenLoader />}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
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
