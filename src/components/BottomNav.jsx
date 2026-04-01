import { useNavigate, useLocation } from 'react-router-dom';
import { TbHome, TbScan, TbBuildingStore, TbRobot, TbUsers } from 'react-icons/tb';
import './BottomNav.css';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    navigate(path);
  };

  const isActive = (pathArray) => pathArray.includes(location.pathname);

  return (
    <div className="bottom-nav-app">
      <div 
        className={`bottom-nav-app__item ${isActive(['/app', '/dashboard']) ? 'scan-active' : ''}`}
        onClick={() => handleNav('/app')}
      >
        <TbHome />
      </div>
      <div 
         className={`bottom-nav-app__item ${isActive(['/scanner']) ? 'scan-active' : ''}`} 
         onClick={() => handleNav('/scanner')}
      >
        <TbScan />
      </div>
      <div 
         className={`bottom-nav-app__item ${isActive(['/marketplace', '/market']) ? 'scan-active' : ''}`}
         onClick={() => handleNav('/marketplace')}
      >
        <TbBuildingStore />
      </div>
      <div 
         className={`bottom-nav-app__item ${isActive(['/chatbot']) ? 'scan-active' : ''}`}
         onClick={() => handleNav('/chatbot')}
      >
        <TbRobot />
      </div>
      <div 
         className={`bottom-nav-app__item ${isActive(['/community']) ? 'scan-active' : ''}`}
         onClick={() => handleNav('/community')}
      >
        <TbUsers />
      </div>
    </div>
  );
}
