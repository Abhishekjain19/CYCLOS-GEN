import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TbShoppingCart, TbRecycle, TbLeaf, TbX } from 'react-icons/tb';
import './NotificationsPanel.css';

export default function NotificationsPanel({ isOpen, onClose, notifications, onAction }) {
  if (!isOpen) return null;

  const renderIcon = (type) => {
    switch(type) {
      case 'buy_request': return <TbShoppingCart size={20} className="notif-icon notif-icon--blue" />;
      case 'pickup': return <TbRecycle size={20} className="notif-icon notif-icon--green" />;
      case 'event': return <TbLeaf size={20} className="notif-icon notif-icon--teal" />;
      default: return <TbLeaf size={20} className="notif-icon" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="notifications-dropdown"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="notifications-header">
            <div>
              <h3>Notifications</h3>
              <p>Marketplace and community updates</p>
            </div>
            <button className="notif-close-btn" onClick={onClose} aria-label="Close Notifications">
              <TbX size={18} />
            </button>
          </div>
          <div className="notifications-body">
            {notifications.length === 0 ? (
              <div className="notif-empty">No new notifications</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                  <div className="notif-item-header">
                    {renderIcon(notif.type)}
                    <span className="notif-time">{notif.timestamp}</span>
                  </div>
                  <div className="notif-content">
                    <p className="notif-message">{notif.message}</p>
                    {notif.subtext && <p className="notif-subtext">{notif.subtext}</p>}
                  </div>
                  <div className="notif-actions">
                    {notif.buttons?.map((btn, idx) => (
                      <button 
                        key={idx} 
                        className={`notif-btn notif-btn--${btn.style || 'secondary'}`}
                        onClick={() => onAction && onAction(notif, btn)}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
