import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TbArrowLeft, TbCloudUpload, TbTrash, TbCheck, TbChevronRight, 
  TbDroplet, TbRecycle, TbArrowLoopRight, TbBarrel, TbBiohazard, 
  TbFish, TbRipple, TbShip, TbRadar, TbPencil, TbCurrentLocation,
  TbShield, TbDownload, TbLoader2, TbCrosshair, TbAlertTriangle,
  TbX, TbExternalLink, TbCheckupList, TbMail, TbClock, TbMapPin, TbPlus
} from 'react-icons/tb';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import emailjs from 'emailjs-com';
import { getChatResponse } from '../services/nvidiaNim';
import './ComplaintPage.css';

// Fix for Leaflet default icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ── CONSTANTS & DATA ─────────────────────────────────────────────── */

const INCIDENT_TYPES = [
  { id: 'oil_spill', label: 'Oil Spill / Slick', icon: <TbDroplet />, desc: 'Major liquid hydrocarbon release detected.' },
  { id: 'plastic_mass', label: 'Plastic Mass / Debris Field', icon: <TbRecycle />, desc: 'Large surface accumulation of marine debris.' },
  { id: 'ghost_net', label: 'Ghost Net / ALDFG', icon: <TbArrowLoopRight />, desc: 'Abandoned, lost or discarded fishing gear.' },
  { id: 'illegal_dumping', label: 'Illegal Dumping', icon: <TbBarrel />, desc: 'Unauthorized discharge of industrial or hazardous waste.' },
  { id: 'chemical_discharge', label: 'Chemical Discharge', icon: <TbBiohazard />, desc: 'Release of hazardous non-oil liquid pollutants.' },
  { id: 'dead_marine_life', label: 'Dead Marine Life', icon: <TbFish />, desc: 'Suspicious mass mortality event of marine species.' },
  { id: 'coral_bleaching', label: 'Coral Bleaching Zone', icon: <TbRipple />, desc: 'Significant loss of photosynthetic pigments in reef.' },
  { id: 'vessel_distress', label: 'Vessel in Distress', icon: <TbShip />, desc: 'Active maritime emergency involving life or safety.' },
  { id: 'unauthorized_vessel', label: 'Unauthorized Vessel', icon: <TbRadar />, desc: 'Suspected IUU fishing or illegal intrusion.' },
  { id: 'other', label: 'Other / Custom', icon: <TbPencil />, desc: 'Unclassified environmental incident or event.' }
];

