import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/supabaseClient';
import { TbEdit, TbBell, TbLeaf, TbRipple, TbRecycle, TbBottle, TbAnchor, TbDroplet, TbMessageReport, TbCalendarEvent, TbTrendingUp } from 'react-icons/tb';
import NotificationsPanel from '../components/NotificationsPanel';
import ProfilePanel from '../components/ProfilePanel';

/* Secondary domain materials — icon + color mapping */
const SECONDARY_MATERIALS = [
  { id: 'obp', label: 'OBP', Icon: TbBottle, bg: '#0ea5e9' },
  { id: 'metals', label: 'Metals', Icon: TbRecycle, bg: '#0ea5e9' },
  { id: 'shells', label: 'Sea Shells', Icon: TbDroplet, bg: '#0ea5e9' },
  { id: 'glass', label: 'Glass', Icon: TbLeaf, bg: '#0ea5e9' },
  { id: 'nets', label: 'Ghost Nets', Icon: TbAnchor, bg: '#0ea5e9' },
];
import MapSection from '../components/MapSection';
import LocalFactsCarousel from '../components/LocalFactsCarousel';
import './MainPage.css';

export default function MainPage() {
  const { user, userProfile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

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
    obp: 0,
    points: userProfile?.points || 0,
    eventsConducted: 0,
    activeEvents: 0
  });

  useEffect(() => {
    if (userProfile) {
      fetchDashboardStats();
      
      // Real-time Event Listener for Community Helpers
      if (userProfile?.roles?.includes('community_helper')) {
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
    }
  }, [userProfile]);

  const handleNotificationAction = (notif, btn) => {
    if (btn.action === 'view_event' || notif.type === 'event') {
      navigate('/community', { state: { focusEventId: notif.eventId } });
      setShowNotifications(false);
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
      const obpWeight = activities?.filter(a => a.action === 'OBP Collected').reduce((acc, curr) => acc + parseFloat(curr.qty || 0), 0) || 0;

      setStats({
        recycle: recycleWeight,
        obp: obpWeight,
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

  return (
    <div className="main-page">
      {/* Top Purple Block */}
      <motion.div
        className="dash-header__block"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile Pill */}
        <div className="dash-profile-pill">
          <div className="dash-profile-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="dash-profile-info">
            <h2 className="dash-profile-name">{fullName}</h2>
            <p className="dash-profile-sub">{locationText}</p>
          </div>
          <div className="dash-profile-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="dash-profile-edit" aria-label="Complaints" onClick={() => navigate('/complaint')}>
              <TbMessageReport size={16} />
            </button>
            <div className="notification-wrapper">
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
            <div className="dash-stat-card__icon bg-cyan"><TbRipple size={20} /></div>
            <div className="dash-stat-card__content">
              <span className="dash-stat-label">OBP Collected</span>
              <div className="dash-stat-value-group">
                <span className="dash-stat-value">{stats.obp.toFixed(1)}</span>
                <span className="dash-stat-unit">kg</span>
              </div>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-card__icon bg-purple"><TbTrendingUp size={20} /></div>
            <div className="dash-stat-card__content">
              <span className="dash-stat-label">Total Recycled</span>
              <div className="dash-stat-value-group">
                <span className="dash-stat-value">{stats.recycle.toFixed(1)}</span>
                <span className="dash-stat-unit">kg</span>
              </div>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-card__icon bg-teal"><TbLeaf size={20} /></div>
            <div className="dash-stat-card__content">
              <span className="dash-stat-label">Eco Points</span>
              <div className="dash-stat-value-group">
                <span className="dash-stat-value">{stats.points.toLocaleString()}</span>
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
            <h3 className="dash-section-title">Nearby Ocean's</h3>
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
          <div className="dash-section-header" style={{ marginTop: '32px' }}>
            <h3 className="dash-section-title">Materials</h3>
            <a href="/marketplace" className="dash-section-viewall">View all</a>
          </div>

          <div className="dash-materials-scroll">
            {SECONDARY_MATERIALS.map(({ id, label, Icon, bg }) => (
              <div
                key={id}
                className="material-card"
                style={{ background: bg, cursor: 'pointer' }}
                onClick={() => navigate(`/marketplace?category=${id}`)}
              >
                <Icon size={32} color="#110e1b" style={{ position: 'absolute', top: 16, opacity: 0.2 }} />
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
          <hr style={{ height: "2px", borderWidth: 0, backgroundColor: "white" }} />
          <LocalFactsCarousel location={locationText} />
          <hr style={{ height: "2px", borderWidth: 0, backgroundColor: "white" }} />
        </motion.div>
      </div>
    </div>
  );
}
