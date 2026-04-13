import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TbArrowLeft, TbLocation, TbRoute, TbTrash,
  TbLoader, TbArrowUp, TbArrowRight, TbArrowUpRight,
  TbFlag, TbBolt, TbMapPin, TbRecycle, TbBulb, TbWifi
} from 'react-icons/tb';
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

const SITE_TYPES = [
  {
    id: 1, iconClass: 'bin-list-icon--bbmp',
    typeBadge: 'COLLECTION POINT',
    icon: <TbTrash size={22} />,
    status: 'Open 24/7',
    accepts: ['Dry Waste', 'Recyclables'],
  },
  {
    id: 2, iconClass: 'bin-list-icon--transfer',
    typeBadge: 'TRANSFER STATION',
    icon: <TbRoute size={22} />,
    status: 'Open 6am–10pm',
    accepts: ['Mixed Waste', 'Bulk Items'],
  },
  {
    id: 3, iconClass: 'bin-list-icon--smart',
    typeBadge: 'SMART DUSTBIN',
    icon: <TbWifi size={22} />,
    status: '24/7 Smart',
    accepts: ['Recyclables', 'Plastic', 'Metal'],
  },
  {
    id: 4, iconClass: 'bin-list-icon--hub',
    typeBadge: 'RECYCLING HUB',
    icon: <TbRecycle size={22} />,
    status: 'Open 8am–8pm',
    accepts: ['Plastic', 'OBP', 'E-Waste', 'Metal', 'Glass'],
  },
];

const generateNearbyBins = (lat, lng) => [
  { id: 1, lat: lat + 0.0051, lng: lng - 0.0042, name: "BBMP Primary Collection Point", distance: "0.6 km", type: "Dry Waste", ...SITE_TYPES[0] },
  { id: 2, lat: lat - 0.0034, lng: lng + 0.0082, name: "Garbage Transfer Station", distance: "1.2 km", type: "Mixed Waste", ...SITE_TYPES[1] },
  { id: 3, lat: lat + 0.0120, lng: lng + 0.0010, name: "Public Smart Dustbin", distance: "2.1 km", type: "Recyclables", ...SITE_TYPES[2] },
  { id: 4, lat: lat - 0.0080, lng: lng - 0.0090, name: "Community Recycling Hub", distance: "2.8 km", type: "Plastics/OBP", ...SITE_TYPES[3] },
];

const getHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getNavGuidance = (distKm) => {
  if (distKm <= 0.05) return { text: "Arrived at destination", icon: <TbFlag />, color: "#4ade80" };
  if (distKm <= 0.3)  return { text: "Destination on the left", icon: <TbArrowUpRight />, color: "#00E5FF" };
  if (distKm <= 0.8)  return { text: "Prepare to turn right", icon: <TbArrowRight />, color: "#00E5FF" };
  return { text: "Continue straight", icon: <TbArrowUp />, color: "#00E5FF" };
};

