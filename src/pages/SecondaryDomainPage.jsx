import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { TbArrowLeft, TbClipboardList, TbX, TbSearch, TbCheck } from 'react-icons/tb';
import './DomainPage.css';

/* Secondary (sourcing/material) categories */
const SECONDARY_DOMAINS = [
  {
    id: 'compost',
    title: 'COMPOST',
    img: 'https://images.unsplash.com/photo-1591189824523-749ef1e41888?w=300&q=80',
  },
  {
    id: 'steel',
    title: 'STEEL',
    img: 'https://images.unsplash.com/photo-1533033522057-d88dce248b40?w=300&q=80',
  },
  {
    id: 'copper',
    title: 'COPPER',
    img: 'https://images.unsplash.com/photo-1590486803833-ffc6f9d4c80c?w=300&q=80',
  },
  {
    id: 'aluminium',
    title: 'ALUMINIUM',
    img: 'https://images.unsplash.com/photo-1584013341516-de1ec359d95f?w=300&q=80',
  },
  {
    id: 'iron',
    title: 'IRON',
    img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80',
  },
  {
    id: 'plastic_res',
    title: 'RECYCLED PLASTIC',
    img: 'https://images.unsplash.com/photo-1611284446314-60a58a7dd514?w=300&q=80',
  },
  {
    id: 'paper_pulp',
    title: 'PAPER PULP',
    img: 'https://images.unsplash.com/photo-1603484477859-abe6a73f9366?w=300&q=80',
  },
  {
    id: 'textiles',
    title: 'TEXTILES',
    img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300&q=80',
  },
  {
    id: 'rubber',
    title: 'RUBBER',
    img: 'https://images.unsplash.com/photo-1518534845532-6a7e02fb0ee7?w=300&q=80',
  },
];

export default function SecondaryDomainPage() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleContinue = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    updateProfile({ secondaryDomain: selected[0] });
    setLoading(false);
    navigate('/app');
  };

  const filtered = SECONDARY_DOMAINS.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="domain-page">
      {/* ── Purple header ───────────────── */}
      <div className="domain-page__header">
        {/* nav row: back + search */}
        <div className="domain-page__nav">
          <button className="domain-page__nav-btn" onClick={() => navigate(-1)}>
            <TbArrowLeft size={20} />
          </button>
          <div className="domain-page__search-wrap">
            <TbSearch size={15} className="domain-page__search-icon" />
            <input
              className="domain-page__search"
              placeholder="Search sourcing category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* illustration */}
        <motion.div
          className="domain-page__illustration"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.55, type: 'spring', bounce: 0.4 }}
        >
          📦🏭
        </motion.div>

        {/* title pill */}
        <motion.div
          className="domain-page__title-pill"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          Select Sourcing Needs
        </motion.div>
      </div>

      {/* ── Body ────────────────────────── */}
      <div className="domain-page__body">
        {/* sub-header */}
        <div className="domain-page__list-header">
          <div className="domain-page__list-header-left">
            <TbClipboardList size={17} />
            <span>Market price list</span>
          </div>
          <motion.div
            className="domain-page__list-header-right"
            key={selected.length}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
          >
            {selected.length} Selected
            <TbX size={15} onClick={() => setSelected([])} />
          </motion.div>
        </div>

        {/* card grid */}
        <motion.div
          className="domain-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.p key="empty" className="domain-empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                No categories match "{search}"
              </motion.p>
            ) : (
              filtered.map((d, i) => {
                const isSel = selected.includes(d.id);
                return (
                  <motion.div
                    key={d.id}
                    className={`domain-card${isSel ? ' domain-card--selected' : ''}`}
                    style={{
                      backgroundImage: `url(${d.img})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    onClick={() => toggleSelect(d.id)}
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {isSel
                      ? <span className="domain-card__check"><TbCheck size={12} /></span>
                      : <span className="domain-card__plus">+</span>
                    }
                    <span className="domain-card__title">{d.title}</span>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Fixed footer ────────────────── */}
      <div className="domain-page__footer">
        <button
          className="domain-page__cta"
          onClick={handleContinue}
          disabled={selected.length === 0 || loading}
        >
          {loading ? 'PROCESSING…' : 'GO TO DASHBOARD'}
        </button>
      </div>
    </div>
  );
}
