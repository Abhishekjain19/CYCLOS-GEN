import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TbRecycle, TbFish, TbAlertTriangle, TbThermometer, TbWind, 
  TbDroplet, TbTrash, TbCircleCheck, TbBuildingSkyscraper, 
  TbActivity, TbLeaf, TbMicroscope, TbGlobe, TbHistory, 
  TbSparkles, TbSearch, TbFilter, TbX, TbChevronRight,
  TbLoader2, TbRipple
} from 'react-icons/tb';
import { getChatResponse } from '../services/nvidiaNim';
import './MapSection.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ─── EXHAUSTIVE URBAN DATA ────────────────────────────── */
const URBAN_ECO_ZONES = [
  { id: 'ward_76', name: 'Malleswaram Ward 76', lat: 13.0031, lng: 77.5643, status: 'eco_hub', desc: 'High citizen participation and active dry waste collection centers.' },
  { id: 'ward_150', name: 'Bellandur Ward 150', lat: 12.9304, lng: 77.6784, status: 'critical_waste', desc: 'Frequent illegal dumping and low collection efficiency.' },
  { id: 'ward_174', name: 'HSR Layout Ward 174', lat: 12.9121, lng: 77.6446, status: 'moderate', desc: 'Improving segregation but high commercial waste volume.' },
  { id: 'ward_111', name: 'Shantala Nagar Ward 111', lat: 12.9716, lng: 77.5946, status: 'moderate', desc: 'Central business district with heavy mixed waste generation.' },
  { id: 'ward_168', name: 'Jayanagar Ward 168', lat: 12.9250, lng: 77.5938, status: 'eco_hub', desc: 'Model ward with extensive composting initiatives.' },
  { id: 'ward_82', name: 'Garudachar Palya Ward 82', lat: 12.9863, lng: 77.7118, status: 'critical_waste', desc: 'Industrial zone with poor waste tracking.' },
  { id: 'ward_193', name: 'Arakere Ward 193', lat: 12.8860, lng: 77.5970, status: 'moderate', desc: 'Growing residential area facing waste management stress.' }
];

const getMarkerIcon = (status, index) => {
  let color = "#00E5FF";
  let className = "pulse-marker-clean";
  
  if (status === "critical_waste") {
    color = "#FF4757";
    className = "pulse-marker-critical_waste";
  } else if (status === "moderate") {
    color = "#FFB347";
    className = "pulse-marker-moderate";
  } else if (status === "eco_hub") {
    color = "#2EE5B0";
    className = "pulse-marker-eco_hub";
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-container ${className}" style="animation-delay: ${index * 60}ms">
        <div class="marker-core" style="background: ${color}"></div>
        <div class="marker-ring" style="border-color: ${color}"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function MapController({ selectedCoords, userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 14, { duration: 1.2 });
    } else if (userLocation) {
      map.flyTo(userLocation, 12, { duration: 1.5 });
    }
  }, [selectedCoords, userLocation, map]);
  return null;
}