const PREWRITTEN_CONTENT = {
  oil_spill: {
    desc: "A significant hydrocarbon slick has been identified at the specified coordinates. The material appears to be spreading with surface currents, posing an immediate threat to local marine ecosystems and coastal stability.",
    actions: ["Deploy containment booms and absorbent pads.", "Notify regional Coast Guard Pollution Response sector.", "Initiate wildlife impact assessment and pre-emptive cleaning."]
  },
  plastic_mass: {
    desc: "A dense accumulation of macro and micro-plastics has formed a substantial debris field. Floating debris includes industrial waste, ghost gear, and consumer plastics, creating a hazard for marine life and navigation.",
    actions: ["Monitor drift trajectory using satellite telemetry.", "Alert regional waste collection vessels for interception.", "Assess navigation risk for small craft in the sector."]
  },
  ghost_net: {
    desc: "Submerged or floating abandoned fishing gear (ALDFG) has been detected. This gear is actively 'ghost fishing', potentially entangling marine megafauna and damaging benthic habitats.",
    actions: ["Dispatch authorized dive teams for controlled retrieval.", "Conduct multi-beam sonar scan for caught wildlife.", "Mark location on nautical charts for debris avoidance."]
  },
  illegal_dumping: {
    desc: "Evidence of unauthorized industrial or hazardous waste discharge from a vessel has been documented. The nature of the material suggests a breach of MARPOL Annex I/II regulations.",
    actions: ["Collect surface water samples for toxicology analysis.", "Identify and track source vessel using AIS and satellite logs.", "Assess potential chemical toxicity and plume dissipation."]
  },
  chemical_discharge: {
    desc: "A discharge of hazardous non-oil liquid pollutants has created a visible chemical plume. The plume characteristics suggest significant toxicity to microbial and macro-marine life.",
    actions: ["Enforce maritime exclusion zone for non-essential traffic.", "Notify regional Chemical Spill Response teams immediately.", "Initiate large-scale water quality and pH monitoring."]
  },
  dead_marine_life: {
    desc: "A suspicious mass mortality event involving multiple individuals or species has been observed. Preliminary assessment rules out natural predation, suggesting environmental or acoustic triggers.",
    actions: ["Retrieve biological specimens for necropsy and toxicology.", "Investigate local acoustic signatures and temperature spikes.", "Coordinate with marine biologists for population impact data."]
  },
  coral_bleaching: {
    desc: "Large-scale coral bleaching has been detected within a critical reef structure. The loss of zooxanthellae indicates localized thermal stress or significant water quality degradation.",
    actions: ["Deploy high-resolution temperature and light sensors.", "Implement temporary limit on local recreational and industrial activity.", "Initiate feasibility study for coral nursery and shading."]
  },
  vessel_distress: {
    desc: "A vessel has been identified in a state of distress, indicating a direct threat to the safety of the crew and the integrity of the ship. Situation requires immediate search and rescue coordination.",
    actions: ["Acknowledge vessel distress signal/Mayday on VHF 16.", "Relay coordinates to the nearest Maritime Rescue center (MRCC).", "Maintain visual contact or standby for rescue support."]
  },
  unauthorized_vessel: {
    desc: "Suspected illegal, unreported, and unregulated (IUU) fishing or unauthorized entry into a protected marine zone has been identified. Vessel is not broadcasting AIS or appears to be falsifying identity.",
    actions: ["Document hull ID, flag, and crew activity from distance.", "Report sighting to Naval/Coast Guard enforcement division.", "Maintain safe distance to avoid escalation while tracking."]
  }
};

const SEVERITIES = [
  { id: 'low', label: 'Low', color: '#6B7280' },
  { id: 'moderate', label: 'Moderate', color: '#F59E0B' },
  { id: 'high', label: 'High', color: '#EF4444' },
  { id: 'critical', label: 'Critical', color: '#991B1B' }
];

const MARITIME_AUTHORITIES = [
  { name: 'Indian Coast Guard - MRCC Mumbai', lat: 18.9, lng: 72.8, email: 'abhi1912005@gmail.com' },
  { name: 'US Coast Guard - District 11', lat: 33.7, lng: -118.2, email: 'abhi1912005@gmail.com' },
  { name: 'Australian Maritime Safety Authority', lat: -35.3, lng: 149.1, email: 'abhi1912005@gmail.com' },
  { name: 'UK Maritime & Coastguard Agency', lat: 50.9, lng: -1.4, email: 'abhi1912005@gmail.com' },
  { name: 'Hellenic Coast Guard (Greece)', lat: 37.9, lng: 23.6, email: 'abhi1912005@gmail.com' },
  { name: 'Singapore MPA MRCC', lat: 1.3, lng: 103.8, email: 'abhi1912005@gmail.com' },
  { name: 'Maritime Rescue South Africa', lat: -33.9, lng: 18.4, email: 'abhi1912005@gmail.com' }
];

/* ── HELPER COMPONENTS ─────────────────────────────────────────────── */

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 8);
  }, [center, map]);
  return null;
};

const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

/* ── MAIN PAGE ─────────────────────────────────────────────────────── */

