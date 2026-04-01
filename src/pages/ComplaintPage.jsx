import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TbArrowLeft, TbPlus, TbPhoto, TbSend,
  TbCurrentLocation, TbChevronRight, TbMapPin, TbAlertTriangle, TbCheck, TbMail
} from 'react-icons/tb';
import './ComplaintPage.css';

/* ── MOCK HISTORY ────────────────────────────────────── */
const MOCK_HISTORY = [
  {
    id: 1,
    type: 'Oil Leak',
    status: 'In Review',
    date: '2026-03-30',
    location: '12°58′N 77°35′E (Indian Ocean)',
    desc: 'REPORT: Suspected mid-ocean oil leak.\n\nDescription: Large oil slick spotted moving East. Estimated radius: 2km.\n\nSeverity: HIGH\nImmediate drone survey requested.',
    img: 'https://images.unsplash.com/photo-1616782559714-fae3ca6b1585?w=400&q=80',
  },
  {
    id: 2,
    type: 'Heavy Plastic',
    status: 'Resolved',
    date: '2026-03-25',
    location: 'Great Pacific Garbage Patch, Sec-4',
    desc: 'REPORT: Heavy plastic accumulation.\n\nDescription: Dense patch of microplastics, bottles, and discarded styrofoam. Spread over 500 sq meters.\n\nRequires trawler cleanup.',
    img: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=400&q=80',
  }
];

/* ── EMAIL TEMPLATES ─────────────────────────────────── */
const EMAIL_TEMPLATES = {
  '': '',
  'oil_leak': 'Subject: URGENT: Suspected Mid-Ocean Oil Leak\n\nCoordinates: [Location]\n\nDescription: \n[Describe the slick, colour, and estimated size]\n\nSeverity: HIGH\nPlease dispatch environmental survey drones immediately.',
  'heavy_plastic': 'Subject: REPORT: Heavy Plastic Accumulation\n\nCoordinates: [Location]\n\nDescription: \n[Describe the density and type of plastics visible]\n\nRequires coordinated trawler cleanup operations.',
  'ghost_net': 'Subject: ALERT: Ghost Net Entanglement\n\nCoordinates: [Location]\n\nDescription: \n[Describe the net size and if any marine life is currently trapped]\n\nRescue divers / specialized cutters required.',
  'illegal_dumping': 'Subject: VIOLATION: Illegal Vessel Dumping\n\nCoordinates: [Location]\n\nDescription: \n[Provide vessel details if visible, and nature of dumped material]\n\nRequesting immediate satellite trajectory tracking.'
};

