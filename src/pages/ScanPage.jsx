import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TbArrowLeft, TbReload, TbCamera, TbPhoto } from 'react-icons/tb';
import { analyzeWasteImage } from '../services/nvidiaNim';
import './ScanPage.css';

export default function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [scanned, setScanned] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [inputMode, setInputMode] = useState('choose'); // 'choose', 'camera', 'upload'
  const [scanningProgress, setScanningProgress] = useState(0);

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
                  <span>LIVE CAMERA</span>
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