export default function ComplaintPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('history'); // 'history', 'create', 'detail'
  const [selectedReport, setSelectedReport] = useState(null);
  const [step, setStep] = useState(1);
  const [caseId, setCaseId] = useState(() => Date.now().toString(36).toUpperCase().slice(-6));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // History State
  const [reportHistory, setReportHistory] = useState([
    {
      id: 'A1B2C3',
      type: 'Oil Spill / Slick',
      severity: 'high',
      status: 'DISPATCHED',
      date: '2026-03-30',
      coordinates: '12.5830°N 77.3512°E',
      desc: 'Large liquid hydrocarbon slick spotted moving East. Estimated radius: 2km. Plume is visually dark and rainbow sheen is visible along the containment perimeter.',
      media: [{ preview: 'https://images.unsplash.com/photo-1616782559714-fae3ca6b1585?w=600' }],
      actions: ["Deploy containment booms and absorbent pads.", "Notify regional Coast Guard Pollution Response sector."],
      timestamp: '2026-03-30 08:45:12 UTC',
      authority: 'Indian Coast Guard - MRCC Mumbai'
    },
    {
      id: 'D4E5F6',
      type: 'Plastic Mass',
      severity: 'moderate',
      status: 'RESOLVED',
      date: '2026-03-25',
      coordinates: '35.4210°N 142.1120°W',
      desc: 'Dense patch of microplastics and discarded nets. Spread over 500 sq meters. Heavy accumulation of ghost gear identified.',
      media: [{ preview: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=600' }],
      actions: ["Monitor drift trajectory using satellite telemetry.", "Alert regional waste collection vessels for interception."],
      timestamp: '2026-03-25 14:22:05 UTC',
      authority: 'US Coast Guard - District 11'
    }
  ]);

  // Form Data
  const [files, setFiles] = useState([]);
  const [incidentType, setIncidentType] = useState(null);
  const [customDescription, setCustomDescription] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [coordinates, setCoordinates] = useState('');
  const [mapCoords, setMapCoords] = useState(null); // [lat, lng]
  const [locationNotes, setLocationNotes] = useState('');
  const [reporterName, setReporterName] = useState('Anonymous Scientist');
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiDraftedText, setAiDraftedText] = useState('');

  // ── Step 1: Upload ──────
  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > 4) {
      alert("Maximum 4 files allowed.");
      return;
    }
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => [...prev, { file, preview: reader.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Step 3: Location ──────
  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const latRef = latitude >= 0 ? 'N' : 'S';
      const lonRef = longitude >= 0 ? 'E' : 'W';
      setCoordinates(`${Math.abs(latitude).toFixed(4)}°${latRef} ${Math.abs(longitude).toFixed(4)}°${lonRef}`);
      setMapCoords([latitude, longitude]);
    });
  };

  const handleManualCoords = (val) => {
    setCoordinates(val);
    const parts = val.match(/(-?\d+\.?\d*)/g);
    if (parts && parts.length >= 2) {
      setMapCoords([parseFloat(parts[0]), parseFloat(parts[1])]);
    }
  };

  const findNearestAuthority = () => {
    if (!mapCoords) return MARITIME_AUTHORITIES[0];
    let nearest = MARITIME_AUTHORITIES[0];
    let minDist = Infinity;
    MARITIME_AUTHORITIES.forEach(auth => {
      const d = Math.sqrt(Math.pow(auth.lat - mapCoords[0], 2) + Math.pow(auth.lng - mapCoords[1], 2));
      if (d < minDist) {
        minDist = d;
        nearest = auth;
      }
    });
    return nearest;
  };

  const nearestAuthority = findNearestAuthority();

  // ── Step 4: AI & Post ──────
  const handleAiDraft = async () => {
    if (!customDescription) return;
    setAiDrafting(true);
    setAiDraftedText("");
    try {
      const prompt = `You are a marine environmental incident reporting officer. Given the following user description of a mid-ocean incident: "${customDescription}", write a formal, professional incident report email body section in 4-5 sentences. Use official language suitable for government maritime authorities. Do not include greetings or sign-offs.`;
      const response = await getChatResponse([{ role: 'user', content: prompt }]);
      
      // Simulate streaming
      let i = 0;
      const interval = setInterval(() => {
        setAiDraftedText(prev => prev + response.charAt(i));
        i++;
        if (i >= response.length) clearInterval(interval);
      }, 20);
    } catch (err) {
      console.error(err);
    } finally {
      setAiDrafting(false);
    }
  };

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    
    try {
      // Use FormSubmit for actual mail delivery in this demo, pointing to user's requested email
      const formData = new FormData();
      formData.append('_subject', `[URGENT] SOS Report: ${incidentType?.label} - CASE #${caseId}`);
      formData.append('Case ID', caseId);
      formData.append('Type', incidentType?.label);
      formData.append('Coordinates', coordinates);
      formData.append('Severity', severity.toUpperCase());
      formData.append('Reporter', reporterName);
      formData.append('Summary', aiDraftedText || PREWRITTEN_CONTENT[incidentType?.id]?.desc);
      formData.append('_captcha', 'false');

      await fetch("https://formsubmit.co/ajax/abhi1912005@gmail.com", {
        method: "POST",
        body: formData
      });

      // Add to local history
      const newEntry = {
        id: caseId,
        type: incidentType?.label,
        severity,
        status: 'DISPATCHED',
        date: new Date().toISOString().split('T')[0],
        coordinates,
        desc: aiDraftedText || PREWRITTEN_CONTENT[incidentType?.id]?.desc,
        media: files,
        actions: emailData.actions,
        timestamp: timestamp,
        authority: nearestAuthority.name
      };
      setReportHistory(prev => [newEntry, ...prev]);

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Transmission failed. Retrying required.");
      setIsSubmitting(false);
    }
  };

  const generateReportBody = () => {
    const selectedData = PREWRITTEN_CONTENT[incidentType?.id] || { desc: aiDraftedText || customDescription, actions: ["Authorities will determine appropriate containment strategy."] };
    return {
      summary: selectedData.desc,
      actions: selectedData.actions
    };
  };

  const emailData = generateReportBody();
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';

  return (
    <div className="sos-report-page">
      <div className="sos-diagonal-texture"></div>
      <div className="sos-watermark">CLASSIFIED INTERNAL USE</div>

      {/* ── Progress Bar ── */}
      <div className="sos-progress-container sticky">
        <div className="sos-progress-bar">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className={`progress-step ${(view === 'create' && step >= idx) ? 'active' : ''}`}>
              <div className="step-circle">{ (view === 'create' && step > idx) ? <TbCheck /> : idx}</div>
              <span className="step-label">
                {idx === 1 && 'Evidence'}
                {idx === 2 && 'Classification'}
                {idx === 3 && 'Location'}
                {idx === 4 && 'Preview'}
              </span>
              {idx < 4 && <div className="step-line" />}
            </div>
          ))}
        </div>
      </div>

      <div className="sos-main-content">
        <AnimatePresence mode="wait">
          {view === 'history' ? (
            <motion.div 
              key="history"
              className="sos-history-portal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="portal-header">
                <div className="title-group">
                  <h2>MISSION LOG</h2>
                  <p>Archived and active mid-ocean environmental distress reports.</p>
                </div>
                <button className="initialize-btn" onClick={() => {
                  setView('create');
                  setStep(1);
                  setIsSuccess(false);
                  setCaseId(Date.now().toString(36).toUpperCase().slice(-6));
                }}>
                  <TbPlus /> INITIALIZE NEW MISSION
                </button>
              </div>

              <div className="history-list">
                {reportHistory.map(entry => (
                  <div key={entry.id} className="history-card" onClick={() => {
                    setSelectedReport(entry);
                    setView('detail');
                  }}>
                    <div className={`card-side-accent ${entry.severity}`} />
                    <div className="card-main">
                      <div className="card-top">
                        <span className="card-case">CASE #{entry.id}</span>
                        <span className={`card-status ${entry.status.toLowerCase()}`}>{entry.status}</span>
                      </div>
                      <h3 className="card-type">{entry.type}</h3>
                      <div className="card-loc">
                        <TbMapPin /> {entry.coordinates}
                      </div>
                      <p className="card-desc">{entry.desc.substring(0, 100)}...</p>
                      <div className="card-footer">
                        <span className="card-date">{entry.date}</span>
                        <button className="view-detail-btn">VIEW TELEMETRY <TbChevronRight /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {reportHistory.length === 0 && (
                <div className="empty-history">
                  <div className="radar-ping"></div>
                  <p>No active missions found in current sector.</p>
                </div>
              )}
            </motion.div>
          ) : view === 'detail' && selectedReport ? (
            <motion.div 
              key="detail"
              className="sos-step-panel mission-detail-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="panel-header">
                <button className="sos-back-btn" onClick={() => setView('history')}>
                  <TbArrowLeft /> Return to Mission Log
                </button>
                <div className="panel-meta">
                  <span className="case-badge">CASE ID: {selectedReport.id}</span>
                  <span className="time-badge"><TbClock /> {selectedReport.timestamp}</span>
                </div>
              </div>

              <div className="detail-layout">
                <div className="detail-main">
                  <h2 className="detail-title">{selectedReport.type}</h2>
                  <div className={`severity-indicator ${selectedReport.severity}`}>
                    {selectedReport.severity.toUpperCase()} PRIORITY
                  </div>

                  <div className="detail-section">
                    <h4 className="sub-label">MEDIA EVIDENCE</h4>
                    <div className="detail-gallery">
                      {selectedReport.media && selectedReport.media.length > 0 ? (
                        selectedReport.media.map((m, idx) => (
                          <div key={idx} className="gallery-item">
                            <img src={m.preview} alt="Evidence" />
                            <button className="expand-overlay"><TbExternalLink/></button>
                          </div>
                        ))
                      ) : (
                        <div className="no-media-box">No Visual Evidence Attached</div>
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4 className="sub-label">MISSION DISPATCH RENDER</h4>
                    <div className="email-render-card static">
                      <div className="email-body-scroll">
                        <div className="report-header">
                          <div className="brand">CYCLOS OCEAN WATCH</div>
                          <div className="title">ARCHIVED INCIDENT REPORT</div>
                        </div>
                        <div className="report-section">
                           <p className="professional-desc">{selectedReport.desc}</p>
                        </div>
                        <div className="report-section">
                          <h4 className="section-label">RECOMMENDED ACTIONS</h4>
                          <ul className="action-list">
                            {selectedReport.actions.map((act, i) => <li key={i}>{act}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-sidebar">
                  <div className="telemetry-card">
                    <h4 className="sub-label">COORDINATE TELEMETRY</h4>
                    <div className="telemetry-box mono">{selectedReport.coordinates}</div>
                  </div>

                  <div className="auth-lookup-card static">
                    <div className="auth-icon"><TbShield /></div>
                    <div className="auth-info">
                      <span className="auth-label">DISPATCHED TO</span>
                      <span className="auth-name">{selectedReport.authority}</span>
                    </div>
                  </div>

                  <button className="print-report-btn" onClick={() => window.print()}>
                    <TbDownload/> ARCHIVE TO PDF
                  </button>

                  <div className="mission-status-track">
                    <h4 className="sub-label">MISSION TIMELINE</h4>
                    <div className="timeline-event">
                      <div className="t-dot active"></div>
                      <div className="t-info">
                        <span className="t-label">REPORT DISPATCHED</span>
                        <span className="t-time">{selectedReport.timestamp}</span>
                      </div>
                    </div>
                    <div className="timeline-event">
                      <div className={`t-dot ${selectedReport.status === 'RESOLVED' ? 'active' : ''}`}></div>
                      <div className="t-info">
                        <span className="t-label">MISSION {selectedReport.status}</span>
                        <span className="t-time">{selectedReport.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !isSuccess ? (
            <motion.div 
              key={step}
              className="sos-step-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="panel-header">
                <button className="sos-back-btn" onClick={() => {
                  if (step > 1) setStep(step - 1);
                  else setView('history');
                }}>
                  <TbArrowLeft /> {step === 1 ? 'Back to Log' : 'Previous Step'}
                </button>
                <div className="panel-meta">
                  <span className="case-badge">CASE ID: {caseId}</span>
                  <span className="time-badge"><TbClock /> {timestamp}</span>
                </div>
              </div>

              {/* ── STEP 1: EVIDENCE ── */}
              {step === 1 && (
                <div className="step-content">
                  <h2 className="step-title">Satellite / Drone / Photographic Evidence</h2>
                  <p className="step-subtitle">Provide visual verification of the mid-ocean environmental incident.</p>
                  
                  <label className="sos-dropzone">
                    <input type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} hidden />
                    <TbCloudUpload className="upload-icon" />
                    <div className="upload-text">
                      <strong>Click or Drag to Upload</strong>
                      <span>Accepted: JPG, PNG, MP4, MOV (Max 20MB per file)</span>
                    </div>
                  </label>

                  {files.length > 0 && (
                    <div className="thumbnail-grid">
                      {files.map((f, i) => (
                        <div key={i} className="thumb-item">
                          {f.file.type.startsWith('image') ? (
                            <img src={f.preview} alt="Evidence" />
                          ) : (
                            <div className="video-thumb"><TbShip /></div>
                          )}
                          <button className="remove-thumb" onClick={() => removeFile(i)}><TbX /></button>
                          <div className="thumb-label">{f.name.substring(0, 10)}...</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {files.length === 0 && (
                    <div className="warning-banner">
                      <TbAlertTriangle /> Proceeding without visual evidence will mark this report as "UNVERIFIED".
                    </div>
                  ) }
                </div>
              )}

              {/* ── STEP 2: CLASSIFICATION ── */}
              {step === 2 && (
                <div className="step-content">
                  <h2 className="step-title">Incident Classification</h2>
                  <p className="step-subtitle">Categorize the nature of the environmental threat for specialized dispatch.</p>
                  
                  <div className="incident-grid">
                    {INCIDENT_TYPES.map(type => (
                      <div 
                        key={type.id} 
                        className={`type-card ${incidentType?.id === type.id ? 'selected' : ''}`}
                        onClick={() => setIncidentType(type)}
                      >
                        <div className="type-icon">{type.icon} {incidentType?.id === type.id && <TbCheck className="check-badge" />}</div>
                        <div className="type-info">
                          <span className="type-label">{type.label}</span>
                          <span className="type-desc">{type.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {incidentType?.id === 'other' && (
                    <div className="custom-input-wrap">
                      <label>Describe the Incident (Specialized AI Draft Trigger)</label>
                      <textarea 
                        placeholder="Provide deep-sea environmental observations..."
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="severity-wrap">
                    <label>Incident Severity Level</label>
                    <div className="severity-pills">
                      {SEVERITIES.map(s => (
                        <button 
                          key={s.id} 
                          className={`severity-pill ${severity === s.id ? 'active' : ''}`}
                          style={{ '--accent': s.color }}
                          onClick={() => setSeverity(s.id)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: LOCATION ── */}
              {step === 3 && (
                <div className="step-content">
                  <h2 className="step-title">Mission Location</h2>
                  <p className="step-subtitle">Identify the precise maritime coordinates for emergency response.</p>
                  
                  <div className="location-row">
                    <div className="input-with-button">
                      <label>Maritime Coordinates (WGS84)</label>
                      <div className="coord-input-group">
                        <input 
                          type="text" 
                          className="mono-font"
                          placeholder="e.g. 15.2340°N 65.8921°E" 
                          value={coordinates}
                          onChange={(e) => handleManualCoords(e.target.value)}
                        />
                        <button className="gps-btn" onClick={fetchLocation}>
                          <TbCrosshair /> Fetch Live GPS
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="map-frame-small">
                    <MapContainer 
                      center={mapCoords || [20, 0]} 
                      zoom={mapCoords ? 8 : 2} 
                      className="leaflet-mini"
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      {mapCoords && <Marker position={mapCoords} />}
                      <MapUpdater center={mapCoords} />
                      <LocationPicker onLocationSelect={(ll) => {
                        setMapCoords([ll.lat, ll.lng]);
                        setCoordinates(`${Math.abs(ll.lat).toFixed(4)}°${ll.lat >= 0 ? 'N' : 'S'} ${Math.abs(ll.lng).toFixed(4)}°${ll.lng >= 0 ? 'E' : 'W'}`);
                      }} />
                    </MapContainer>
                    <div className="map-overlay-info">
                      <TbMapPin /> CLICK MAP OR MOVE PIN TO REFINE
                    </div>
                  </div>

                  <div className="auth-lookup-card">
                    <div className="auth-icon"><TbShield /></div>
                    <div className="auth-info">
                      <span className="auth-label">NEAREST MARITIME AUTHORITY</span>
                      <span className="auth-name">{nearestAuthority.name}</span>
                      <span className="auth-email">{nearestAuthority.email}</span>
                    </div>
                  </div>

                  <div className="custom-input-wrap">
                    <label>Additional Location Notes</label>
                    <textarea 
                      placeholder="e.g. 2km north of shipping lane marker 7, or near sea-mount summit"
                      value={locationNotes}
                      onChange={(e) => setLocationNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 4: PREVIEW ── */}
              {step === 4 && (
                <div className="step-content preview-flow">
                  <div className="preview-layout">
                    <div className="email-render-card">
                      <div className="email-header">
                        <div className="subject-line">
                          [URGENT] Ocean Incident Report - {incidentType?.label.toUpperCase()} - {coordinates} - Case #{caseId}
                        </div>
                      </div>
                      <div className="email-body-scroll">
                        <div className="report-header">
                          <div className="brand">CYCLOS OCEAN WATCH</div>
                          <div className="title">OFFICIAL INCIDENT REPORT</div>
                          <div className="meta">CID: {caseId} | {timestamp}</div>
                        </div>

                        <div className="report-section">
                          <h4 className="section-label">SECTION I: INCIDENT SUMMARY</h4>
                          <div className="data-row"><span className="L">Type:</span> <span className="V">{incidentType?.label}</span></div>
                          <div className="data-row"><span className="L">Severity:</span> <span className="V" style={{ color: SEVERITIES.find(s=>s.id===severity)?.color }}>{severity.toUpperCase()}</span></div>
                        </div>

                        <div className="report-section">
                          <h4 className="section-label">SECTION II: LOCATION DATA</h4>
                          <div className="data-row"><span className="L">Coordinates:</span> <span className="V mono">{coordinates || 'NOT SET'}</span></div>
                          <div className="data-row"><span className="L">Target Authority:</span> <span className="V">{nearestAuthority.name}</span></div>
                          {locationNotes && <div className="data-row"><span className="L">Notes:</span> <span className="V">{locationNotes}</span></div>}
                        </div>

                        <div className="report-section">
                          <h4 className="section-label">SECTION III: INCIDENT DESCRIPTION</h4>
                          <div className="professional-desc">
                            {incidentType?.id === 'other' ? (
                              <div className="ai-draft-zone">
                                {aiDraftedText || "No AI draft generated yet."}
                                {!aiDraftedText && !aiDrafting && (
                                  <button className="ai-trigger-btn" onClick={handleAiDraft}>
                                    <TbMail /> Initialize AI Official Draft
                                  </button>
                                )}
                                {aiDrafting && <div className="ai-typing">Synthesizing professional report...</div>}
                              </div>
                            ) : emailData.summary}
                          </div>
                        </div>

                        <div className="report-section">
                          <h4 className="section-label">SECTION IV: RECOMMENDED ACTIONS</h4>
                          <ul className="action-list">
                            {emailData.actions.map((act, i) => <li key={i}>{act}</li>)}
                          </ul>
                        </div>

                        <div className="report-footer">
                          This report was generated via Cyclos Ocean Intelligence System.
                          Internal Routing: Maritime Environmental Enforcement Taskforce.
                        </div>
                      </div>
                    </div>

                    <div className="preview-checklist">
                      <h4 className="checklist-title">REPORT VALIDATION</h4>
                      <div className="check-item verified">
                        <div className="check-icon">{files.length > 0 ? <TbCheck /> : <TbAlertTriangle />}</div>
                        <div className="check-text">Visual Evidence {files.length > 0 ? 'Verified' : 'Missing'}</div>
                        <span className="count">{files.length} attached</span>
                      </div>
                      <div className={`check-item ${incidentType ? 'verified' : ''}`}>
                        <div className="check-icon"><TbCheck /></div>
                        <div className="check-text">Classification {incidentType ? 'Locked' : 'Incomplete'}</div>
                      </div>
                      <div className={`check-item ${coordinates ? 'verified' : ''}`}>
                        <div className="check-icon"><TbCheck /></div>
                        <div className="check-text">Location Geotagged</div>
                      </div>
                      <div className="check-item verified">
                        <div className="check-icon"><TbShield /></div>
                        <div className="check-text">Encrypted Transmission Ready</div>
                      </div>

                      <div className="reporter-auth">
                        <label>AUTHORIZED REPORTER NAME (OPTIONAL)</label>
                        <input 
                          type="text" 
                          value={reporterName} 
                          onChange={(e) => setReporterName(e.target.value)} 
                          placeholder="Report as Anonymous by default"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="panel-footer">
                {step < 4 ? (
                  <button className="sos-continue-btn" onClick={() => setStep(step + 1)}>
                    CONTINUE MISSION <TbChevronRight />
                  </button>
                ) : (
                  <button className="sos-submit-btn" onClick={handleSubmitReport} disabled={isSubmitting}>
                    {isSubmitting ? <><TbLoader2 className="spinning" /> TRANSMITTING...</> : <><TbShield /> SUBMIT REPORT TO AUTHORITIES</>}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="sos-success-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="success-glow"></div>
              <div className="success-icon-wrap"><TbCheck /></div>
              <h2>REPORT TRANSMITTED</h2>
              <div className="case-id-display">CASE ID: {caseId}</div>
              <p>Your report has been successfully dispatched to {nearestAuthority.name} and archived in the global registry.</p>
              
              {/* HIDDEN PRINT TEMPLATE FOR PDF GENERATION */}
              <div className="sos-print-template">
                <div className="print-header">
                  <div className="print-brand">CYCLOS OCEAN WATCH</div>
                  <div className="print-report-id">OFFICIAL MISSION DISPATCH: #{caseId}</div>
                  <div className="print-meta">{timestamp}</div>
                </div>

                <div className="print-body">
                   <div className="print-section">
                      <h3 className="print-section-title">I. INCIDENT SUMMARY</h3>
                      <div className="print-data"><span className="label">TYPE:</span> {incidentType?.label}</div>
                      <div className="print-data"><span className="label">SEVERITY:</span> {severity.toUpperCase()}</div>
                      <div className="print-data"><span className="label">REPORTER:</span> {reporterName}</div>
                   </div>

                   <div className="print-section">
                      <h3 className="print-section-title">II. COORDINATE TELEMETRY</h3>
                      <div className="print-data"><span className="label">LOC:</span> {coordinates}</div>
                      <div className="print-data"><span className="label">AUTHORITY:</span> {nearestAuthority.name}</div>
                   </div>

                   <div className="print-section">
                      <h3 className="print-section-title">III. OFFICIAL DISPATCH CONTENT</h3>
                      <p className="print-desc">{aiDraftedText || PREWRITTEN_CONTENT[incidentType?.id]?.desc}</p>
                   </div>

                   <div className="print-section">
                      <h3 className="print-section-title">IV. RECOMMENDED ACTION PLAN</h3>
                      <ul className="print-actions">
                        {(PREWRITTEN_CONTENT[incidentType?.id]?.actions || ["Immediate containment required"]).map((a,i)=>(
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                   </div>

                   <div className="print-section">
                      <h3 className="print-section-title">V. ATTACHED MEDIA EVIDENCE</h3>
                      <div className="print-media-grid">
                        {files.map((file, i) => (
                          <div key={i} className="print-media-item">
                            <img src={file.preview} alt="Evidence" />
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="print-footer">
                   Generated via Cyclos Intelligence System. This document is a certified copy of the original dispatch.
                </div>
              </div>

              <div className="success-actions">
                <button className="download-pdf-btn" onClick={() => window.print()}>
                  <TbDownload /> DOWNLOAD REPORT PDF
                </button>
                <button className="start-new-btn" onClick={() => { setView('history'); setIsSuccess(false); setFiles([]); setIncidentType(null); setCoordinates(''); }}>
                  RETURN TO MISSION LOG
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
