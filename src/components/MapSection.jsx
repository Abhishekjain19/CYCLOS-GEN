import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Circle, Popup, useMap } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TbRecycle, TbTrash, TbGlobe, TbSearch, TbRipple
} from 'react-icons/tb';
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
  const [hasInitiallyCentered, setHasInitiallyCentered] = useState(false);

  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 15, { duration: 1.2 });
    } else if (userLocation && !hasInitiallyCentered) {
      // Use setView for the initial load to prevent "flying" animation
      map.setView(userLocation, 14);
      setHasInitiallyCentered(true);
    }
  }, [selectedCoords, userLocation, map, hasInitiallyCentered]);
  return null;
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

  const { userProfile } = useAuth();
  const secondaryDomain = userProfile?.secondary_domain || 'Plastic';

  const nearbyBins = useMemo(() => {
    if (!userLocation) return [];
    const [lat, lng] = userLocation;
    return [
      { id: 'bin1', name: 'BBMP Collection Center', lat: lat + 0.005, lng: lng - 0.003, color: '#FF4757', status: 'Open', accepts: 'Dry Waste', yr: '12t', mo: '1t' },
      { id: 'bin2', name: 'Smart Bin Malleswaram', lat: lat - 0.002, lng: lng + 0.006, color: '#2E86DE', status: 'Open', accepts: 'Recyclables', yr: '5t', mo: '0.4t' },
      { id: 'bin3', name: 'Transfer Station North', lat: lat + 0.002, lng: lng + 0.008, color: '#FF9F43', status: 'Open', accepts: 'Mixed Waste', yr: '45t', mo: '3.5t' },
    ];
  }, [userLocation]);

  const nearbyProducers = useMemo(() => {
    if (!userLocation) return [];
    const [lat, lng] = userLocation;
    return [
      { id: 'prod1', name: 'Community Producer', lat: lat + 0.008, lng: lng + 0.002, domain: secondaryDomain },
      { id: 'prod2', name: 'Local Bulk Seller', lat: lat - 0.004, lng: lng - 0.005, domain: secondaryDomain },
    ];
  }, [userLocation, secondaryDomain]);

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
          center={userLocation || [12.9716, 77.5946]}
          zoom={14}
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
          
          {filteredData.map((zone, idx) => {
            const wardColor = zone.status === 'critical_waste' ? '#FF4757' : zone.status === 'moderate' ? '#FF9F43' : '#2EE5B0';
            
            return (
              <Marker 
                key={zone.id}
                position={[zone.lat, zone.lng]}
                icon={getMarkerIcon(zone.status, idx)}
                eventHandlers={{ click: () => setSelectedZone(zone) }}
              >
                <Popup>
                  <div className="map-bin-popup" style={{ minWidth: '220px', padding: '4px' }}>
                    <h4 style={{ margin: '0 0 8px', color: wardColor }}>{zone.name}</h4>
                    <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                      <strong>Status:</strong> {zone.status === 'eco_hub' ? 'Eco-Positive' : zone.status === 'moderate' ? 'Moderate' : 'Critical'}<br/>
                      <strong>Capacity:</strong> Active Collection
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', fontSize: '12px' }}>
                      <div style={{ flex: 1, background: '#f1f3f5', padding: '6px 8px', borderRadius: '4px' }}>
                        <strong>{zone.status === 'eco_hub' ? '2.5k' : zone.status === 'moderate' ? '5k' : '12k'}</strong>t/yr
                      </div>
                      <div style={{ flex: 1, background: '#f1f3f5', padding: '6px 8px', borderRadius: '4px' }}>
                        <strong>{zone.status === 'eco_hub' ? '208' : zone.status === 'moderate' ? '415' : '1k'}</strong>t/mo
                      </div>
                    </div>

                    <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px', lineHeight: '1.4' }}>
                      {zone.desc}
                    </p>

                    <button 
                      style={{ 
                        width: '100%', 
                        padding: '8px', 
                        background: wardColor, 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        boxShadow: `0 4px 12px ${wardColor}33`
                      }}
                      onClick={() => window.open(`https://www.google.com/maps/?q=${zone.lat},${zone.lng}`, '_blank')}
                    >
                      Navigate to Ward Office ↗
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={userLocation}>
              <Tooltip direction="top" permanent>You</Tooltip>
            </Marker>
          )}

          {/* Nearby Bins */}
          {nearbyBins.map(bin => {
            const binIcon = L.divIcon({
              className: 'custom-bin-marker',
              html: `<div style="background-color: ${bin.color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${bin.color}"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            });

            return (
              <Marker 
                key={bin.id} 
                position={[bin.lat, bin.lng]}
                icon={binIcon}
              >
                <Popup>
                  <div className="map-bin-popup" style={{ minWidth: '200px', padding: '4px' }}>
                    <h4 style={{ margin: '0 0 8px', color: bin.color }}>{bin.name}</h4>
                    <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                      <strong>Status:</strong> {bin.status}<br/>
                      <strong>Accepts:</strong> {bin.accepts}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', fontSize: '12px' }}>
                      <div style={{ flex: 1, background: '#f1f3f5', padding: '4px 8px', borderRadius: '4px' }}>
                        <strong>{bin.yr}</strong>/yr
                      </div>
                      <div style={{ flex: 1, background: '#f1f3f5', padding: '4px 8px', borderRadius: '4px' }}>
                        <strong>{bin.mo}</strong>/mo
                      </div>
                    </div>
                    <button 
                      style={{ 
                        width: '100%', 
                        padding: '6px', 
                        background: bin.color, 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${bin.lat},${bin.lng}`, '_blank')}
                    >
                      Navigate in Google Maps ↗
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Producer Fuzz Circles */}
          {nearbyProducers.map(p => (
            <Circle 
              key={p.id}
              center={[p.lat, p.lng]}
              radius={400}
              pathOptions={{ 
                color: '#facc15', 
                fillColor: '#facc15', 
                fillOpacity: 0.15, 
                dashArray: '5, 10' 
              }}
            >
              <Tooltip direction="top">
                <strong>{p.name}</strong><br/>
                Sells: {p.domain}
              </Tooltip>
            </Circle>
          ))}
        </MapContainer>


      </div>

      <div className="map-footer-note">
        <TbRipple /> 📡 Select a sector to engage civic telemetry sensors
      </div>
    </div>
  );
}
