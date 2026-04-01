import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { TbArrowLeft, TbCheck, TbUserCheck, TbUsers } from 'react-icons/tb';
import './DomainPage.css';

const ROLES = [
  {
    id: 'recycler',
    title: 'Recycler',
    desc: 'I want to recycle my materials and earn rewards.',
    Icon: TbUserCheck,
    img: '/ocean_hero.png' // Utilizing the hero bg
  },
  {
    id: 'community_helper',
    title: 'Community Helper',
    desc: 'I want to help collect and transport local waste.',
    Icon: TbUsers,
    img: 'https://images.unsplash.com/photo-1618477461853-cf6ed80fca73?w=500&q=80'
  }
];

export default function PrimaryDomainPage() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSelect = (id) => {
    setSelectedRoles(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selectedRoles.length === 0) return;
    setLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 600));
    updateProfile({ primaryDomain: selectedRoles });
    setLoading(false);
    navigate('/app');
  };

  return (
    <div className="domain-page">
      {/* ── Background Pattern ── */}
      <div className="domain-page__bg-glow"></div>

      {/* ── Header ── */}
      <div className="domain-page__header">
        <div className="domain-page__nav">
          <button className="domain-page__nav-btn" onClick={() => navigate(-1)}>
            <TbArrowLeft size={20} /> <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '600' }}>Back</span>
          </button>
        </div>

        <motion.div
           className="domain-page__illustration"
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 0.55, type: 'spring', bounce: 0.4 }}
        >
          🌊
        </motion.div>

        <motion.div
           className="domain-page__title-pill"
           initial={{ y: 16, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.18 }}
        >
          Choose Your Path
        </motion.div>
        
        <motion.p 
          className="domain-page__subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          How would you like to interact with the marine environment?
        </motion.p>
      </div>

      {/* ── Body ── */}
      <div className="domain-page__body">
        <motion.div
           className="domain-role-list"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.3 }}
        >
          {ROLES.map((role, i) => {
            const isSel = selectedRoles.includes(role.id);
            const { Icon } = role;
            return (
              <motion.div
                 key={role.id}
                 className={`domain-role-card ${isSel ? 'domain-role-card--selected' : ''}`}
                 onClick={() => handleSelect(role.id)}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 + 0.3 }}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
              >
                <div className="domain-role-card__bg" style={{ backgroundImage: `url(${role.img})` }}></div>
                <div className="domain-role-card__content">
                  <div className="domain-role-card__icon-wrap">
                    <Icon size={24} />
                  </div>
                  <div className="domain-role-card__text">
                    <h3 className="domain-role-card__title">{role.title}</h3>
                    <p className="domain-role-card__desc">{role.desc}</p>
                  </div>
                  <div className={`domain-role-card__radio ${isSel ? 'active' : ''}`}>
                    {isSel && <TbCheck size={14} />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Footer ── */}
      <div className="domain-page__footer">
        <button
           className="domain-page__cta"
           onClick={handleContinue}
           disabled={selectedRoles.length === 0 || loading}
        >
          {loading ? 'PROCESSING…' : 'CONTINUE'}
        </button>
      </div>
    </div>
  );
}
