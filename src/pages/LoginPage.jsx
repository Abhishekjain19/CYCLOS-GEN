import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { TbLeaf, TbMail, TbLock, TbEye, TbEyeOff, TbArrowLeft } from 'react-icons/tb';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF, FaApple } from 'react-icons/fa';
import { supabase } from '../supabase/supabaseClient';
import './AuthPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Both fields are required.');
    setLoading(true);
    setError('');
    
    try {
      await login(form.email, form.password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    try {
      setLoading(true);
      setError('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin + '/app'
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Social login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__blob auth-page__blob--1" />
      <div className="auth-page__blob auth-page__blob--2" />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link to="/" className="auth-card__back">
          <TbArrowLeft size={16} /> Back to home
        </Link>

        <div className="auth-card__logo">
          <div className="auth-card__logo-icon"><TbLeaf size={20} /></div>
          <span>Cyclos</span>
        </div>

        <h1 className="auth-card__title">Welcome back to<br />Cyclos.</h1>
        <p className="auth-card__sub">Sign in to your SWM 2026 portal</p>

        {error && (
          <motion.div className="auth-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-field-label">Email Address</label>
            <TbMail size={17} className="auth-field__icon" style={{ top: 'calc(50% + 12px)' }} />
            <input
              type="email"
              placeholder="Albertstevano@gmail.com"
              className="input-field auth-field__input"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-field-label">Password</label>
            <TbLock size={17} className="auth-field__icon" style={{ top: 'calc(50% + 12px)' }} />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••••••"
              className="input-field auth-field__input"
              value={form.password}
              onChange={update('password')}
              autoComplete="current-password"
            />
            <button type="button" className="auth-field__toggle" style={{ top: 'calc(50% + 12px)' }} onClick={() => setShowPass(!showPass)}>
              {showPass ? <TbEyeOff size={16} /> : <TbEye size={16} />}
            </button>
          </div>

          <div className="auth-forgot">
            <a href="#" className="auth-link" style={{ fontSize: 13 }}>Forgot password?</a>
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            <span>{loading ? <><div className="spinner" /> Signing in…</> : 'Sign In'}</span>
          </button>
        </form>

        <div className="auth-divider">Or sign in with</div>

        <div className="auth-social-row">
          <button type="button" className="auth-social-btn auth-social-btn--google" onClick={() => handleSocial('google')} aria-label="Continue with Google">
            <FcGoogle size={20} />
          </button>
          <button type="button" className="auth-social-btn auth-social-btn--facebook" onClick={() => handleSocial('facebook')} aria-label="Continue with Facebook">
            <FaFacebookF size={18} />
          </button>
          <button type="button" className="auth-social-btn auth-social-btn--apple" onClick={() => handleSocial('apple')} aria-label="Continue with Apple">
            <FaApple size={20} />
          </button>
        </div>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
