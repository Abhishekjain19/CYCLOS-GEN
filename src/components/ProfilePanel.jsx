// src/components/ProfilePanel.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TbX, TbEdit, TbCameraPlus, TbLogout, TbCheck, TbTrendingUp, TbRipple, TbLeaf, TbCalendarEvent, TbMapPin, TbTrash, TbQrcode } from 'react-icons/tb';
import { supabase } from '../supabase/supabaseClient';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';
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
      fetchAcceptedRequests();
      fetchPendingPurchases();
    }
  }, [isOpen, user]);

  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [selectedQR, setSelectedQR] = useState(null);

  // Real-time synchronization for order status changes
  React.useEffect(() => {
    if (!user || !isOpen) return;

    const ordersChannel = supabase
      .channel('profile-orders-sync')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public', 
        table: 'market_orders'
      }, (payload) => {
        // Refresh both lists if any order involving the user changes
        const isParticipant = payload.new?.buyer_id === user.id || payload.new?.seller_id === user.id || 
                             payload.old?.buyer_id === user.id || payload.old?.seller_id === user.id;
        
        if (isParticipant) {
          fetchAcceptedRequests();
          fetchPendingPurchases();
          if (payload.new?.status === 'accepted' && payload.new?.buyer_id === user.id) {
            toast.success(`Order for ${payload.new.product_name} accepted! QR code is ready.`);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(ordersChannel); };
  }, [user, isOpen]);

  const fetchAcceptedRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('market_orders')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'accepted');
      if (error) throw error;
      setAcceptedRequests(data || []);
    } catch (err) {
      console.error('Error fetching accepted requests:', err);
    }
  };

  const fetchPendingPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('market_orders')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('status', 'accepted');
      if (error) throw error;
      setPendingPurchases(data || []);
    } catch (err) {
      console.error('Error fetching pending purchases:', err);
    }
  };

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

  const marketplaceActivity = [];

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
                <button 
                  onClick={() => { fetchAcceptedRequests(); fetchPendingPurchases(); fetchUserEvents(); }}
                  style={{ marginTop: '12px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--teal-300)', color: 'var(--teal-300)', borderRadius: '20px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Refresh Orders
                </button>
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
                      <span className="stat-value">{userProfile?.total_recycled_weight || 0} kg</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__icon bg-teal"><TbLeaf size={20} /></div>
                    <div className="stat-card__data">
                      <span className="stat-label">Points Earned</span>
                      <span className="stat-value">{userProfile?.points || 0}</span>
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

              <div className="panel-section">
                <h4 className="section-title">Transactions & Orders</h4>
                
                <div className="orders-container">
                  {/* Buyer View: Show QR Codes for Accepted Items and Pending status */}
                  {pendingPurchases.length > 0 ? (
                    <div style={{ marginBottom: '24px' }}>
                      <h5 style={{ fontSize: '12px', color: 'var(--teal-300)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TbShoppingCart /> My Orders
                      </h5>
                      <div className="active-events-list">
                        {pendingPurchases.map(req => (
                          <div 
                            key={req.id} 
                            className="user-event-card" 
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'flex-start', 
                              cursor: 'pointer', 
                              border: selectedQR === req.id ? '1px solid var(--teal-300)' : '1px solid #e2e8f0',
                            }}
                            onClick={() => setSelectedQR(selectedQR === req.id ? null : req.id)}
                          >
                            <div className="user-event-card__info" style={{ width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <h5 style={{ margin: 0 }}>{req.product_name}</h5>
                                <span style={{ 
                                  fontSize: '9px', 
                                  padding: '2px 6px', 
                                  borderRadius: '10px', 
                                  background: '#dcfce7',
                                  color: '#166534',
                                  fontWeight: '700',
                                  textTransform: 'uppercase'
                                }}>
                                  LOCKED
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Seller: {req.seller_name}</span>
                              <p style={{ fontSize: '10px', color: 'var(--teal-500)', marginTop: '4px', fontWeight: 'bold' }}>
                                {selectedQR === req.id ? 'Click to Hide QR' : 'Click to View QR Code'}
                              </p>
                            </div>
                            {selectedQR === req.id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ marginTop: 16, padding: 16, background: 'white', borderRadius: 12, alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
                              >
                                <QRCode value={`REQ-${req.id}-${req.buyer_id}`} size={140} />
                                <p style={{ textAlign: 'center', color: '#1e293b', fontSize: 10, marginTop: 8, fontWeight: 700 }}>
                                  SCAN TO COMPLETE PICKUP
                                </p>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Seller View: Show Scan Button for Accepted Orders */}
                  {acceptedRequests.length > 0 ? (
                    <div>
                      <h5 style={{ fontSize: '12px', color: 'var(--teal-300)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TbCameraPlus /> Pending Pickups (Seller)
                      </h5>
                      <div className="active-events-list">
                        {acceptedRequests.map(req => (
                          <div key={req.id} className="user-event-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div className="user-event-card__info" style={{ width: '100%' }}>
                              <h5>{req.product_name}</h5>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Buyer: {req.buyer_name}</span>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate('/scan'); onClose(); }}
                              style={{ marginTop: '10px', width: '100%', padding: '8px', background: 'var(--teal-500)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              Open Scanner to Verify
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {(pendingPurchases.length === 0 && acceptedRequests.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '20px 0', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>No active pickups/purchases found.</p>
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#cbd5e1' }}>Only accepted requests with QR codes will appear here.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: History/General Activity */}
              <div className="panel-section">
                <h4 className="section-title">Marketplace Activity</h4>
                <div className="activity-list">
                  {marketplaceActivity.length === 0 ? (
                    <p className="empty-text">No marketplace history yet.</p>
                  ) : (
                    marketplaceActivity.map((item) => (
                      <div key={item.id} className="activity-card">
                        <h5 className="activity-name">{item.name}</h5>
                        <p className="activity-meta">{item.date} • {item.action}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

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
