import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import PrimaryDomainPage from './pages/PrimaryDomainPage';
import MainPage from './pages/MainPage';
import ScanPage from './pages/ScanPage';
import MarketPage from './pages/MarketPage';
import BinLocationPage from './pages/BinLocationPage';
import ComplaintPage from './pages/ComplaintPage';
import ChatPage from './pages/ChatPage';
import CommunityPage from './pages/CommunityPage';
import BottomNav from './components/BottomNav';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const OnboardRoute = ({ children }) => {
  const { user, userProfile } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (userProfile?.primaryDomain) return <Navigate to="/app" replace />;
  return children;
};

function AppRoutes() {
  const location = useLocation();
  const hideNavPaths = ['/', '/signup', '/login', '/onboard/primary'];
  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboard/primary" element={<OnboardRoute><PrimaryDomainPage /></OnboardRoute>} />
        <Route path="/app" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
        <Route path="/scanner" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
        <Route path="/bins" element={<ProtectedRoute><BinLocationPage /></ProtectedRoute>} />
        <Route path="/complaint" element={<ProtectedRoute><ComplaintPage /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><MarketPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
