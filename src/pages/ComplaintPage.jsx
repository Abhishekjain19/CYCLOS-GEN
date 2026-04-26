import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TbArrowLeft, TbCloudUpload, TbTrash, TbCheck, TbChevronRight, 
  TbDroplet, TbRecycle, TbArrowLoopRight, TbBarrel, TbBiohazard, 
  TbFish, TbRipple, TbShip, TbRadar, TbPencil, TbCurrentLocation,
  TbShield, TbDownload, TbLoader2, TbCrosshair, TbAlertTriangle,
  TbX, TbExternalLink, TbCheckupList, TbMail, TbClock, TbMapPin, TbPlus,
  TbCamera, TbAlertCircle, TbSwitchHorizontal, TbVideo, TbFocusCentered
} from 'react-icons/tb';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import emailjs from 'emailjs-com';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getChatResponse } from '../services/nvidiaNim';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../context/AuthContext';
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
  { id: 'illegal_dumping', label: 'Illegal Dumping', icon: <TbBarrel />, desc: 'Unauthorized disposal of mixed waste in open plots.' },
  { id: 'garbage_burning', label: 'Garbage Burning', icon: <TbRipple />, desc: 'Open burning of dry waste or plastics.' },
  { id: 'overflowing_bins', label: 'Overflowing Bins', icon: <TbTrash />, desc: 'Public SWM bins that have not been cleared.' },
  { id: 'ewaste_dumping', label: 'E-Waste Dumping', icon: <TbBiohazard />, desc: 'Improper disposal of electronics or batteries.' },
  { id: 'drain_clogging', label: 'Drain Clogging', icon: <TbDroplet />, desc: 'Stormwater drain blocked by solid waste.' },
  { id: 'other', label: 'Other / Custom', icon: <TbPencil />, desc: 'Unclassified civic waste incident.' }
];

const PREWRITTEN_CONTENT = {
  illegal_dumping: {
    desc: "Unauthorized dumping of mixed solid waste has been identified at the specified coordinates. The waste volume suggests regular illegal disposal, posing health risks and violating SWM rules.",
    actions: ["Dispatch local ward marshals to inspect site.", "Clear the dump via BBMP compactors.", "Identify potential violators and penalize."]
  },
  garbage_burning: {
    desc: "Open burning of garbage, likely including plastics, has been observed. This releases toxic fumes, degrading local air quality and violating KSPCB guidelines.",
    actions: ["Immediately extinguish the fire.", "Inspect waste composition to identify source.", "Issue warnings to nearby commercial/residential setups."]
  },
  overflowing_bins: {
    desc: "Designated public SWM bins are overflowing, leading to littering on the adjacent streets. The collection cycle appears to have been missed.",
    actions: ["Schedule immediate pickup by BBMP auto-tippers.", "Assess need for additional bins or frequency in this ward.", "Sanitize the surrounding area."]
  },
  ewaste_dumping: {
    desc: "Improper disposal of hazardous e-waste or batteries has been detected in a generic waste pile. This poses a severe risk of heavy metal leaching into the soil and groundwater.",
    actions: ["Deploy specialized e-waste handlers to collect hazardous materials.", "Transport to KSPCB-authorized e-waste recycling facility.", "Inspect soil for immediate contamination."]
  },
  drain_clogging: {
    desc: "A critical stormwater drain is heavily clogged with solid waste, primarily plastics and debris. This poses an immediate flooding risk during the next rain cycle.",
    actions: ["Deploy desilting machinery to clear the blockage.", "Transport extracted silt and solid waste to designated landfills.", "Install mesh to prevent further ingress of macro-plastics."]
  }
};

const SEVERITIES = [
  { id: 'low', label: 'Low', color: '#6B7280' },
  { id: 'moderate', label: 'Moderate', color: '#F59E0B' },
  { id: 'high', label: 'High', color: '#EF4444' },
  { id: 'critical', label: 'Critical', color: '#991B1B' }
];

