import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TbArrowLeft, TbPlus, TbCalendarEvent,
  TbMapPin, TbCheck, TbWaveSine, TbClockHour4,
  TbChevronRight, TbTrash, TbAlertTriangle,
} from 'react-icons/tb';
import './CommunityPage.css';

/* ── Seed events (isOwner: false = not created by this user) ─── */
const SEED_EVENTS = [
  {
    id: 1,
    name: 'Marina Beach Plastic Drive',
    description:
      'Join us for a large-scale cleanup along Marina Beach. We target single-use plastic, ghost nets, and micro-debris near the waterline.',
    location: 'Marina Beach, Chennai',
    date: '2026-04-12',
    category: 'Beach Cleanup',
    spots: 48,
    isOwner: false,
  },
  {
    id: 2,
    name: 'Versova Net Retrieval',
    description:
      'Underwater and surface recovery of abandoned fishing nets entangling marine life off Versova coast. Diving gear provided.',
    location: 'Versova Beach, Mumbai',
    date: '2026-04-19',
    category: 'Ghost Net Removal',
    spots: 20,
    isOwner: false,
  },
  {
    id: 3,
    name: 'Panjim Mangrove Restoration',
    description:
      'Plant mangrove saplings along the estuarine buffer zone to restore coastal biodiversity and natural filtration.',
    location: 'Mandovi Estuary, Goa',
    date: '2026-04-26',
    category: 'Habitat Restoration',
    spots: 35,
    isOwner: false,
  },
  {
    id: 4,
    name: 'Bengaluru Ocean Awareness Rally',
    description:
      'A city march and awareness workshop educating inland communities about how land-based pollution reaches the sea.',
    location: 'Cubbon Park, Bengaluru',
    date: '2026-05-03',
    category: 'Awareness',
    spots: 200,
    isOwner: false,
  },
  {
    id: 5,
    name: 'Kochi Harbour Microplastic Study',
    description:
      "Citizen science data-collection event. Participants sample harbour water and submit data to NIO's national microplastic database.",
    location: 'Kochi Harbour, Kerala',
    date: '2026-05-10',
    category: 'Citizen Science',
    spots: 15,
    isOwner: false,
  },
];

