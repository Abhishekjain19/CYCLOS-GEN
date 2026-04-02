import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TbArrowLeft, TbPlus, TbPhoto, TbSend,
  TbCurrentLocation, TbChevronRight, TbMapPin, TbAlertTriangle, TbCheck, TbMail, TbWand, TbLoader2
} from 'react-icons/tb';
import { generateSOSEmailBody } from '../services/nvidiaNim';
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

  const [reportType, setReportType] = useState('');
  const [location, setLocation] = useState('');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState(MOCK_HISTORY);
  
  // File upload states
  const [file, setFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // When type changes, we just reset the AI form and let user click 'Generate AI Draft'
  const handleTypeChange = (e) => {
    const type = e.target.value;
    setReportType(type);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setImgPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const generateAIDraft = async () => {
    if (!reportType || !location) {
      alert("Please select Incident Type and Coordinates first.");
      return;
    }
    setAiLoading(true);
    try {
      const typeLabel = reportType.replace('_', ' ').toUpperCase();
      const generated = await generateSOSEmailBody(typeLabel, location, desc);
      setDesc(generated);
    } catch (err) {
      alert("Failed to generate AI draft: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFetchLocation = () => {
    // Simulate GPS fetch
    const mockGps = "34°01′N 118°29′W (Mid-Ocean)";
    setLocation(mockGps);
    if (desc) {
      setDesc(desc.replace('[Location]', mockGps));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim() || !location.trim()) return;

    setIsSending(true);

    try {
      // Create FormData to send via FormSubmit.co
      const formData = new FormData();
      formData.append('_subject', `SOS Alert: ${reportType.replace('_', ' ').toUpperCase()} at ${location}`);
      formData.append('Incident Type', reportType.replace('_', ' ').toUpperCase());
      formData.append('Coordinates', location);
      formData.append('Official Report', desc);
      
      // Stop captcha explicitly for smooth UX
      formData.append('_captcha', 'false');

      if (file) {
        formData.append('attachment', file);
      }

      await fetch("https://formsubmit.co/ajax/varunsugandhi0@gmail.com", {
          method: "POST",
          headers: { 
              'Accept': 'application/json'
          },
          body: formData
      });

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
          img: imgPreview || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80'
        };
        setHistory([newEntry, ...history]);
        setSubmitted(false);
        setView('list');
        setReportType('');
        setLocation('');
        setDesc('');
        setFile(null);
        setImgPreview(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      alert("Failed to transmit SOS. Make sure you are online.");
    } finally {
      setIsSending(false);
    }
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
                  
                  <label className="cmp-photo-upload" style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                    <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                    {imgPreview ? (
                      <img src={imgPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    ) : (
                      <>
                        <TbPhoto size={28} />
                        <span>Upload Satellite/Drone Evidence</span>
                      </>
                    )}
                  </label>

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
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Drafted Mail Body</span>
                      <button 
                        type="button" 
                        onClick={generateAIDraft}
                        disabled={aiLoading}
                        style={{ background: 'var(--teal-300)', color: 'var(--teal-950)', border: 'none', borderRadius: '50px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        {aiLoading ? <TbLoader2 className="cmp-loading-spin" size={14} /> : <TbWand size={14} />} Auto-Draft AI
                      </button>
                    </label>
                    <textarea 
                      rows={8}
                      className="cmp-mail-area"
                      placeholder="Click Auto-Draft AI to generate a highly professional structural mail..."
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="cmp-submit-btn" disabled={!reportType || !location || !desc || isSending || aiLoading}>
                    {isSending ? <TbLoader2 className="cmp-loading-spin" size={18} /> : <TbSend size={18} />} Transmit Report Mail
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
