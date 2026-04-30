import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TbArrowLeft, TbReload, TbCamera, TbPhoto, TbQrcode, TbMapPin } from 'react-icons/tb';
import { analyzeWasteImage } from '../services/nvidiaNim';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Scanner } from '@yudiel/react-qr-scanner';
import './ScanPage.css';

export default function ScanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [scanned, setScanned] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [inputMode, setInputMode] = useState('choose'); // 'choose', 'camera', 'upload', 'qr'
  const [scanningProgress, setScanningProgress] = useState(0);
  const [qrMessage, setQrMessage] = useState('');
  
  // SWM 2026 Specific State
  const [editedWeight, setEditedWeight] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [timerRef, setTimerRef] = useState(null);

  // Auto-set mode if passed from navigation (e.g., from ProfilePanel)
  useEffect(() => {
    if (location.state?.autoMode === 'qr') {
      setInputMode('qr');
    }
  }, [location.state]);

  const handleQRScan = async (text) => {
    console.log('QR Scanned:', text);
    if (!text || !text.startsWith('REQ::::') || analyzing) return;
    try {
      setAnalyzing(true);
      const reqIdParts = text.split('::::');
      console.log('Parsed Parts:', reqIdParts);
      if (reqIdParts.length < 3) throw new Error("Invalid QR format");
      const realId = reqIdParts[1];
      const buyerId = reqIdParts[2];
      
      console.log('Fetching order with ID:', realId);
      const cleanId = realId.trim();
      
      const { data: orderData, error: fetchErr } = await supabase
        .from('market_orders')
        .select('*')
        .eq('id', cleanId);
        
      const request = orderData?.[0];

      if (fetchErr) {
        console.error('Fetch Error Detail:', fetchErr);
        throw new Error(`DB Error: ${fetchErr.message}`);
      }
      if (!request) {
        console.error('No record found for ID:', cleanId);
        throw new Error("Order record not found");
      }
      
      console.log('Request found:', request);
      if (request.status !== 'accepted') throw new Error("Transaction not ready for pickup");
      if (request.seller_id !== user.id) throw new Error("You are not the seller of this item");

      // Extract weight from quantity string (e.g., "15 kg" -> 15)
      const numericWeight = parseFloat(request.quantity?.replace(/[^0-9.]/g, '')) || 5;
      const pointsToAward = Math.round(numericWeight * 5); // 5 points per kg

      // Mark request complete
      const { error: updateErr } = await supabase
        .from('market_orders')
        .update({ status: 'completed' })
        .eq('id', realId);
        
      if (updateErr) throw updateErr;
      
      // 2. Update Profiles: Buyer gets points and weight, Seller gets points
      
      // 1. Update Buyer
      const { data: buyerData, error: bFetchErr } = await supabase.from('profiles').select('points, total_recycled_weight').eq('id', buyerId);
      const buyerProfile = buyerData?.[0]; // Get first match
      if (buyerProfile && !bFetchErr) {
        await supabase.from('profiles').update({ 
          points: (buyerProfile.points || 0) + pointsToAward,
          total_recycled_weight: (buyerProfile.total_recycled_weight || 0) + numericWeight
        }).eq('id', buyerId);
      }

      // 2. Update Seller (Current User)
      const { data: sellerData, error: sFetchErr } = await supabase.from('profiles').select('points').eq('id', user.id);
      const sellerProfile = sellerData?.[0]; // Get first match
      if (sellerProfile && !sFetchErr) {
        await supabase.from('profiles').update({ 
          points: (sellerProfile.points || 0) + pointsToAward 
        }).eq('id', user.id);
      }
      
      setQrMessage('Pickup Verified! ECO points awarded.');
      toast.success(`Transaction complete! +${pointsToAward} ECO points.`);
      setScanned(true);
      setResult({ 
        type: 'Transaction Verified', 
        weight_estimation: `${numericWeight} kg processed`, 
        recycling_cost: `+${pointsToAward} ECO Points`,
        co2_impact: `${(numericWeight * 1.5).toFixed(1)} kg CO2 saved`,
        recycled_product_suggestion: 'Proceed to nearest sorting hub'
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to verify transaction');
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper for actual analysis to avoid redundant logic
  const captureAndProcess = () => {
    if (!videoRef.current || analyzing) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Ensure video is ready
    if (video.readyState !== 4) return; 
    if (video.videoWidth === 0) return;

    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    
    const base64withPrefix = canvas.toDataURL('image/jpeg', 0.7);
    const base64 = base64withPrefix.split(',')[1];
    
    // For auto-scan, we only set a result image once a match is found
    if (!autoScan) {
      setImage(base64withPrefix);
    }
    
    processImage(base64);
  };

  // Camera Logic
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError('Camera access denied. Please use the upload option.');
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const handleCameraCapture = () => {
    captureAndProcess();
    if (!autoScan) {
      stopCamera();
      setUseCamera(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const base64withPrefix = canvas.toDataURL('image/jpeg', 0.7);
      const base64 = base64withPrefix.split(',')[1];
      setImage(base64withPrefix);
      processImage(base64);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  const processImage = async (base64) => {
    setAnalyzing(true);
    setError(null);
    setScanned(false);
    setShowConfirm(false);
    setEditedWeight('');

    try {
      const data = await analyzeWasteImage(base64);
      setResult(data);
      setScanned(true);
      setEditedWeight(data.weight_estimation);
      
      const conf = parseInt(data.confidence || '0', 10);
      if (conf < 80) {
        setShowConfirm(true);
        setCountdown(10);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setShowConfirm(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimerRef(timer);
      }
    } catch (err) {
      console.error(err);
      setError('AI Analysis failed. Please try a clearer photo.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef) clearInterval(timerRef);
    };
  }, [timerRef]);

  useEffect(() => {
    if (useCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [useCamera]);

  // Update Scanning Progress when analyzing
  useEffect(() => {
    let progressInterval;
    if (analyzing) {
      setScanningProgress(0);
      progressInterval = setInterval(() => {
        setScanningProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 100);
    } else {
      setScanningProgress(0);
    }
    return () => clearInterval(progressInterval);
  }, [analyzing]);

  // Auto-scan cycle
  useEffect(() => {
    let timeout;
    if (useCamera && autoScan && !scanned && !analyzing) {
      // Periodic snap and analyze
      timeout = setTimeout(() => {
        captureAndProcess();
      }, 4000); 
    }
    return () => clearTimeout(timeout);
  }, [useCamera, autoScan, scanned, analyzing]);



  const getCaseId = () => `EV-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  return (
    <div className="scan-page">
      <div className="scan-header">
        <button className="scan-header__btn" onClick={() => navigate(-1)}>
          <TbArrowLeft size={20} />
        </button>
        <div className="scan-header__title">SCAN</div>
        <button className="scan-header__btn" onClick={() => {
          setScanned(false);
          setInputMode('choose');
          setUseCamera(false);
          setImage(null);
          setResult(null);
        }}>
          <TbReload size={20} />
        </button>
      </div>

      <div className="scan-camera-wrapper">
        <motion.div
          className="scan-camera-box"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {inputMode === 'choose' ? (
            <div className="scan-choice-container">
              {/* Zone 1 – Camera */}
              <div
                className="scan-zone-camera tappable"
                onClick={() => { setInputMode('camera'); setUseCamera(true); }}
              >
                <div className="scan-hud-overlay">
                  <div className="scan-hud-corners">
                    <div className="scan-hud-corner tl" />
                    <div className="scan-hud-corner tr" />
                    <div className="scan-hud-corner bl" />
                    <div className="scan-hud-corner br" />
                  </div>
                </div>
                <TbCamera className="scan-zone-icon" />
                <span className="scan-zone-title">AI Waste Scan</span>
                <span className="scan-zone-hint">Point at any waste material</span>
              </div>

              <div className="scan-choice-divider">OR</div>

              {/* Zone 2 – QR */}
              <div className="scan-zone-qr tappable" onClick={() => setInputMode('qr')}>
                <div className="scan-zone-qr-icon"><TbQrcode /></div>
                <div className="scan-zone-qr-text">
                  <div className="scan-zone-qr-label">TRANSACT VIA QR</div>
                  <div className="scan-zone-qr-sub">Scan seller QR to complete trade</div>
                </div>
              </div>

              <div className="scan-choice-divider">OR</div>

              {/* Zone 3 – Upload */}
              <label className="scan-zone-upload tappable">
                <input type="file" accept="image/*" onChange={(e) => { handleFileUpload(e); setInputMode('upload'); }} hidden />
                <div className="scan-zone-upload-icon"><TbPhoto /></div>
                <div>
                  <div className="scan-zone-upload-label">Upload from Gallery</div>
                  <div className="scan-zone-upload-sub">JPG, PNG, WEBP supported</div>
                </div>
              </label>
            </div>
          ) : inputMode === 'qr' ? (
            <div className="scan-camera-inner" style={{ minHeight: 320, background: '#000' }}>
              <Scanner onScan={(res) => handleQRScan(res?.[0]?.rawValue)} />
              {qrMessage && (
                <div style={{ position:'absolute', bottom:16, left:12, right:12, background:'var(--eco-500)', color:'#FFF', padding:'10px 14px', borderRadius:10, textAlign:'center', fontWeight:700 }}>
                  {qrMessage}
                </div>
              )}
            </div>
          ) : inputMode === 'camera' ? (
            <div className="scan-camera-inner" style={{ position: 'relative', minHeight: 280 }}>
              <div className="scan-hud-overlay">
                <div className="scan-hud-corners">
                  <div className="scan-hud-corner tl" />
                  <div className="scan-hud-corner tr" />
                  <div className="scan-hud-corner bl" />
                  <div className="scan-hud-corner br" />
                </div>
              </div>
              <video ref={videoRef} autoPlay playsInline className="scan-live-video" />
              {inputMode === 'camera' && !scanned && (
                <div className="scan-controls-overlay">
                  <button
                    style={{ width:64, height:64, borderRadius:'50%', background:'var(--eco-500)', border:'none', color:'#FFF', fontSize:26, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 0 24px rgba(45,106,79,0.5)' }}
                    onClick={handleCameraCapture}
                    disabled={analyzing}
                  >
                    <TbCamera />
                  </button>
                </div>
              )}
            </div>
          ) : image ? (
            <div className="scan-camera-inner">
              <img src={image} alt="Waste to scan" className="scan-preview-img" />
            </div>
          ) : (
            <div className="scan-placeholder">
              <TbReload size={48} style={{ color:'var(--grey-500)' }} />
              <p style={{ color:'var(--grey-600)', fontSize:14 }}>Initializing scanner...</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Result Card ── */}
      <motion.div
        className="scan-result-card"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', damping: 22 }}
      >
        {error && <div className="scan-error">{error}</div>}

        <div className="scan-result-header">
          <span className="scan-result-label">SCAN RESULT</span>
          <span className="scan-result-case">{scanned ? getCaseId() : 'EV-??????'}</span>
        </div>

        <div className="scan-result-title">
          {analyzing ? 'Analysing...' : scanned ? result.type : 'Capture an image'}
        </div>

        {/* LLaMA Pro Escalation Confirm Bar */}
        {showConfirm && (
          <div style={{ background: '#FF475722', border: '1px solid #FF4757', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ color: '#FF4757', fontSize: '13px', margin: '0 0 8px 0', fontWeight: 'bold' }}>
              ⚠ LLaMA Pro: Low confidence. Is this classification correct?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowConfirm(false); clearInterval(timerRef); }} style={{ flex: 1, padding: '8px', background: '#FF4757', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Yes</button>
              <button onClick={() => { setShowConfirm(false); clearInterval(timerRef); setResult(null); setScanned(false); setInputMode('camera'); }} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #FF4757', color: '#FF4757', borderRadius: '4px', cursor: 'pointer' }}>No, Rescan</button>
            </div>
            <div style={{ fontSize: '10px', color: '#FF4757', marginTop: '8px', textAlign: 'right' }}>Auto-confirm in {countdown}s</div>
          </div>
        )}

        <div className="scan-result-stats">
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">Material Type</span>
            <span className="scan-result-stat__val">{scanned ? result.type : '—'}</span>
          </div>
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">Stream & Grade</span>
            <span className="scan-result-stat__val">{scanned ? `${result.stream} · Grade ${result.grade}` : '—'}</span>
          </div>
          
          <div className="scan-result-stat" style={{ gridColumn: 'span 2' }}>
            <span className="scan-result-stat__lbl">Actual Weight (kg)</span>
            <input 
              type="number" 
              value={editedWeight} 
              onChange={(e) => setEditedWeight(e.target.value)}
              disabled={!scanned}
              style={{ width: '100%', padding: '8px', background: 'var(--grey-100)', border: '1px solid var(--grey-300)', borderRadius: '6px', color: 'var(--grey-900)', fontFamily: 'inherit', marginTop: '4px' }}
            />
          </div>

          <div className="scan-result-stat scan-result-stat--value">
            <span className="scan-result-stat__lbl">♻ Estimated Price</span>
            <span className="scan-result-stat__val">
              {scanned ? `₹${(parseFloat(editedWeight || 0) * parseFloat(result.price_per_kg || 0)).toFixed(2)}` : '—'}
            </span>
          </div>
          <div className="scan-result-stat scan-result-stat--co2">
            <span className="scan-result-stat__lbl">⚠ CO₂ Impact</span>
            <span className="scan-result-stat__val">
              {scanned ? `${(parseFloat(editedWeight || 0) * parseFloat(result.co2_per_kg || 0)).toFixed(1)} kg saved` : '—'}
            </span>
          </div>
        </div>

        {scanned && result.selling_potential && (
          <div className="scan-ai-suggestion" style={{ marginTop: '12px' }}>
            <span className="scan-ai-icon">✦</span>
            <p className="scan-ai-text"><strong>AI Analysis:</strong> Recyclability Score {result.recyclability_score}. Selling Potential: {result.selling_potential}.</p>
          </div>
        )}

        {scanned && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
            {(result.stream?.toLowerCase().includes('organic') || result.stream?.toLowerCase().includes('wet')) && parseFloat(editedWeight || 0) < 2 ? (
              <button
                className="scan-result-btn"
                onClick={() => navigate('/bins', { state: { materialType: result?.type } })}
                style={{ background: 'var(--eco-500)', color: '#fff', border: 'none' }}
              >
                <TbMapPin size={18} /> Move to BBMP Green Bin
              </button>
            ) : (
              <button
                className="scan-result-btn"
                onClick={() => navigate('/market/sell', { state: { result, weight: editedWeight } })}
                style={{ background: 'var(--grey-900)', color: '#fff', border: 'none' }}
                disabled={showConfirm}
              >
                List on Market
              </button>
            )}
            
            <button
              onClick={() => { setScanned(false); setResult(null); setInputMode('camera'); }}
              style={{ padding: '12px', background: 'transparent', color: 'var(--grey-600)', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Cancel
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
