import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import './MapSection.css';

// 20 fuzzy sample points around Bangalore
const BASE_LAT = 12.9716;
const BASE_LNG = 77.5946;

function generatePoints(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    lat: BASE_LAT + (Math.random() - 0.5) * 0.25,
    lng: BASE_LNG + (Math.random() - 0.5) * 0.25,
    title: [
      'Coastal Zone A', 'Bay Cleanup Area', 'Deep Reef',
      'Harbor Port', 'Estuary Outlet', 'Marine Reserve',
      'Industrial Coast', 'Public Beach', 'Island Cove',
      'Fishing Community', 'Coral Atoll', 'Open Water Zone'
    ][i % 12],
    kg: Math.floor(Math.random() * 500 + 50),
    type: ['Populated', 'Polluted', 'Less Explored'][Math.floor(Math.random() * 3)],
    distance: (Math.random() * 15 + 0.5).toFixed(1),
  }));
}

const POINTS = generatePoints(20);

const COLOR_MAP = {
  Populated: '#38bdf8', /* Cyan */
  Polluted: '#ef4444', /* Red */
  'Less Explored': '#10b981', /* Teal/Green */
};

function DarkMap() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

export default function MapSection({ domain }) {
  const points = useMemo(() => POINTS, []);

  return (
    <motion.div
      className="map-section"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="map-section__legend">
        {Object.entries(COLOR_MAP).map(([type, color]) => (
          <div key={type} className="map-section__legend-item">
            <span className="map-section__legend-dot" style={{ background: color }} />
            <span>{type}</span>
          </div>
        ))}
      </div>

      <div className="map-container">
        <MapContainer
          center={[BASE_LAT, BASE_LNG]}
          zoom={12}
          style={{ height: '100%', width: '100%', borderRadius: '16px' }}
          zoomControl={false}
          attributionControl={false}
        >
          <DarkMap />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CartoDB"
          />
          {points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={8 + Math.random() * 6}
              pathOptions={{
                color: COLOR_MAP[p.type],
                fillColor: COLOR_MAP[p.type],
                fillOpacity: 0.6,
                weight: 1.5,
                opacity: 0.8,
              }}
            >
              <Popup className="map-popup">
                <div className="map-popup__inner">
                  <strong>{p.title}</strong>
                  <span>📦 {p.type} · {p.kg} kg</span>
                  <span>📍 ~{p.distance} km away</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <p className="map-section__note">
        📍 Nearest ocean/sea is 42.5 kms far
      </p>
    </motion.div>
  );
}
