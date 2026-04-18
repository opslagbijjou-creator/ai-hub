import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Wizard from './pages/Wizard';
import PricingPage from './pages/PricingPage';
import InfoPage from './pages/InfoPage';
import PrivacyPage from './pages/PrivacyPage';
import CompliancePage from './pages/CompliancePage';
import TermsPage from './pages/TermsPage';
import { AppProvider, useAppContext } from './context/AppContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useAppContext();

  if (authLoading) {
    return (
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
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user, authLoading } = useAppContext();

  if (authLoading) {
    return (
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
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/info" element={<InfoPage />} />
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
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
