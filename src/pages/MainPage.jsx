import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/supabaseClient';
import { TbEdit, TbBell, TbLeaf, TbRipple, TbRecycle, TbBottle, TbAnchor, TbDroplet, TbMessageReport, TbCalendarEvent, TbTrendingUp } from 'react-icons/tb';
import NotificationsPanel from '../components/NotificationsPanel';
import ProfilePanel from '../components/ProfilePanel';

/* Secondary domain materials — icon + color mapping */
const SECONDARY_MATERIALS = [
  { id: 'compost', label: 'Compost', Icon: TbLeaf, bg: '#4ADE80' },
  { id: 'metals', label: 'Metals', Icon: TbRecycle, bg: '#4ADE80' },
  { id: 'plastic_res', label: 'Plastics', Icon: TbBottle, bg: '#4ADE80' },
  { id: 'glass', label: 'Glass', Icon: TbDroplet, bg: '#4ADE80' },
  { id: 'paper_pulp', label: 'Paper Pulp', Icon: TbRipple, bg: '#4ADE80' },
];
import MapSection from '../components/MapSection';
import LocalFactsCarousel from '../components/LocalFactsCarousel';
import './MainPage.css';

/* ── Count-Up Hook ─────────────────── */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const run = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(parseFloat((progress * target).toFixed(1)));
      if (progress < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

export default function MainPage() {
  const { user, userProfile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const notifWrapperRef = useRef(null);

  // Close notification panel when clicking outside
  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e) => {
      if (notifWrapperRef.current && !notifWrapperRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'buy_request',
      message: 'New buy request received.',
      subtext: 'A buyer wants to purchase recycled plastic from your listing.',
      timestamp: '10 minutes ago',
      read: false,
      buttons: [
        { label: 'View Request', style: 'secondary' },
        { label: 'Accept', style: 'primary' }
      ]
    },
    {
      id: 2,
      type: 'pickup',
      message: 'Recycler confirmed pickup for your recyclable waste.',
      subtext: 'Scheduled pickup: Tomorrow at 10:00 AM.',
      timestamp: '2 hours ago',
      read: false,
      buttons: [
        { label: 'View Details', style: 'secondary' },
        { label: 'Track Pickup', style: 'primary' }
      ]
    }
  ]);

  const [stats, setStats] = useState({
    recycle: 0,
    swm: 0,
    points: userProfile?.points || 0,
    eventsConducted: 0,
    activeEvents: 0
  });

  useEffect(() => {
    if (userProfile) {
      fetchDashboardStats();
      
      // Real-time Event Listener for All Users
      const channel = supabase
        .channel('dashboard:events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
          const newNotif = {
            id: `event-${payload.new.id}`,
            type: 'event',
            message: `New Event: ${payload.new.title}`,
            subtext: payload.new.description?.substring(0, 60) + '...',
            timestamp: 'Just now',
            read: false,
            eventId: payload.new.id,
            buttons: [
              { label: 'View Event', style: 'primary', action: 'view_event' }
            ]
          };
          setNotifications(prev => [newNotif, ...prev]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [userProfile]);

  // ── Real-time buy request notifications for sellers ──────
  useEffect(() => {
    if (!user) return;

    // Fetch any existing pending buy requests for the current seller
    const fetchPendingBuyRequests = async () => {
      try {
        const { data } = await supabase
          .from('market_orders')
          .select('*')
          .eq('seller_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          const buyNotifs = data.map(req => ({
            id: `buy-${req.id}`,
            type: 'buy_request',
            message: 'New buy request received for your recyclable listing.',
            subtext: `${req.buyer_name || 'A buyer'} wants to purchase ${req.product_name || 'your item'}.`,
            timestamp: new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            buttons: [
              { label: 'View Request', style: 'secondary' },
              { label: 'Accept', style: 'primary' }
            ]
          }));
          setNotifications(prev => {
            // Only add new ones not already in state
            const existingIds = new Set(prev.map(n => n.id));
            const fresh = buyNotifs.filter(n => !existingIds.has(n.id));
            return fresh.length > 0 ? [...fresh, ...prev] : prev;
          });
        }
      } catch (err) {
        // Buy requests table may not exist yet — silently ignore
        console.debug('Buy requests fetch skipped:', err.message);
      }
    };

    fetchPendingBuyRequests();

    // Subscribe to new buy requests where user is the seller
    const buyChannel = supabase
      .channel('dashboard:buy-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'market_orders',
        filter: `seller_id=eq.${user.id}`,
      }, (payload) => {
        const req = payload.new;
        const newNotif = {
          id: `buy-${req.id}`,
          type: 'buy_request',
          message: 'New buy request received for your recyclable listing.',
          subtext: `${req.buyer_name || 'A buyer'} wants to purchase ${req.product_name || 'your item'}.`,
          timestamp: 'Just now',
          read: false,
          buttons: [
            { label: 'View Request', style: 'secondary' },
            { label: 'Accept', style: 'primary' }
          ]
        };
        setNotifications(prev => [newNotif, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(buyChannel); };
  }, [user]);

  const handleNotificationAction = async (notif, btn) => {
    if (btn.action === 'view_event' || notif.type === 'event') {
      navigate('/community', { state: { focusEventId: notif.eventId } });
      setShowNotifications(false);
    }
    
    if (notif.type === 'buy_request' && btn.label === 'Accept') {
      const realId = notif.id.replace('buy-', '');
      try {
        await supabase.from('market_orders').update({ status: 'accepted' }).eq('id', realId);
        // Remove from notifications
        setNotifications(prev => prev.filter(n => n.id !== notif.id));
        // Show profile panel so they can see QR
        setShowNotifications(false);
        setShowProfilePanel(true);
      } catch (err) {
        console.error('Error accepting buy request:', err);
      }
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // 1. Fetch Events Conducted
      const { count: conductedCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'completed');

      // 2. Fetch Active Events Joined
      const { count: activeCount } = await supabase
        .from('event_participants')
        .select('*, events!inner(*)', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('events.status', 'active');

      // 3. Fetch Recycle/OBP from activities (mocked logic based on existing labels)
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id);
      
      const recycleWeight = activities?.filter(a => a.action === 'Recycled').reduce((acc, curr) => acc + parseFloat(curr.qty || 0), 0) || 0;
      const swmWeight = activities?.filter(a => a.action === 'Waste Diverted').reduce((acc, curr) => acc + parseFloat(curr.qty || 0), 0) || 0;

      setStats({
        recycle: recycleWeight,
        swm: swmWeight,
        points: userProfile?.points || 0,
        eventsConducted: conductedCount || 0,
        activeEvents: activeCount || 0
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const fullName = userProfile?.full_name || 'User';
  const firstName = fullName.split(' ')[0];
  const locationText = userProfile?.primaryDomain ? 'Malleshwaram, Bengaluru' : 'Local Eco Hub';

  const swmCount    = useCountUp(stats.swm, 1400);
  const recycleCount = useCountUp(stats.recycle, 1400);
  const pointsCount  = useCountUp(stats.points, 1000);

  return (
    <div className="main-page">
      {/* Identity Card */}
      <motion.div
        className="dash-header__block"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
      >
        <div className="dash-profile-pill">
          <div className="dash-profile-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="dash-profile-info">
            <h2 className="dash-profile-name">{fullName}</h2>
            <p className="dash-profile-sub">{locationText}</p>
          </div>
          <div className="dash-profile-actions">
            <button className="dash-profile-edit" aria-label="Complaints" onClick={() => navigate('/complaint')}>
              <TbMessageReport size={16} />
            </button>
            <div className="notification-wrapper" ref={notifWrapperRef}>
              <button
                className="dash-profile-edit"
                aria-label="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <TbBell size={16} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              <NotificationsPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onAction={handleNotificationAction}
              />
            </div>
            <button className="dash-profile-edit" aria-label="Dashboard" onClick={() => setShowProfilePanel(!showProfilePanel)}>
              <TbEdit size={16} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="dash-stats-row">
          <div className="dash-stat-card">
            <div className="dash-stat-card__icon bg-cyan"><TbRipple size={18} /></div>
            <div className="dash-stat-card__content">
              <span className="dash-stat-label">Waste Diverted</span>
              <div className="dash-stat-value-group">
                <span className="dash-stat-value">{swmCount.toFixed(1)}</span>
                <span className="dash-stat-unit">kg</span>
              </div>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-card__icon bg-purple"><TbTrendingUp size={18} /></div>
            <div className="dash-stat-card__content">
              <span className="dash-stat-label">Total Recycled</span>
              <div className="dash-stat-value-group">
                <span className="dash-stat-value">{recycleCount.toFixed(1)}</span>
                <span className="dash-stat-unit">kg</span>
              </div>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-card__icon bg-teal"><TbLeaf size={18} /></div>
            <div className="dash-stat-card__content">
              <span className="dash-stat-label">Eco Points</span>
              <div className="dash-stat-value-group">
                <span className="dash-stat-value">{Math.round(pointsCount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ProfilePanel 
        isOpen={showProfilePanel} 
        onClose={() => setShowProfilePanel(false)} 
      />

      <div className="dash-content">
        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="dash-section-header">
            <h3 className="dash-section-title">Eco-Intelligence Map</h3>
            {/* <a href="#" className="dash-section-viewall">View all</a>` */}
          </div>
          <div className="dash-map-card">
            <MapSection domain={userProfile?.secondaryDomain} />
          </div>
        </motion.div>

        {/* Materials Scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginBottom: '32px' }}
        >
          <div className="dash-section-header" style={{ marginTop: '28px' }}>
            <h3 className="dash-section-title">Materials</h3>
            <a href="/marketplace" className="dash-section-viewall">View all</a>
          </div>

          <div className="dash-materials-scroll">
            {SECONDARY_MATERIALS.map(({ id, label, Icon, bg }) => (
              <div
                key={id}
                className="material-card tappable"
                onClick={() => navigate(`/marketplace?category=${id}`)}
              >
                <Icon size={28} className="material-card__icon" />
                <div className="material-card__label">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Local Facts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginBottom: '120px' }}
        >
          <hr style={{ height: "1px", borderWidth: 0, backgroundColor: "rgba(0,229,255,0.08)", margin: '0 0 8px' }} />
          <LocalFactsCarousel location={locationText} />
          <hr style={{ height: "1px", borderWidth: 0, backgroundColor: "rgba(0,229,255,0.08)", margin: '8px 0 0' }} />
        </motion.div>
      </div>
    </div>
  );
}