const CATEGORY_COLORS = {
  'Beach Cleanup':       { bg: 'rgba(6,182,212,0.15)',  border: '#06b6d4', text: '#67e8f9' },
  'Ghost Net Removal':   { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', text: '#a5b4fc' },
  'Habitat Restoration': { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#6ee7b7' },
  'Awareness':           { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fcd34d' },
  'Citizen Science':     { bg: 'rgba(139,92,246,0.15)', border: '#8b5cf6', text: '#c4b5fd' },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso) {
  const diff = Math.ceil((new Date(iso) - new Date()) / 86400000);
  if (diff < 0) return 'Past';
  if (diff === 0) return 'Today';
  return `${diff}d away`;
}

/* ── Delete confirmation modal ────────────────────────────── */
function DeleteModal({ eventName, onConfirm, onCancel }) {
  return (
    <motion.div
      className="comm-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="comm-modal"
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="comm-modal__icon">
          <TbAlertTriangle size={28} />
        </div>
        <h3 className="comm-modal__title">Delete Event?</h3>
        <p className="comm-modal__body">
          <strong>"{eventName}"</strong> will be permanently removed and all registered
          volunteers will be notified.
        </p>
        <div className="comm-modal__actions">
          <button className="comm-modal__cancel" onClick={onCancel}>Keep Event</button>
          <button className="comm-modal__confirm" onClick={onConfirm}>
            <TbTrash size={15} /> Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Join Events View ─────────────────────────────────────── */
function JoinView({ events, onJoin, onDelete, onBack }) {
  const [joinedIds, setJoinedIds] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null); // event to confirm deletion

  const handleJoin = (id) => {
    setJoinedIds(prev => ({ ...prev, [id]: true }));
    onJoin(id);
  };

  const confirmDelete = () => {
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <>
      <motion.div
        className="comm-subview"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="comm-subview__header">
          <button className="comm-back-btn" onClick={onBack}><TbArrowLeft size={20} /></button>
          <h2 className="comm-subview__title">Join an Event</h2>
          <span className="comm-subview__count">{events.length}</span>
        </div>

        <div className="comm-events-list">
          <AnimatePresence>
            {events.map((ev, i) => {
              const col = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS['Awareness'];
              const isJoined = joinedIds[ev.id];
              return (
                <motion.div
                  key={ev.id}
                  className="comm-event-card"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
                  transition={{ delay: i * 0.06 }}
                  layout
                >
                  {/* Top row: category badge + delete btn (owner only) */}
                  <div className="comm-event-card__top">
                    <span
                      className="comm-event-cat"
                      style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text }}
                    >
                      {ev.category}
                    </span>

                    {ev.isOwner && (
                      <button
                        className="comm-delete-btn"
                        title="Delete your event"
                        onClick={() => setDeleteTarget(ev)}
                      >
                        <TbTrash size={15} />
                        Your event
                      </button>
                    )}
                  </div>

                  <h3 className="comm-event-name">{ev.name}</h3>
                  <p className="comm-event-desc">{ev.description}</p>

                  <div className="comm-event-meta">
                    <span className="comm-event-meta__item">
                      <TbMapPin size={14} /> {ev.location}
                    </span>
                    <span className="comm-event-meta__item">
                      <TbCalendarEvent size={14} /> {formatDate(ev.date)}
                    </span>
                    <span className="comm-event-meta__item">
                      <TbClockHour4 size={14} /> {daysUntil(ev.date)}
                    </span>
                  </div>

                  <div className="comm-event-footer">
                    <span className="comm-event-spots">{ev.spots} spots left</span>
                    {!ev.isOwner && (
                      <button
                        className={`comm-join-btn ${isJoined ? 'comm-join-btn--joined' : ''}`}
                        onClick={() => !isJoined && handleJoin(ev.id)}
                      >
                        {isJoined ? <><TbCheck size={14} /> Joined</> : 'Join Event'}
                      </button>
                    )}
                    {ev.isOwner && (
                      <span className="comm-owner-badge">👤 Organiser</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {events.length === 0 && (
            <div className="comm-empty">
              <span>🌊</span>
              <p>No events yet. Be the first to create one!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            key="del-modal"
            eventName={deleteTarget.name}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Create Event View ────────────────────────────────────── */
function CreateView({ onBack, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', location: '', date: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Event name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.date) e.date = 'Event date is required';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitted(true);
    onCreated({ ...form, id: Date.now(), category: 'Awareness', spots: 100, isOwner: true });
  };

  if (submitted) {
    return (
      <motion.div
        className="comm-subview comm-success"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="comm-success__icon">🌊</div>
        <h2 className="comm-success__title">Event Created!</h2>
        <p className="comm-success__body">
          <strong>{form.name}</strong> on <strong>{formatDate(form.date)}</strong> at{' '}
          <strong>{form.location}</strong> is now live. You can delete it anytime from
          the event list.
        </p>
        <button className="comm-success__btn" onClick={onBack}>Back to Community</button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="comm-subview"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="comm-subview__header">
        <button className="comm-back-btn" onClick={onBack}><TbArrowLeft size={20} /></button>
        <h2 className="comm-subview__title">Create Event</h2>
        <span />
      </div>

      <div className="comm-form">
        <div className={`comm-field ${errors.name ? 'comm-field--error' : ''}`}>
          <label className="comm-label">Event Name</label>
          <input
            className="comm-input"
            placeholder="e.g. Juhu Beach Cleanup Drive"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
          {errors.name && <span className="comm-error">{errors.name}</span>}
        </div>

        <div className={`comm-field ${errors.description ? 'comm-field--error' : ''}`}>
          <label className="comm-label">Description</label>
          <textarea
            className="comm-input comm-textarea"
            placeholder="Describe the event, what volunteers should bring, safety notes…"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
          />
          {errors.description && <span className="comm-error">{errors.description}</span>}
        </div>

        <div className={`comm-field ${errors.location ? 'comm-field--error' : ''}`}>
          <label className="comm-label">
            <TbMapPin size={14} style={{ marginRight: 4 }} />Event Location
          </label>
          <input
            className="comm-input"
            placeholder="e.g. Juhu Beach, Mumbai"
            value={form.location}
            onChange={e => set('location', e.target.value)}
          />
          {errors.location && <span className="comm-error">{errors.location}</span>}
        </div>

        <div className={`comm-field ${errors.date ? 'comm-field--error' : ''}`}>
          <label className="comm-label">
            <TbCalendarEvent size={14} style={{ marginRight: 4 }} />Event Date
          </label>
          <input
            className="comm-input comm-input--date"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.date && <span className="comm-error">{errors.date}</span>}
        </div>

        <button className="comm-submit-btn" onClick={handleSubmit}>
          <TbPlus size={18} /> Publish Event
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Community Page ──────────────────────────────────── */
export default function CommunityPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('home');
  const [events, setEvents] = useState(SEED_EVENTS);

  const handleCreated = (ev) => {
    setEvents(prev => [ev, ...prev]);
  };

  const handleDelete = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="community-page">
      {/* Animated ocean background blobs */}
      <div className="comm-bg">
        <div className="comm-bg__blob comm-bg__blob--1" />
        <div className="comm-bg__blob comm-bg__blob--2" />
        <div className="comm-bg__blob comm-bg__blob--3" />
      </div>

      <AnimatePresence mode="wait">
        {/* ── Home ───────────────────────────────────── */}
        {view === 'home' && (
          <motion.div
            key="home"
            className="comm-home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="comm-home__header">
              <div className="comm-home__badge">
                <TbWaveSine size={14} /> Ocean Community · 2026
              </div>
              <h1 className="comm-home__title">
                Act Together,<br />
                <span className="comm-home__accent">Save Together</span>
              </h1>
              <p className="comm-home__subtitle">
                Organise and join marine cleanup events, habitat restoration drives,
                and ocean awareness campaigns — right from your community.
              </p>
            </div>

            <div className="comm-home__cards">
              <motion.div
                className="comm-action-card comm-action-card--join"
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('join')}
              >
                <div className="comm-action-card__icon">🌊</div>
                <div className="comm-action-card__body">
                  <h3>Join Event</h3>
                  <p>Browse upcoming cleanups, restoration drives, and awareness campaigns near you.</p>
                  <span className="comm-action-card__count">{events.length} active events</span>
                </div>
                <TbChevronRight size={22} className="comm-action-card__arrow" />
              </motion.div>

              <motion.div
                className="comm-action-card comm-action-card--create"
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView('create')}
              >
                <div className="comm-action-card__icon">📋</div>
                <div className="comm-action-card__body">
                  <h3>Create Event</h3>
                  <p>Organise a local ocean conservation event and rally volunteers from your community.</p>
                  <span className="comm-action-card__count">Takes under 2 minutes</span>
                </div>
                <TbChevronRight size={22} className="comm-action-card__arrow" />
              </motion.div>
            </div>

          </motion.div>
        )}

        {/* ── Join ───────────────────────────────────── */}
        {view === 'join' && (
          <JoinView
            key="join"
            events={events}
            onJoin={(id) => setEvents(prev => prev.map(e => e.id === id ? { ...e, spots: e.spots - 1 } : e))}
            onDelete={handleDelete}
            onBack={() => setView('home')}
          />
        )}

        {/* ── Create ─────────────────────────────────── */}
        {view === 'create' && (
          <CreateView
            key="create"
            onBack={() => setView('home')}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
