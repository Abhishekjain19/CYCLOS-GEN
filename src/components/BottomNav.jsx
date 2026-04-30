import { useNavigate, useLocation } from 'react-router-dom';
import { TbHome, TbScan, TbBuildingStore, TbUsers, TbLeaf } from 'react-icons/tb';
import './BottomNav.css';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (paths) => paths.includes(location.pathname);

  return (
    <>
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
          className={`bottom-nav-app__item${isActive(['/cyclos-ai']) ? ' scan-active' : ''}`}
          onClick={() => navigate('/cyclos-ai')}
          aria-label="Cyclos AI"
        >
          <TbLeaf />
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