const CIVIC_AUTHORITIES = [
  { name: 'BBMP SWM Cell (Central)', lat: 12.9716, lng: 77.5946, email: 'abhi1912005@gmail.com' },
  { name: 'KSPCB Regional Office', lat: 12.9724, lng: 77.5806, email: 'abhi1912005@gmail.com' },
  { name: 'BBMP South Zone', lat: 12.9250, lng: 77.5938, email: 'abhi1912005@gmail.com' },
  { name: 'BBMP East Zone', lat: 12.9716, lng: 77.6411, email: 'abhi1912005@gmail.com' }
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
  const { user } = useAuth();
  const [view, setView] = useState('history'); // 'history', 'create', 'detail'
  const [selectedReport, setSelectedReport] = useState(null);
  const [step, setStep] = useState(1);
  const [caseId, setCaseId] = useState(() => Date.now().toString(36).toUpperCase().slice(-6));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // holds the entry to delete
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs
  const printTemplateRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'
  const [captureLocation, setCaptureLocation] = useState('');

  // History State
  const [reportHistory, setReportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  // Fetch user's incident reports from DB
  useEffect(() => {
    if (!user) {
      setReportHistory([]);
      setHistoryLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('incident_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const transformed = data.map(report => ({
          id: report.case_id,
          type: report.incident_type,
          severity: report.severity,
          status: report.status,
          date: new Date(report.created_at).toISOString().split('T')[0],
          coordinates: report.coordinates,
          desc: report.description || '',
          media: report.media_urls?.map(url => ({ preview: url })) || [],
          actions: report.actions_recommended || [],
          timestamp: new Date(report.created_at).toISOString().replace('T', ' ').split('.')[0] + ' UTC',
          authority: report.authority_name
        }));
        setReportHistory(transformed);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchReports();

    const channel = supabase
      .channel('user-incident-reports')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'incident_reports',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchReports())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // ── Step 1: Upload / Camera ──────
  const processNewFiles = (newFiles) => {
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

  const handleFileUpload = (e) => {
    processNewFiles(Array.from(e.target.files));
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Camera ──────
  const openCamera = async (facing = cameraFacing) => {
    if (files.length >= 4) { alert('Maximum 4 files allowed.'); return; }
    // Grab location for watermark
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setCaptureLocation(`${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? 'N' : 'S'} ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? 'E' : 'W'}`);
      }, () => setCaptureLocation('Location unavailable'));
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please allow camera permissions and try again.');
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const switchCamera = async () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    closeCamera();
    setTimeout(() => openCamera(newFacing), 300);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ── Watermark ──
    const now = new Date();
    const timeStr = now.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true,
    });
    const locStr = captureLocation || 'Location unavailable';
    const lines = [locStr, timeStr];

    const pad = 14;
    const fontSize = Math.max(16, Math.round(canvas.width / 55));
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;

    // Measure max width
    const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
    const boxH = lines.length * (fontSize + 6) + pad;
    const boxW = maxW + pad * 2;

    // Semi-transparent background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    roundRect(ctx, 10, 10, boxW, boxH, 8);
    ctx.fill();

    // Text
    ctx.fillStyle = '#00FF99';
    lines.forEach((line, i) => {
      ctx.fillText(line, 10 + pad, 10 + pad + fontSize + i * (fontSize + 6));
    });

    // Convert to blob and add to files
    canvas.toBlob((blob) => {
      const fileName = `camera_${Date.now()}.jpg`;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setFiles(prev => [...prev, { blob, preview: dataUrl, name: fileName, isCamera: true }]);
      closeCamera();
    }, 'image/jpeg', 0.92);
  };

  // Helper: rounded rect (Canvas API doesn't have this built-in in all browsers)
  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
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
    if (!mapCoords) return CIVIC_AUTHORITIES[0];
    let nearest = CIVIC_AUTHORITIES[0];
    let minDist = Infinity;
    CIVIC_AUTHORITIES.forEach(auth => {
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
      const prompt = `You are a civic solid waste management reporting officer. Given the following user description of a urban civic waste incident: "${customDescription}", write a formal, professional incident report email body section in 4-5 sentences. Use official language suitable for BBMP and KSPCB authorities. Do not include greetings or sign-offs.`;
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

      // Save to Supabase DB
      try {
        const { error: dbError } = await supabase
          .from('incident_reports')
          .insert({
            user_id: user?.id,
            case_id: caseId,
            incident_type: incidentType?.label,
            severity,
            status: 'SUBMITTED',
            coordinates,
            latitude: mapCoords?.[0] || null,
            longitude: mapCoords?.[1] || null,
            description: aiDraftedText || PREWRITTEN_CONTENT[incidentType?.id]?.desc,
            media_urls: files.map(f => f.preview),
            actions_recommended: emailData.actions,
            authority_name: nearestAuthority.name,
            authority_email: nearestAuthority.email,
            email_sent: true
          });
        if (dbError) console.error('DB save error:', dbError);
      } catch (err) {
        console.error('Failed to save report to database:', err);
      }

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

  // ── PDF Generation ──────
  const handleDownloadPDF = async () => {
    const el = printTemplateRef.current;
    if (!el) return;
    setIsPdfGenerating(true);
    try {
      // Make element temporarily visible for capture
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '0';
      el.style.zIndex = '-9999';
      el.style.width = '794px'; // A4 px at 96dpi
      el.style.display = 'block';
      el.style.background = '#ffffff';
      el.style.color = '#1a1a1a';
      el.style.padding = '40px';
      el.style.fontFamily = 'Arial, sans-serif';

      await new Promise(r => setTimeout(r, 200)); // allow render

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Restore element
      el.style.display = 'none';
      el.style.position = '';
      el.style.top = '';
      el.style.left = '';
      el.style.zIndex = '';
      el.style.width = '';
      el.style.background = '';
      el.style.color = '';
      el.style.padding = '';
      el.style.fontFamily = '';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`CYCLOS_REPORT_${caseId}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // ── Delete Report ──────
  const handleDeleteReport = async (entry) => {
    setIsDeleting(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('incident_reports')
          .delete()
          .eq('case_id', entry.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
      // Remove from local state
      setReportHistory(prev => prev.filter(r => r.id !== entry.id));
      setDeleteConfirm(null);
      if (view === 'detail') setView('history');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete report. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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
        {/* ── Camera Modal ── */}
        <AnimatePresence>
          {showCamera && (
            <motion.div
              className="camera-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="camera-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="camera-modal-header">
                  <span className="cam-title"><TbVideo /> Live Camera Feed</span>
                  <button className="cam-close-btn" onClick={closeCamera}><TbX /></button>
                </div>

                <div className="camera-viewfinder">
                  <video
                    ref={videoRef}
                    className="camera-video"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="cam-corner cam-corner-tl" />
                  <div className="cam-corner cam-corner-tr" />
                  <div className="cam-corner cam-corner-bl" />
                  <div className="cam-corner cam-corner-br" />
                  {captureLocation && (
                    <div className="cam-location-badge">
                      <TbMapPin /> {captureLocation}
                    </div>
                  )}
                </div>

                <div className="camera-modal-footer">
                  <button className="cam-switch-btn" onClick={switchCamera} title="Switch camera">
                    <TbSwitchHorizontal /> Switch
                  </button>
                  <button className="cam-capture-btn" onClick={capturePhoto}>
                    <TbFocusCentered /> Capture
                  </button>
                  <button className="cam-cancel-btn" onClick={closeCamera}>
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Delete Confirmation Modal ── */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              className="delete-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteConfirm(null)}
            >
              <motion.div
                className="delete-modal"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="delete-modal-icon"><TbAlertCircle /></div>
                <h3 className="delete-modal-title">Delete Mission Report?</h3>
                <p className="delete-modal-body">
                  Case <strong>#{deleteConfirm.id}</strong> — <em>{deleteConfirm.type}</em> will be permanently removed from the registry. This action cannot be undone.
                </p>
                <div className="delete-modal-actions">
                  <button
                    className="dm-cancel-btn"
                    onClick={() => setDeleteConfirm(null)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="dm-confirm-btn"
                    onClick={() => handleDeleteReport(deleteConfirm)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <><TbLoader2 className="spinning" /> Deleting...</> : <><TbTrash /> Yes, Delete</>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <p>Archived and active civic solid waste management incident reports.</p>
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
                        <div className="card-top-right">
                          <span className={`card-status ${entry.status.toLowerCase()}`}>{entry.status}</span>
                          <button
                            className="card-delete-btn"
                            title="Delete report"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(entry);
                            }}
                          >
                            <TbTrash />
                          </button>
                        </div>
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
                          <div className="brand">CYCLOS SWM PLATFORM</div>
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

                  <button
                    className="detail-delete-btn"
                    onClick={() => setDeleteConfirm(selectedReport)}
                  >
                    <TbTrash /> DELETE REPORT
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
                    {selectedReport.status !== 'RESOLVED' && (
                      <div className="timeline-event">
                        <div className="t-dot" style={{ background: 'transparent', border: '2px solid #EF4444' }}></div>
                        <div className="t-info">
                          <span className="t-label" style={{ color: '#EF4444' }}>KSPCB ESCALATION</span>
                          <span className="t-time">Pending (T-minus 7 Days)</span>
                        </div>
                      </div>
                    )}
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
                  <p className="step-subtitle">Provide visual verification of the urban environmental incident.</p>

                  {/* Hidden file input only */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  {/* Hidden canvas for photo capture watermarking */}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Upload options row */}
                  <div className="evidence-upload-row">
                    <button className="evidence-option-btn upload-btn" onClick={() => fileInputRef.current?.click()}>
                      <TbCloudUpload className="ev-icon" />
                      <span className="ev-label">Upload Files</span>
                      <span className="ev-sub">JPG, PNG, MP4, MOV</span>
                    </button>
                    <button className="evidence-option-btn camera-btn" onClick={() => openCamera()}>
                      <TbCamera className="ev-icon" />
                      <span className="ev-label">Capture Photo</span>
                      <span className="ev-sub">Live camera + geo-stamp</span>
                    </button>
                  </div>

                  {files.length > 0 && (
                    <div className="thumbnail-grid">
                      {files.map((f, i) => (
                        <div key={i} className="thumb-item">
                          {(f.isCamera || (f.file && f.file.type.startsWith('image'))) ? (
                            <img src={f.preview} alt="Evidence" />
                          ) : f.file && f.file.type.startsWith('video') ? (
                            <div className="video-thumb"><TbShip /></div>
                          ) : (
                            <img src={f.preview} alt="Evidence" />
                          )}
                          {f.isCamera && <div className="cam-badge"><TbCamera /></div>}
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
                  )}
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
                      <label>Urban Coordinates (WGS84)</label>
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
                      <span className="auth-label">NEAREST CIVIC AUTHORITY</span>
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
                          [URGENT] Civic Waste Incident - {incidentType?.label.toUpperCase()} - {coordinates} - Case #{caseId}
                        </div>
                      </div>
                      <div className="email-body-scroll">
                        <div className="report-header">
                          <div className="brand">CYCLOS SWM PLATFORM</div>
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
                          <p>This report was generated via Cyclos SWM 2026 Intelligence System.</p>
                          <p><strong>Primary Routing:</strong> BBMP SWM Enforcement Taskforce</p>
                          <p><strong>Secondary Routing:</strong> KSPCB Compliance Board</p>
                          <div style={{ marginTop: '12px', padding: '8px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                            ⚠ MANDATE: If unaddressed within 7 days, this ticket auto-escalates to KSPCB Nodal Officer.
                          </div>
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
              <div ref={printTemplateRef} style={{ display: 'none' }}>
                <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a1a', background: '#fff', padding: '40px', maxWidth: '794px' }}>
                  {/* Header */}
                  <div style={{ borderBottom: '3px solid #0a1628', paddingBottom: '16px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '3px', color: '#0a1628' }}>CYCLOS SWM PLATFORM</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8', marginTop: '4px', letterSpacing: '2px' }}>OFFICIAL MISSION DISPATCH: #{caseId}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{timestamp}</div>
                  </div>

                  {/* Section I */}
                  <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderLeft: '4px solid #1d4ed8', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', color: '#1d4ed8', marginBottom: '10px' }}>I. INCIDENT SUMMARY</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}><span style={{ fontWeight: '700', minWidth: '100px', color: '#374151' }}>TYPE:</span> <span>{incidentType?.label}</span></div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}><span style={{ fontWeight: '700', minWidth: '100px', color: '#374151' }}>SEVERITY:</span> <span style={{ fontWeight: '700', color: SEVERITIES.find(s => s.id === severity)?.color }}>{severity.toUpperCase()}</span></div>
                    <div style={{ display: 'flex', gap: '8px' }}><span style={{ fontWeight: '700', minWidth: '100px', color: '#374151' }}>REPORTER:</span> <span>{reporterName}</span></div>
                  </div>

                  {/* Section II */}
                  <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderLeft: '4px solid #1d4ed8', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', color: '#1d4ed8', marginBottom: '10px' }}>II. COORDINATE TELEMETRY</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}><span style={{ fontWeight: '700', minWidth: '100px', color: '#374151' }}>LOCATION:</span> <span style={{ fontFamily: 'monospace' }}>{coordinates || 'N/A'}</span></div>
                    <div style={{ display: 'flex', gap: '8px' }}><span style={{ fontWeight: '700', minWidth: '100px', color: '#374151' }}>AUTHORITY:</span> <span>{nearestAuthority.name}</span></div>
                  </div>

                  {/* Section III */}
                  <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderLeft: '4px solid #1d4ed8', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', color: '#1d4ed8', marginBottom: '10px' }}>III. OFFICIAL DISPATCH CONTENT</div>
                    <p style={{ lineHeight: '1.7', color: '#374151', margin: 0 }}>{aiDraftedText || PREWRITTEN_CONTENT[incidentType?.id]?.desc || 'No description provided.'}</p>
                  </div>

                  {/* Section IV */}
                  <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderLeft: '4px solid #1d4ed8', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', color: '#1d4ed8', marginBottom: '10px' }}>IV. RECOMMENDED ACTION PLAN</div>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {(PREWRITTEN_CONTENT[incidentType?.id]?.actions || ['Immediate containment required']).map((a, i) => (
                        <li key={i} style={{ marginBottom: '6px', lineHeight: '1.5', color: '#374151' }}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Section V - Media */}
                  {files.length > 0 && (
                    <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderLeft: '4px solid #1d4ed8', borderRadius: '4px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', color: '#1d4ed8', marginBottom: '10px' }}>V. ATTACHED MEDIA EVIDENCE</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {files.map((file, i) => (
                          <img key={i} src={file.preview} alt={`Evidence ${i + 1}`} style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb' }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '12px', fontSize: '11px', color: '#9ca3af' }}>
                    Generated via Cyclos Intelligence System 2026. This document is a certified copy of the original dispatch.
                  </div>
                </div>
              </div>

              <div className="success-actions">
                <button className="download-pdf-btn" onClick={handleDownloadPDF} disabled={isPdfGenerating}>
                  {isPdfGenerating ? <><TbLoader2 className="spinning" /> GENERATING PDF...</> : <><TbDownload /> DOWNLOAD REPORT PDF</>}
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