/* ─── Zone Detail Panel ─────────────────────────────────────────── */
function ZoneDetailPanel({ zone, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [showThreatenedList, setShowThreatenedList] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resp = await getChatResponse([{
          role: 'user',
          content: `Provide accurate solid waste management data for "${zone.name}" as JSON. Include:
          sw_tonnes_year (number), sw_tonnes_month (number), waste_accepted (array of strings, e.g., ["Plastic", "E-Waste", "Organic"]), pollution_level ("High", "Moderate", "Low"), facility_status ("Open", "Closed"), ai_long_insight (string 3 sentences).
          Return ONLY JSON.`
        }]);
        const jsonText = resp.match(/\{[\s\S]*\}/)[0];
        const json = JSON.parse(jsonText);
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [zone.id]);


  const triggerAIInsight = () => {
    if (!data) return;
    setIsStreaming(true);
    setAiInsight("");
    const text = data.ai_long_insight;
    let i = 0;
    const interval = setInterval(() => {
      setAiInsight(prev => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 20);
  };

  return (
    <motion.div 
      className="map-detail-sidebar"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="sidebar-header">
        <div className="header-text">
          <h2>{zone.name}</h2>
          <span className={`status-badge ${zone.status}`}>{zone.status} zone</span>
        </div>
        <button onClick={onClose} className="sidebar-close"><TbX /></button>
      </div>

      <div className="sidebar-scrollable">
        {loading ? (
          <div className="sidebar-loading">
            <TbLoader2 className="spinner" />
            <p>Scanning SWM Data Streams...</p>
          </div>
        ) : data ? (
          <div className="metrics-grid">
            {/* 1. Navigation Option */}
            <div 
              className="metric-card full" 
              style={{ cursor: 'pointer', background: 'rgba(82,183,136,0.15)', border: '1px solid rgba(82,183,136,0.3)', marginBottom: '8px' }} 
              onClick={() => window.open(`https://maps.google.com/?q=${zone.lat},${zone.lng}`, '_blank')}
            >
              <TbGlobe className="m-icon" style={{ color: 'var(--eco-600)' }} />
              <div className="m-info">
                <span className="m-label" style={{ color: 'var(--eco-600)' }}>Navigation</span>
                <span className="m-value" style={{ fontSize: '15px', color: 'var(--grey-900)' }}>Open in Google Maps ↗</span>
              </div>
            </div>

            {/* 2. What kind of waste are accepted */}
            <div className="metric-card full">
              <TbTrash className="m-icon" />
              <div className="m-info">
                <span className="m-label">Waste Accepted</span>
                <span className="m-value" style={{ fontSize: '14px' }}>
                  {data.waste_accepted ? data.waste_accepted.join(', ') : "Mixed SWM, Organic, Plastic"}
                </span>
              </div>
            </div>

            {/* 3. Is this ward polluted */}
            <div className="metric-card">
              <TbAlertTriangle className="m-icon" />
              <div className="m-info">
                <span className="m-label">Pollution Level</span>
                <span className={`m-badge ${data.pollution_level?.toLowerCase() === 'high' ? 'danger' : data.pollution_level?.toLowerCase() === 'low' ? 'success' : 'warning'}`}>
                  {data.pollution_level || "Moderate"}
                </span>
              </div>
            </div>

            {/* 5. Open or close */}
            <div className="metric-card">
              <TbCircleCheck className="m-icon" />
              <div className="m-info">
                <span className="m-label">Facility Status</span>
                <span className={`m-badge ${data.facility_status?.toLowerCase() === 'closed' ? 'danger' : 'success'}`}>
                  {data.facility_status || "Open"}
                </span>
              </div>
            </div>

            {/* 4. Approx waste per year/month */}
            <div className="metric-card full">
              <TbRecycle className="m-icon" />
              <div className="m-info">
                <span className="m-label">Approx Waste (Year / Month)</span>
                <span className="m-value">
                  {Number(data.sw_tonnes_year || 12000).toLocaleString()} t/yr &nbsp;|&nbsp; {Number(data.sw_tonnes_month || 1000).toLocaleString()} t/mo
                </span>
              </div>
            </div>

            <div className="metric-card full primary">
              <div className="m-info">
                <span className="m-label">AI Conservation Insight</span>
                <button 
                  className="ai-gen-btn" 
                  onClick={triggerAIInsight} 
                  disabled={isStreaming}
                >
                  <TbSparkles /> {isStreaming ? "Synthesizing..." : "Analyze Zone"}
                </button>
                {(aiInsight || isStreaming) && (
                  <div className="ai-insight-box">
                    <p>{aiInsight}</p>
                    {isStreaming && <span className="streaming-dot"></span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="error-text">Failed to connect to SWM civic uplink.</p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Map Component ─────────────────────────────────────────── */
export default function MapSection() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  }, []);

  const filteredData = useMemo(() => {
    return URBAN_ECO_ZONES.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || o.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  return (
    <div className="integrated-map-section">
      <div className="map-controls">
        <div className="map-search">
          <TbSearch />
          <input 
            placeholder="Search urban wards..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="map-filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={`critical_waste ${filter === 'critical_waste' ? 'active' : ''}`} onClick={() => setFilter('critical_waste')}>Polluted</button>
          <button className={`moderate ${filter === 'moderate' ? 'active' : ''}`} onClick={() => setFilter('moderate')}>Moderate</button>
          <button className={`eco_hub ${filter === 'eco_hub' ? 'active' : ''}`} onClick={() => setFilter('eco_hub')}>Biodiverse</button>
        </div>
      </div>

      <div className="map-frame">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          minZoom={4}
          maxBounds={[[6.5546, 68.1114], [35.6745, 97.3956]]}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          className="leaflet-integrated-container"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
            noWrap={true}
          />
          <MapController 
            selectedCoords={selectedZone?.lat ? [selectedZone.lat, selectedZone.lng] : null} 
            userLocation={userLocation}
          />
          
          {filteredData.map((zone, idx) => (
            <Marker 
              key={zone.id}
              position={[zone.lat, zone.lng]}
              icon={getMarkerIcon(zone.status, idx)}
              eventHandlers={{ click: () => setSelectedZone(zone) }}
            >
              <Tooltip direction="top" className="map-integrated-tooltip" opacity={1}>
                <strong>{zone.name}</strong>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        <AnimatePresence>
          {selectedZone && (
            <ZoneDetailPanel 
              zone={selectedZone} 
              onClose={() => setSelectedZone(null)} 
            />
          )}
        </AnimatePresence>
      </div>

      <div className="map-footer-note">
        <TbRipple /> 📡 Select a sector to engage civic telemetry sensors
      </div>
    </div>
  );
}
