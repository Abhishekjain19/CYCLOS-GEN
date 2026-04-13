import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TbHome, TbScan, TbBuildingStore, TbUsers } from 'react-icons/tb';
import { AnimatePresence, motion } from 'framer-motion';
import ChatbotPopup from './ChatbotPopup';
import './BottomNav.css';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);

  const isActive = (paths) => paths.includes(location.pathname);

  return (
    <>
      {/* ── AI Chat Bottom Sheet ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              pointerEvents: 'none',
            }}
          >
            <ChatbotPopup onClose={() => setChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating AI Button (visible on all screens, above nav pill) ── */}
      <button
        className={`chatbot-fab${chatOpen ? ' chatbot-fab--active' : ''}`}
        onClick={() => setChatOpen(p => !p)}
        id="chatbot-dock-icon"
        aria-label="Open Cyclos AI Assistant"
      >
        {/* Wave SVG Icon */}
        <svg
          className="chatbot-fab__wave"
          viewBox="0 0 28 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 8 Q4 1 7 8 T13 8 T19 8 T25 8 T27 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M1 12 Q4 5 7 12 T13 12 T19 12 T25 12 T27 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
        </svg>
      </button>

      {/* ── Navigation Pill ── */}
      <div className="bottom-nav-app">
        <div
          className={`bottom-nav-app__item${isActive(['/app', '/dashboard']) ? ' scan-active' : ''}`}
          onClick={() => navigate('/app')}
          aria-label="Home"
        >
          <TbHome />
        </div>
        <div
          className={`bottom-nav-app__item${isActive(['/scanner']) ? ' scan-active' : ''}`}
          onClick={() => navigate('/scanner')}
          aria-label="Scan"
        >
          <TbScan />
        </div>
        <div
          className={`bottom-nav-app__item${isActive(['/marketplace', '/market']) ? ' scan-active' : ''}`}
          onClick={() => navigate('/marketplace')}
          aria-label="Market"
        >
          <TbBuildingStore />
        </div>
        <div
          className={`bottom-nav-app__item${isActive(['/community']) ? ' scan-active' : ''}`}
          onClick={() => navigate('/community')}
          aria-label="Community"
        >
          <TbUsers />
        </div>
      </div>
    </>
  );
}
