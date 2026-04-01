import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { TbArrowLeft, TbLocation, TbRoute, TbTrash, TbLoader, TbArrowUp, TbArrowRight, TbArrowUpRight, TbFlag } from 'react-icons/tb';
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

const DEFAULT_LAT = 13.0012;
const DEFAULT_LNG = 77.5540;

const generateNearbyBins = (lat, lng) => [
  { id: 1, lat: lat + 0.0051, lng: lng - 0.0042, name: "BBMP Primary Collection Point", distance: "0.6 km", type: "Dry Waste" },
  { id: 2, lat: lat - 0.0034, lng: lng + 0.0082, name: "Garbage Transfer Station", distance: "1.2 km", type: "Mixed Waste" },
  { id: 3, lat: lat + 0.0120, lng: lng + 0.0010, name: "Public Smart Dustbin", distance: "2.1 km", type: "Recyclables" },
  { id: 4, lat: lat - 0.0080, lng: lng - 0.0090, name: "Community Recycling Hub", distance: "2.8 km", type: "Plastics/OBP" }
];

// Haversine Distance Helper
const getHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getNavGuidance = (distKm) => {
  if (distKm <= 0.05) return { text: "Arrived at destination", icon: <TbFlag />, color: "#4ade80" };
  if (distKm <= 0.3) return { text: "Destination on the left", icon: <TbArrowUpRight />, color: "#00e5ff" };
  if (distKm <= 0.8) return { text: "Prepare to turn right", icon: <TbArrowRight />, color: "#00e5ff" };
  return { text: "Continue straight", icon: <TbArrowUp />, color: "#00e5ff" };
};

// Helper to auto-recenter map
function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords);
  }, [coords]);
  return null;
}

export default function BinLocationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const materialType = location.state?.materialType || "General Waste";
  
  const [userPos, setUserPos] = useState([DEFAULT_LAT, DEFAULT_LNG]);
  const [loading, setLoading] = useState(true);
  const [selectedBin, setSelectedBin] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [liveRoute, setLiveRoute] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          setLoading(false);
        },
        (err) => {
          console.warn('Geolocation error, using defaults', err);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch real road route from OSRM
  useEffect(() => {
    if (!selectedBin) {
      setLiveRoute([]);
      return;
    }

    const fetchRoute = async () => {
      setRouteLoading(true);
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${selectedBin.lng},${selectedBin.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        if (data.routes && data.routes[0]) {
          // OSRM returns [lng, lat], Leaflet needs [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setLiveRoute(coords);
        }
      } catch (err) {
        console.error('OSRM Fetch error:', err);
        // Fallback to straight line if API fails
        setLiveRoute([[userPos[0], userPos[1]], [selectedBin.lat, selectedBin.lng]]);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
  }, [selectedBin, userPos[0], userPos[1]]);

  const bins = useMemo(() => generateNearbyBins(userPos[0], userPos[1]), [userPos]);

  const handleBack = () => {
    if (isNavigating) {
      setIsNavigating(false);
    } else if (selectedBin) {
      setSelectedBin(null);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="bin-page">
      {/* Header */}
      <div className={`bin-header ${(selectedBin && !isNavigating) ? '' : 'bin-header--solid'}`}>
        <button className="bin-header__btn" onClick={handleBack}>
          <TbArrowLeft size={20} />
        </button>
        <div className="bin-header__title">
          {isNavigating ? 'GPS Active' : 'Nearby Sites'}
        </div>
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
            <div className="bin-map-wrapper">
              <MapContainer 
                center={[(userPos[0] + selectedBin.lat)/2, (userPos[1] + selectedBin.lng)/2]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapRecenter coords={isNavigating ? userPos : [(userPos[0] + selectedBin.lat)/2, (userPos[1] + selectedBin.lng)/2]} />
                
                <Marker position={[userPos[0], userPos[1]]}>
                  <Popup>Your Location</Popup>
                </Marker>
 
                <Marker position={[selectedBin.lat, selectedBin.lng]}>
                  <Popup>{selectedBin.name}</Popup>
                </Marker>
 
                {/* Real-world Route Line */}
                <Polyline 
                   positions={liveRoute} 
                   color="#00e5ff" 
                   weight={6}
                   className="nav-route-line"
                />
              </MapContainer>
            </div>
 
            {/* Action Sheet / HUD */}
            <motion.div 
              className={`bin-action-sheet ${isNavigating ? 'nav-active' : ''}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            >
              {routeLoading && (
                <div className="route-pulse-loader">
                  <TbLoader className="bin-spin" size={20} /> Calculating Road Path...
                </div>
              )}
              <div className="bin-sheet-handle" />
              
              {isNavigating ? (
                (() => {
                  const currentDist = getHaversineKm(userPos[0], userPos[1], selectedBin.lat, selectedBin.lng);
                  const guidance = getNavGuidance(currentDist);
                  const eta = Math.ceil(currentDist / 0.08);

                  return (
                    <div className="bin-nav-hud">
                      <div className="nav-hud-step" style={{ background: `${guidance.color}11`, borderColor: `${guidance.color}33`, color: guidance.color }}>
                        {guidance.icon} {guidance.text}
                      </div>
                      <div className="nav-hud-title">
                        <span className="live-dot" /> ON ROUTE
                      </div>
                      <div className="nav-hud-dest">{selectedBin.name}</div>
                      <div className="nav-hud-meta">
                        <span>{parseFloat(currentDist.toFixed(2))} km • {eta} mins ETA</span>
                      </div>
                      <div className="nav-hud-actions">
                        <button className="nav-btn cancel" onClick={() => setIsNavigating(false)}>EXIT</button>
                        <button className="nav-btn arrive" onClick={() => navigate('/app')}>I'VE ARRIVED</button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  <h3 className="bin-sheet-title">{selectedBin.name}</h3>
                  <div className="bin-sheet-meta">
                    <span className="bin-badge"><TbLocation size={16} /> {selectedBin.distance}</span>
                    <span className="bin-badge">Accepts {materialType}</span>
                  </div>
                  
                  <button className="bin-sheet-btn" onClick={() => setIsNavigating(true)}>
                    <TbRoute size={20} /> Start Navigation
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="bin-loading-overlay">
          <TbLoader className="bin-spin" size={48} />
          <p>Finding local collection points...</p>
        </div>
      )}
    </div>
  );
}
