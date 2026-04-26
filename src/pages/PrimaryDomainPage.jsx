import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { TbArrowLeft, TbCheck, TbUserCheck, TbUsers } from 'react-icons/tb';
import './DomainPage.css';

const DOMAINS = [
  { id: 'household', title: 'Household', desc: 'Daily domestic waste', Icon: TbUserCheck },
  { id: 'industrial', title: 'Industrial', desc: 'Manufacturing and factory waste', Icon: TbUsers },
  { id: 'commercial', title: 'Commercial', desc: 'Retail, restaurants, offices', Icon: TbUserCheck },
  { id: 'agricultural', title: 'Agricultural', desc: 'Farming and organic waste', Icon: TbUsers },
  { id: 'ewaste', title: 'E-Waste', desc: 'Electronics and digital scrap', Icon: TbUserCheck },
  { id: 'hazardous', title: 'Hazardous', desc: 'Chemicals, paints, toxic materials', Icon: TbUsers },
  { id: 'construction', title: 'Construction', desc: 'C&D debris and rubble', Icon: TbUserCheck },
  { id: 'medical', title: 'Medical', desc: 'Biomedical and clinic waste', Icon: TbUsers }
];

export default function PrimaryDomainPage() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSelect = (id) => {
    setSelectedDomains(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selectedDomains.length === 0) return;
    setLoading(true);
    try {
      await updateProfile({ 
        primary_domain: selectedDomains.join(', ')
      });
      navigate('/onboard/secondary');
    } catch (err) {
      console.error('Error updating profile with roles:', err);
    } finally {
      setLoading(false);
    }
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
          🌱
        </motion.div>

        <motion.div
           className="domain-page__title-pill"
           initial={{ y: 16, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.18 }}
        >
          Primary Domain
        </motion.div>
        
        <motion.p 
          className="domain-page__subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Where do you generate waste? Select all that apply.
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
          {DOMAINS.map((domain, i) => {
            const isSel = selectedDomains.includes(domain.id);
            const { Icon } = domain;
            return (
              <motion.div
                 key={domain.id}
                 className={`domain-role-card ${isSel ? 'domain-role-card--selected' : ''}`}
                 onClick={() => handleSelect(domain.id)}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 + 0.3 }}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
              >
                <div className="domain-role-card__content">
                  <div className="domain-role-card__icon-wrap">
                    <Icon size={24} />
                  </div>
                  <div className="domain-role-card__text">
                    <h3 className="domain-role-card__title">{domain.title}</h3>
                    <p className="domain-role-card__desc">{domain.desc}</p>
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
           disabled={selectedDomains.length === 0 || loading}
        >
          {loading ? 'PROCESSING…' : 'CONTINUE'}
        </button>
      </div>
    </div>
  );
}
