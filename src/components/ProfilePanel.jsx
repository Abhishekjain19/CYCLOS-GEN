// src/components/ProfilePanel.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TbX, TbEdit, TbCameraPlus, TbLogout, TbCheck, TbTrendingUp, TbRipple, TbLeaf, TbCalendarEvent, TbMapPin, TbTrash } from 'react-icons/tb';
import { supabase } from '../supabase/supabaseClient';
import { toast } from 'react-hot-toast';
import './ProfilePanel.css';

export default function ProfilePanel({ isOpen, onClose }) {
  const { user, userProfile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(userProfile?.full_name || 'User');
  const [profilePic, setProfilePic] = useState(null);
  
  const [activeEvents, setActiveEvents] = useState([]);
  const [conductedCount, setConductedCount] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(false);

  React.useEffect(() => {
    if (isOpen && user) {
      fetchUserEvents();
    }
  }, [isOpen, user]);

  const fetchUserEvents = async () => {
    setLoadingEvents(true);
    try {
      // 1. Fetch active events created by user
      const { data: active, error: activeErr } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .eq('status', 'active');
      
      if (activeErr) throw activeErr;
      setActiveEvents(active || []);

      // 2. Count "Events Conducted" (completed)
      const { count, error: countErr } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'completed');

      if (countErr) throw countErr;
      setConductedCount(count || 0);

    } catch (err) {
      console.error('Error fetching user events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleDeactivate = async (eventId) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'completed' })
        .eq('id', eventId);

      if (error) throw error;
      
      toast.success('Event deactivated and marked as completed!');
      fetchUserEvents();
    } catch (err) {
      console.error('Error deactivating event:', err);
      toast.error('Failed to deactivate event.');
    }
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const handleSaveName = async () => {
    try {
      await updateProfile({ full_name: editedName });
      setIsEditingName(false);
    } catch (err) {
      console.error('Error updating name:', err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const marketplaceActivity = [
    { id: 1, name: 'Ocean Grade Plastic', action: 'Purchase', qty: '50 kg', date: 'Oct 12, 2026', status: 'Completed', color: 'purchased' },
    { id: 2, name: 'Mixed PET Bottles', action: 'Recycled', qty: '12 kg', date: 'Oct 10, 2026', status: 'Verified', color: 'recycled' },
    { id: 3, name: 'Glass Shards', action: 'Sold', qty: '8 kg', date: 'Oct 08, 2026', status: 'Pending', color: 'sold' },
    { id: 4, name: 'Recycled Fiber Bag', action: 'Purchase', qty: '2 items', date: 'Oct 01, 2026', status: 'Completed', color: 'purchased' }
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'Verified': return 'status-verified';
      case 'Pending': return 'status-pending';
      default: return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="profile-panel-overlay" onClick={onClose}>
          <motion.div 
            className="profile-panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="profile-panel__header">
              <h3>User Profile</h3>
              <button className="panel-close-btn" onClick={onClose} aria-label="Close Profile">
                <TbX size={20} />
              </button>
            </div>

            <div className="profile-panel__scroll">
              {/* Section 1: User Profile Settings */}
              <div className="panel-section center-align">
                <div className="profile-avatar-container" onClick={() => fileInputRef.current?.click()}>
                  <div className="profile-avatar-wrapper">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="profile-avatar-img" />
                    ) : (
                      <div className="profile-avatar-fallback">
                        {(editedName || 'L').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="profile-avatar-overlay">
                      <TbCameraPlus size={24} />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>

                <div className="profile-name-container">
                  {isEditingName ? (
                    <div className="profile-name-edit">
                      <input 
                        type="text" 
                        value={editedName} 
                        onChange={(e) => setEditedName(e.target.value)} 
                        autoFocus
                        className="profile-name-input"
                      />
                      <button onClick={handleSaveName} className="btn-icon btn-save"><TbCheck size={16} /></button>
                      <button onClick={() => setIsEditingName(false)} className="btn-icon btn-cancel"><TbX size={16} /></button>
                    </div>
                  ) : (
                    <div className="profile-name-view" onClick={() => setIsEditingName(true)}>
                      <h2 className="profile-name">{editedName}</h2>
                      <TbEdit size={16} className="edit-icon" />
                    </div>
                  )}
                  <p className="profile-role">Sustainability Champion</p>
                </div>
              </div>

              {/* Section 2: User Contribution Stats */}
              <div className="panel-section">
                <h4 className="section-title">Contribution Stats</h4>
                <div className="stats-col">
                  <div className="stat-card">
                    <div className="stat-card__icon bg-blue"><TbRipple size={20} /></div>
                    <div className="stat-card__data">
                      <span className="stat-label">OBP Left</span>
                      <span className="stat-value">25.4 kg</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__icon bg-green"><TbTrendingUp size={20} /></div>
                    <div className="stat-card__data">
                      <span className="stat-label">Kg Recycled</span>
                      <span className="stat-value">142 kg</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__icon bg-teal"><TbLeaf size={20} /></div>
                    <div className="stat-card__data">
                      <span className="stat-label">Points Earned</span>
                      <span className="stat-value">8,450</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__icon bg-blue"><TbCalendarEvent size={20} /></div>
                    <div className="stat-card__data">
                      <span className="stat-label">Events Hosted</span>
                      <span className="stat-value">{conductedCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Active Events */}
              <div className="panel-section">
                <h4 className="section-title">My Active Events</h4>
                <div className="active-events-list">
                  {activeEvents.length === 0 ? (
                    <p className="empty-text">No active drives organized yet.</p>
                  ) : (
                    activeEvents.map(ev => (
                      <div key={ev.id} className="user-event-card">
                        <div className="user-event-card__info">
                          <h5>{ev.title}</h5>
                          <span><TbMapPin size={12} /> {ev.location}</span>
                        </div>
                        <button 
                          className="btn-deactivate" 
                          onClick={() => handleDeactivate(ev.id)}
                          title="Deactivate (Mark as Completed)"
                        >
                          Deactivate
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section 3: Marketplace Activity */}
              <div className="panel-section">
                <h4 className="section-title">Marketplace Activity</h4>
                <div className="activity-list">
                  {marketplaceActivity.map((item) => (
                    <div key={item.id} className="activity-card">
                      <div className="activity-card__header">
                        <span className={`activity-type badge-${item.color}`}>{item.action}</span>
                        <span className={`activity-status ${getStatusClass(item.status)}`}>{item.status}</span>
                      </div>
                      <h5 className="activity-name">{item.name}</h5>
                      <div className="activity-meta">
                        <span>Qty: {item.qty}</span>
                        <span className="activity-dot">•</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: Account Action */}
            <div className="profile-panel__footer">
              <button className="btn-logout" onClick={handleLogout}>
                <TbLogout size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
