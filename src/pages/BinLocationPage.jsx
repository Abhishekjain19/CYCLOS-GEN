import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { TbArrowLeft, TbLocation, TbRoute, TbTrash } from 'react-icons/tb';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './BinLocationPage.css';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const USER_LAT = 13.0012;
const USER_LNG = 77.5540; // Approx near Mahalakshmi Layout

const generateBins = () => [
  { id: 1, lat: 13.0076, lng: 77.5458, name: "Mahalakshmi Dumpyard", distance: "0.8 km" },
  { id: 2, lat: 12.9845, lng: 77.5501, name: "Rajajinagar Eco Station", distance: "1.5 km" },
  { id: 3, lat: 13.0180, lng: 77.5450, name: "Yeshwanthpur Recycling Hub", distance: "2.1 km" },
  { id: 4, lat: 13.0030, lng: 77.5710, name: "Malleshwaram Collection Point", distance: "2.4 km" }
];

export default function BinLocationPage() {
  const navigate = useNavigate();
  const [selectedBin, setSelectedBin] = useState(null);
  const bins = useMemo(() => generateBins(), []);

  // Mock route from user to bin
  const routePositions = selectedBin 
    ? [[USER_LAT, USER_LNG], [(USER_LAT + selectedBin.lat)/2, USER_LNG], [selectedBin.lat, selectedBin.lng]]
    : [];

  const handleBack = () => {
    if (selectedBin) {
      setSelectedBin(null); // Go back to list
    } else {
      navigate(-1); // Go back to scanner
    }
  };

  return (
    <div className="bin-page">
      {/* Header */}
      <div className={`bin-header ${!selectedBin ? 'bin-header--solid' : ''}`}>
        <button className="bin-header__btn" onClick={handleBack}>
          <TbArrowLeft size={20} />
        </button>
        <div className="bin-header__title">Nearby Bins</div>
        <div className="bin-header__spacer" />
      </div>

      {/* View Switch: List vs Map */}
      <AnimatePresence mode="wait">
        {!selectedBin ? (
          <motion.div 
             key="list"
             className="bin-list-view"
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             transition={{ duration: 0.2 }}
          >
            <div className="bin-list">
              {bins.map(bin => (
                <div key={bin.id} className="bin-list-item" onClick={() => setSelectedBin(bin)}>
                  <div className="bin-list-icon">
                    <TbTrash size={24} />
                  </div>
                  <div className="bin-list-info">
                    <h3 className="bin-list-name">{bin.name}</h3>
                    <p className="bin-list-dist">
                      <TbLocation size={14} /> {bin.distance} away
                    </p>
                  </div>
                  <TbRoute size={20} className="bin-list-action" />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
             key="map"
             className="bin-map-view"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.2 }}
          >
            {/* Full screen Map */}
            <div className="bin-map-wrapper">
              <MapContainer 
                center={[(USER_LAT + selectedBin.lat)/2, (USER_LNG + selectedBin.lng)/2]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                {/* User Location */}
                <Marker position={[USER_LAT, USER_LNG]}>
                  <Popup>You are here</Popup>
                </Marker>

                {/* Selected Bin Location */}
                <Marker position={[selectedBin.lat, selectedBin.lng]}>
                  <Popup>{selectedBin.name}</Popup>
                </Marker>

                {/* Route Line */}
                <Polyline positions={routePositions} color="#00e5ff" weight={4} dashArray="8, 8" />
              </MapContainer>
            </div>

            {/* Bottom Action Sheet */}
            <motion.div 
              className="bin-action-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            >
              <div className="bin-sheet-handle" />
              <h3 className="bin-sheet-title">{selectedBin.name}</h3>
              <div className="bin-sheet-meta">
                <span className="bin-badge"><TbLocation size={16} /> {selectedBin.distance} away</span>
                <span className="bin-badge">Accepts Plastics</span>
              </div>
              
              <button className="bin-sheet-btn">
                <TbRoute size={20} /> Start Navigation
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