export default function ComplaintPage() {
  const navigate = useNavigate();

  // 'list' | 'detail' | 'new'
  const [view, setView] = useState('list');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // New form state
  const [reportType, setReportType] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState(MOCK_HISTORY);

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setReportType(type);
    let template = EMAIL_TEMPLATES[type] || '';
    if (location) template = template.replace('[Location]', location);
    setDesc(template);
  };

  const handleFetchLocation = () => {
    // Simulate GPS fetch
    const mockGps = "34°01′N 118°29′W (Mid-Ocean)";
    setLocation(mockGps);
    if (desc) {
      setDesc(desc.replace('[Location]', mockGps));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc.trim() || !location.trim()) return;

    setSubmitted(true);
    setTimeout(() => {
      // Add to history and reset
      const newEntry = {
        id: Date.now(),
        type: reportType ? reportType.replace('_', ' ').toUpperCase() : 'GENERAL',
        status: 'Triggered',
        date: new Date().toISOString().split('T')[0],
        location,
        desc,
        img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80' // generic placeholder
      };
      setHistory([newEntry, ...history]);
      setSubmitted(false);
      setView('list');
      setReportType('');
      setLocation('');
      setDesc('');
    }, 1500);
  };

  const openDetail = (item) => {
    setSelectedComplaint(item);
    setView('detail');
  };

  return (
    <div className="cmp-page">
      {/* ── HEADER ── */}
      <div className="cmp-header">
        <button className="cmp-header__btn" onClick={() => {
          if (view === 'new' || view === 'detail') setView('list');
          else navigate(-1);
        }}>
          <TbArrowLeft size={20} />
        </button>
        <div className="cmp-header__title">
          {view === 'list' && 'Ocean Watch Reports'}
          {view === 'new' && 'New SOS Report'}
          {view === 'detail' && 'Report Details'}
        </div>
        {view === 'list' ? (
          <button className="cmp-header__btn cmp-header__btn--primary" onClick={() => setView('new')}>
            <TbPlus size={20} />
          </button>
        ) : (
          <div className="cmp-header__spacer" />
        )}
      </div>

      <div className="cmp-body">
        <AnimatePresence mode="wait">
          
          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <motion.div
              key="list"
              className="cmp-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <p className="cmp-subtitle">Your active mid-ocean distress reports and pollution logs.</p>
              
              {history.map(item => (
                <div key={item.id} className="cmp-card" onClick={() => openDetail(item)}>
                  <div className="cmp-card__icon">
                    {item.type.toLowerCase().includes('oil') ? <TbAlertTriangle size={24} /> : <TbMapPin size={24} />}
                  </div>
                  <div className="cmp-card__info">
                    <h3 className="cmp-card__type">{item.type}</h3>
                    <p className="cmp-card__loc">{item.location.substring(0, 25)}...</p>
                    <div className="cmp-card__meta">
                      <span className={`cmp-badge ${item.status === 'Resolved' ? 'cmp-badge--green' : ''}`}>
                        {item.status}
                      </span>
                      <span className="cmp-date">{item.date}</span>
                    </div>
                  </div>
                  <TbChevronRight size={20} className="cmp-card__arrow" />
                </div>
              ))}
            </motion.div>
          )}

          {/* ── DETAIL VIEW ── */}
          {view === 'detail' && selectedComplaint && (
            <motion.div
              key="detail"
              className="cmp-detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="cmp-detail__img-wrap">
                <img src={selectedComplaint.img} alt="Evidence" className="cmp-detail__img" />
                <div className="cmp-detail__status">
                  <span className={`cmp-badge ${selectedComplaint.status === 'Resolved' ? 'cmp-badge--green' : ''}`}>
                    {selectedComplaint.status}
                  </span>
                </div>
              </div>
              
              <div className="cmp-detail__content">
                <h2 className="cmp-detail__title">{selectedComplaint.type}</h2>
                
                <div className="cmp-detail__row">
                  <TbMapPin size={18} className="cmp-detail__row-icon" />
                  <span>{selectedComplaint.location}</span>
                </div>
                
                <div className="cmp-detail__row">
                  <TbAlertTriangle size={18} className="cmp-detail__row-icon" />
                  <span>Reported on {selectedComplaint.date}</span>
                </div>

                <div className="cmp-detail__desc-box">
                  <div className="cmp-detail__desc-title">
                    <TbMail size={16} /> Dispatched Authority Mail
                  </div>
                  <div className="cmp-detail__desc-text">
                    {selectedComplaint.desc}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── NEW COMPLAINT VIEW ── */}
          {view === 'new' && (
            <motion.div
              key="new"
              className="cmp-new"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {submitted ? (
                <div className="cmp-success">
                  <div className="cmp-success__icon"><TbCheck size={40} /></div>
                  <h3>SOS Transmitted</h3>
                  <p>Regional maritime authorities have received your mail structure.</p>
                </div>
              ) : (
                <form className="cmp-form" onSubmit={handleSubmit}>
                  <p className="cmp-subtitle">Draft an official mid-ocean incident report for authorities.</p>
                  
                  <div className="cmp-photo-upload">
                    <TbPhoto size={28} />
                    <span>Upload Satellite/Drone Evidence</span>
                  </div>

                  <div className="cmp-form-group">
                    <label>Incident Type</label>
                    <select value={reportType} onChange={handleTypeChange} required>
                      <option value="" disabled>Select global ocean issue...</option>
                      <option value="oil_leak">Liquid / Oil Leak</option>
                      <option value="heavy_plastic">Heavy Plastic Patch</option>
                      <option value="ghost_net">Ghost / Abandoned Net</option>
                      <option value="illegal_dumping">Illegal Vessel Dumping</option>
                    </select>
                  </div>

                  <div className="cmp-form-group">
                    <label>Coordinates / Location</label>
                    <div className="cmp-loc-row">
                      <input 
                        type="text" 
                        placeholder="e.g. 15°N 65°E" 
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        required
                      />
                      <button type="button" className="cmp-loc-btn" onClick={handleFetchLocation}>
                        <TbCurrentLocation size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="cmp-form-group">
                    <label>Drafted Mail Body</label>
                    <textarea 
                      rows={8}
                      className="cmp-mail-area"
                      placeholder="Select a type to auto-fill authority mail structure..."
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="cmp-submit-btn" disabled={!reportType || !location || !desc}>
                    <TbSend size={18} /> Transmit Report Mail
                  </button>
                </form>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
