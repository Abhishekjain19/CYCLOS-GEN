import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TbArrowLeft, TbReload, TbCamera, TbPhoto, TbQrcode } from 'react-icons/tb';
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

  // Auto-set mode if passed from navigation (e.g., from ProfilePanel)
  useEffect(() => {
    if (location.state?.autoMode === 'qr') {
      setInputMode('qr');
    }
  }, [location.state]);

  const handleQRScan = async (text) => {
    if (!text || !text.startsWith('REQ-') || analyzing) return;
    try {
      setAnalyzing(true);
      const reqIdParts = text.split('-');
      if (reqIdParts.length < 3) throw new Error("Invalid QR format");
      const realId = reqIdParts[1];
      const buyerId = reqIdParts[2];
      
      // Verification: The seller (current user) is scanning the buyer's QR
      // The QR code contains the buyer's ID to ensure they are the correct recipient.
      
      const { data: request, error: fetchErr } = await supabase
        .from('market_orders')
        .select('*')
        .eq('id', realId)
        .single();
        
      if (fetchErr || !request) throw new Error("Request not found");
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
      
      // Update Profiles: Buyer gets points and weight, Seller gets points
      // 1. Update Buyer
      const { data: buyerProfile } = await supabase.from('profiles').select('points, total_recycled_weight').eq('id', buyerId).single();
      if (buyerProfile) {
        await supabase.from('profiles').update({ 
          points: (buyerProfile.points || 0) + pointsToAward,
          total_recycled_weight: (buyerProfile.total_recycled_weight || 0) + numericWeight
        }).eq('id', buyerId);
      }

      // 2. Update Seller (Current User)
      const { data: sellerProfile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
      if (sellerProfile) {
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const base64withPrefix = canvas.toDataURL('image/jpeg', 0.8);
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

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      setImage(reader.result);
      processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64) => {
    setAnalyzing(true);
    setError(null);
    setScanned(false);

    try {
      const data = await analyzeWasteImage(base64);
      setResult(data);
      setScanned(true);
    } catch (err) {
      console.error(err);
      setError('AI Analysis failed. Please try a clearer photo.');
    } finally {
      setAnalyzing(false);
    }
  };

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
          transition={{ duration: 0.5 }}
        >
          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Targeting HUD Overlay */}
          <div className="scan-hud-overlay">
            <div className="scan-hud-corners">
              <div className="scan-hud-corner tl" />
              <div className="scan-hud-corner tr" />
              <div className="scan-hud-corner bl" />
              <div className="scan-hud-corner br" />
            </div>
            



          </div>
          
          <div className="scan-camera-inner">
            {inputMode === 'choose' ? (
              <div className="scan-choice-container">
                <button 
                  className="scan-choice-btn camera"
                  onClick={() => {
                    setInputMode('camera');
                    setUseCamera(true);
                  }}
                >
                  <TbCamera size={32} />
                  <span>AI WASTE SCAN</span>
                </button>
                <button 
                  className="scan-choice-btn"
                  style={{ background: 'var(--ocean-800)', marginTop: 12, border: '1px solid var(--ocean-600)' }}
                  onClick={() => {
                    setInputMode('qr');
                  }}
                >
                  <TbQrcode size={32} />
                  <span>TRANSACT (QR)</span>
                </button>
                <div className="scan-choice-divider">OR</div>
                <label className="scan-choice-btn upload">
                  <input type="file" accept="image/*" onChange={(e) => {
                    handleFileUpload(e);
                    setInputMode('upload');
                  }} hidden />
                  <TbPhoto size={32} />
                  <span>UPLOAD PHOTO</span>
                </label>
              </div>
            ) : inputMode === 'qr' ? (
              <div style={{ width: '100%', height: '100%', background: 'black', position: 'relative' }}>
                <Scanner onScan={(res) => handleQRScan(res?.[0]?.rawValue)} />
                {qrMessage && (
                  <div style={{ position: 'absolute', bottom: 20, left: 10, right: 10, background: 'var(--teal-400)', color: 'var(--ocean-900)', padding: 10, borderRadius: 8, textAlign: 'center', fontWeight: 'bold' }}>
                    {qrMessage}
                  </div>
                )}
              </div>
            ) : inputMode === 'camera' ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="scan-live-video"
              />
            ) : image ? (
              <img src={image} alt="Waste to scan" className="scan-preview-img" />
            ) : (
              <div className="scan-placeholder">
                <TbReload size={48} className="scan-placeholder-icon" />
                <p>Initializing scanner...</p>
              </div>
            )}
          </div>

          {!scanned && inputMode !== 'choose' && (
            <div className="scan-controls-overlay">

            </div>
          )}
        </motion.div>
      </div>

      <motion.div 
        className="scan-result-card"
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1, type: "spring", damping: 20 }}
      >
        {error && <div className="scan-error">{error}</div>}
        
        <div className="scan-result-title">
          {analyzing ? "Analysing..." : scanned ? result.type : "Scan Result"}
        </div>
        
        <div className="scan-result-stats">
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">Waste Type</span>
            <span className="scan-result-stat__val">{scanned ? result.type : '-'}</span>
          </div>
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">Weight Est.</span>
            <span className="scan-result-stat__val">{scanned ? result.weight_estimation : '-'}</span>
          </div>
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">Recycling Value</span>
            <span className="scan-result-stat__val">{scanned ? result.recycling_cost : '-'}</span>
          </div>
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">CO2 Impact</span>
            <span className="scan-result-stat__val">{scanned ? result.co2_impact : '-'}</span>
          </div>
          <div className="scan-result-stat" style={{ gridColumn: 'span 2' }}>
            <span className="scan-result-stat__lbl">AI Suggestion</span>
            <span className="scan-result-stat__val">{scanned ? result.recycled_product_suggestion : '-'}</span>
          </div>
        </div>

        <button 
           className="scan-result-btn"
           onClick={() => scanned ? navigate('/bins', { state: { materialType: result?.type } }) : null}
           disabled={analyzing || !scanned}
        >
          {scanned ? 'Add to bin station' : 'Capture an image'}
        </button>
      </motion.div>
    </div>
  );
}