function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => { map.setView(coords); }, [coords]);
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
        () => setLoading(false),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedBin) { setLiveRoute([]); return; }
    const fetchRoute = async () => {
      setRouteLoading(true);
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${selectedBin.lng},${selectedBin.lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.routes?.[0]) {
          setLiveRoute(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
        }
      } catch {
        setLiveRoute([[userPos[0], userPos[1]], [selectedBin.lat, selectedBin.lng]]);
      } finally {
        setRouteLoading(false);
      }
    };
    fetchRoute();
  }, [selectedBin, userPos[0], userPos[1]]);

  const bins = useMemo(() => generateNearbyBins(userPos[0], userPos[1]), [userPos]);

  const handleBack = () => {
    if (isNavigating) setIsNavigating(false);
    else if (selectedBin) setSelectedBin(null);
    else navigate(-1);
  };

  return (
    <div className="bin-page">
      {/* ── Header ── */}
      <div className={`bin-header${selectedBin ? '' : ' bin-header--solid'}`}>
        <button className="bin-header__btn" onClick={handleBack}>
          <TbArrowLeft size={20} />
        </button>
        <div className="bin-header__title">
          {isNavigating ? 'GPS Active' : selectedBin ? selectedBin.typeBadge || 'Navigation' : 'Nearby Sites'}
        </div>
        <div className="bin-header__spacer" />
      </div>

      <AnimatePresence mode="wait">
        {!selectedBin ? (
          /* ── LIST VIEW ── */
          <motion.div
            key="list"
            className="bin-list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Stats strip */}
            <div className="bin-stats-strip">
              <div className="bin-stats-strip__item">
                <TbMapPin size={13} className="icon-cyan" />
                4 sites nearby
              </div>
              <div className="bin-stats-strip__divider" />
              <div className="bin-stats-strip__item">
                <TbBolt size={13} className="icon-teal" />
                0.6 km closest
              </div>
              <div className="bin-stats-strip__divider" />
              <div className="bin-stats-strip__item">
                <TbLocation size={13} />
                Bengaluru
              </div>
            </div>

            <div className="bin-list">
              {bins.map((bin, i) => (
                <motion.div
                  key={bin.id}
                  className="bin-list-item"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setSelectedBin(bin)}
                >
                  {/* Icon */}
                  <div className={`bin-list-icon ${bin.iconClass}`}>
                    {bin.icon}
                  </div>

                  {/* Info */}
                  <div className="bin-list-info">
                    <span className="bin-list-type-badge">{bin.typeBadge}</span>
                    <h3 className="bin-list-name">{bin.name}</h3>
                    <div className="bin-list-dist-row">
                      <p className="bin-list-dist">
                        <TbLocation size={12} />
                        {bin.distance}
                      </p>
                      <div className="bin-list-dot" />
                      <span className="bin-list-status">{bin.status}</span>
                    </div>
                  </div>

                  {/* Nav button */}
                  <div className="bin-list-action">
                    <TbRoute size={18} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── MAP VIEW ── */
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
                center={[(userPos[0] + selectedBin.lat) / 2, (userPos[1] + selectedBin.lng) / 2]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <MapRecenter coords={isNavigating ? userPos : [(userPos[0] + selectedBin.lat) / 2, (userPos[1] + selectedBin.lng) / 2]} />
                <Marker position={[userPos[0], userPos[1]]}>
                  <Popup>Your Location</Popup>
                </Marker>
                <Marker position={[selectedBin.lat, selectedBin.lng]}>
                  <Popup>{selectedBin.name}</Popup>
                </Marker>
                <Polyline positions={liveRoute} color="#00E5FF" weight={5} className="nav-route-line" />
              </MapContainer>
            </div>

            {/* Floating pill title */}
            {!isNavigating && (
              <div className="bin-map-pill">{selectedBin.name}</div>
            )}

            {/* Live coords card */}
            <div className="bin-coords-card">
              <div className="bin-coords-live">
                <span className="blink-dot" />
                LIVE
              </div>
              <span>{userPos[0].toFixed(5)}°N</span>
              <span>{userPos[1].toFixed(5)}°E</span>
            </div>

            {/* Bottom Action Sheet */}
            <motion.div
              className={`bin-action-sheet${isNavigating ? ' nav-active' : ''}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            >
              {routeLoading && (
                <div className="route-pulse-loader">
                  <TbLoader className="bin-spin" size={16} />
                  Calculating road path…
                </div>
              )}
              <div className="bin-sheet-handle" />

              {isNavigating ? (() => {
                const dist = getHaversineKm(userPos[0], userPos[1], selectedBin.lat, selectedBin.lng);
                const guidance = getNavGuidance(dist);
                const eta = Math.ceil(dist / 0.08);
                return (
                  <div className="bin-nav-hud">
                    <div className="nav-hud-step" style={{ background: `${guidance.color}11`, borderColor: `${guidance.color}33`, color: guidance.color }}>
                      {guidance.icon} {guidance.text}
                    </div>
                    <div className="nav-hud-title">
                      <span className="live-dot" /> ON ROUTE
                    </div>
                    <div className="nav-hud-dest">{selectedBin.name}</div>
                    <div className="nav-hud-meta">{dist.toFixed(2)} km · {eta} mins ETA</div>
                    <div className="nav-hud-actions">
                      <button className="nav-btn cancel" onClick={() => setIsNavigating(false)}>EXIT</button>
                      <button className="nav-btn arrive" onClick={() => navigate('/app')}>I'VE ARRIVED</button>
                    </div>
                  </div>
                );
              })() : (
                <>
                  <h3 className="bin-sheet-title">{selectedBin.name}</h3>

                  <div className="bin-sheet-meta">
                    <span className="bin-badge bin-badge--dist">
                      <TbLocation size={13} /> {selectedBin.distance}
                    </span>
                    <span className="bin-badge bin-badge--material">
                      Accepts {materialType}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="bin-sheet-stats">
                    <div className="bin-sheet-stat">
                      <span className="bin-sheet-stat__val">{selectedBin.distance}</span>
                      <span className="bin-sheet-stat__lbl">Distance</span>
                    </div>
                    <div className="bin-sheet-stat">
                      <span className="bin-sheet-stat__val">
                        {Math.ceil(parseFloat(selectedBin.distance) / 0.08)} min
                      </span>
                      <span className="bin-sheet-stat__lbl">ETA Walk</span>
                    </div>
                    <div className="bin-sheet-stat">
                      <span className="bin-sheet-stat__val" style={{ color: '#00B894', fontSize: 13 }}>
                        {selectedBin.status}
                      </span>
                      <span className="bin-sheet-stat__lbl">Hours</span>
                    </div>
                  </div>

                  <button className="bin-sheet-btn" onClick={() => setIsNavigating(true)}>
                    <TbRoute size={20} /> Start Navigation
                  </button>

                  <p className="bin-sheet-footer">
                    Route updates in real-time · Powered by OpenStreetMap
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="bin-loading-overlay">
          <TbLoader className="bin-spin" size={44} style={{ color: '#00E5FF' }} />
          <p>Finding local collection points…</p>
        </div>
      )}
    </div>
  );
}
