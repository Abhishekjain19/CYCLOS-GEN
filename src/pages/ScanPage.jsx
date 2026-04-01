import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TbArrowLeft, TbReload } from 'react-icons/tb';
import './ScanPage.css';

export default function ScanPage() {
  const navigate = useNavigate();
  const [scanned, setScanned] = useState(false);

  // Simulated AI result logic
  const mockType = "Plastic - Grade A";
  const mockEstimation = "2.3 kg";
  const mockCost = "₹12.50";
  const mockProduct = "Eco Bricks, 3D Filament";

  useEffect(() => {
    // Simulate AI scanner processing
    const timer = setTimeout(() => {
      setScanned(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const isPlastic = mockType.toLowerCase().includes('plastic');
  const estimationLabel = isPlastic ? "OBP ESTIMATION" : "CO2 ESTIMATION";


  return (
    <div className="scan-page">
      <div className="scan-header">
        <button className="scan-header__btn" onClick={() => navigate(-1)}>
          <TbArrowLeft size={20} />
        </button>
        <div className="scan-header__title">SCAN</div>
        <button className="scan-header__btn" onClick={() => setScanned(false)}>
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
          {/* Simulated Scanner Line */}
          {!scanned && <div className="scan-line" />}
          
          {/* Simulated Camera Feed - using gradient for now */}
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(to bottom, #cfd9df, #e2ebf0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img 
               src="https://images.unsplash.com/photo-1611284446314-60a58a7dd514?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" 
               alt="crushed plastic" 
               style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: scanned ? 1 : 0.6 }}
            />
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="scan-result-card"
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1, type: "spring", damping: 20 }}
      >
        <div className="scan-result-title">
          {scanned ? mockType : "Analyzing..."}
        </div>
        
        <div className="scan-result-stats">
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">Waste Type</span>
            <span className="scan-result-stat__val">{scanned ? mockType : '-'}</span>
          </div>
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">{estimationLabel}</span>
            <span className="scan-result-stat__val">{scanned ? mockEstimation : '-'}</span>
          </div>
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">Recycling Cost</span>
            <span className="scan-result-stat__val">{scanned ? mockCost : '-'}</span>
          </div>
          <div className="scan-result-stat">
            <span className="scan-result-stat__lbl">Recycled Product Suggestion</span>
            <span className="scan-result-stat__val">{scanned ? mockProduct : '-'}</span>
          </div>
        </div>

        <button 
           className="scan-result-btn"
           onClick={() => scanned ? navigate('/bins') : null}
        >
          {scanned ? 'Add to bin station' : 'Scanning...'}
        </button>
      </motion.div>
    </div>
  );
}
