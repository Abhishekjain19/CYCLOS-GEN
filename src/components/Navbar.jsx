import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX } from 'react-icons/fi';
import { TbLeaf } from 'react-icons/tb';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${open ? 'navbar--open' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">
            <TbLeaf size={22} />
          </div>
          <span>Cyclos</span>
        </Link>

        <div className="navbar__links">
          <a href="#what-we-do" className="navbar__link">What We Do</a>
          <a href="#about" className="navbar__link">About</a>
          {user ? (
            <Link to="/app" className="btn-primary"><span>Dashboard</span></Link>
          ) : (
            <>
              <Link to="/login" className="btn-outline">Login</Link>
              <Link to="/signup" className="btn-primary"><span>Sign Up</span></Link>
            </>
          )}
        </div>

        <button className="navbar__burger" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="navbar__mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <a href="#what-we-do" className="navbar__mobile-link" onClick={() => setOpen(false)}>What We Do</a>
            <a href="#about" className="navbar__mobile-link" onClick={() => setOpen(false)}>About</a>
            {user ? (
              <Link to="/app" className="btn-primary" onClick={() => setOpen(false)}><span>Dashboard</span></Link>
            ) : (
              <>
                <Link to="/login" className="btn-outline" onClick={() => setOpen(false)}>Login</Link>
                <Link to="/signup" className="btn-primary" onClick={() => setOpen(false)}><span>Sign Up</span></Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
