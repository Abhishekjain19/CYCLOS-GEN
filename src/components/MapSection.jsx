import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, useMap,
         GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { TbSparkles, TbLoader2, TbX, TbDroplet, TbFish, TbWind,
         TbRecycle, TbTemperature, TbWaveSine, TbAlertTriangle,
         TbChevronRight } from 'react-icons/tb';
import { getChatResponse } from '../services/nvidiaNim';
import './MapSection.css';

/* ─── REAL OCEAN & SEA DATA ─────────────────────────────────────────── */
const OCEANS_AND_SEAS = [
  // ─ Major Oceans
  { id: 'pacific',        name: 'Pacific Ocean',        lat: 0,      lng: -160,  category: 'polluted',     radius: 22, desc: 'Largest & most polluted ocean — home to the Great Pacific Garbage Patch' },
  { id: 'atlantic',       name: 'Atlantic Ocean',       lat: 14,     lng: -40,   category: 'popular',      radius: 20, desc: 'Second largest ocean, major shipping routes & fishing grounds' },
  { id: 'indian',         name: 'Indian Ocean',         lat: -15,    lng: 75,    category: 'polluted',     radius: 18, desc: 'Third largest ocean, heavy pollution from South & SE Asian coastlines' },
  { id: 'southern',       name: 'Southern Ocean',       lat: -62,    lng: 0,     category: 'less_explored', radius: 16, desc: 'Encircles Antarctica — remote, pristine but under climate threat' },
  { id: 'arctic',         name: 'Arctic Ocean',         lat: 82,     lng: 10,    category: 'less_explored', radius: 14, desc: 'Smallest ocean, rapidly losing ice cover due to climate change' },

  // ─ Major Seas — Asia & Indian Ocean
  { id: 'arabian_sea',    name: 'Arabian Sea',          lat: 14,     lng: 65,    category: 'polluted',     radius: 12, desc: 'Receives waste from India, Pakistan & the Gulf states' },
  { id: 'bay_bengal',     name: 'Bay of Bengal',        lat: 14,     lng: 88,    category: 'polluted',     radius: 12, desc: 'One of the most plastic-polluted water bodies globally' },
  { id: 'south_china',    name: 'South China Sea',      lat: 12,     lng: 114,   category: 'polluted',     radius: 11, desc: 'Major fishing grounds, heavy industrial runoff & shipping traffic' },
  { id: 'east_china',     name: 'East China Sea',       lat: 29,     lng: 125,   category: 'popular',      radius: 10, desc: 'Critical fishing zone between China, Japan & South Korea' },
  { id: 'sea_japan',      name: 'Sea of Japan',         lat: 40,     lng: 135,   category: 'popular',      radius: 10, desc: 'Important biodiversity zone with unique deep-sea ecosystems' },
  { id: 'andaman',        name: 'Andaman Sea',          lat: 10,     lng: 96,    category: 'popular',      radius: 9,  desc: 'Rich coral reef systems, popular diving destination' },
  { id: 'laccadive',      name: 'Laccadive Sea',        lat: 8,      lng: 74,    category: 'less_explored', radius: 8, desc: 'Between India, Maldives & Sri Lanka — pristine atolls' },

  // ─ Mediterranean & European Seas
  { id: 'mediterranean',  name: 'Mediterranean Sea',    lat: 35,     lng: 18,    category: 'polluted',     radius: 13, desc: 'Almost closed sea — extreme microplastic concentration' },
  { id: 'north_sea',      name: 'North Sea',            lat: 56,     lng: 3,     category: 'popular',      radius: 9,  desc: 'One of the busiest shipping lanes in the world' },
  { id: 'baltic',         name: 'Baltic Sea',           lat: 59,     lng: 20,    category: 'polluted',     radius: 9,  desc: 'Severe eutrophication and dead zones from agricultural runoff' },
  { id: 'black_sea',      name: 'Black Sea',            lat: 43,     lng: 35,    category: 'polluted',     radius: 9,  desc: 'Anoxic deep waters, heavy industrial & sewage pollution' },
  { id: 'barents',        name: 'Barents Sea',          lat: 73,     lng: 37,    category: 'less_explored', radius: 8, desc: 'Arctic gateway — critical for climate research' },

  // ─ Americas
  { id: 'caribbean',      name: 'Caribbean Sea',        lat: 15,     lng: -75,   category: 'popular',      radius: 11, desc: 'Coral reef biodiversity hotspot, tourism & hurricane corridor' },
  { id: 'gulf_mexico',    name: 'Gulf of Mexico',       lat: 25,     lng: -90,   category: 'polluted',     radius: 11, desc: 'Major oil industry impact, dead zone from Mississippi runoff' },
  { id: 'sargasso',       name: 'Sargasso Sea',         lat: 30,     lng: -60,   category: 'less_explored', radius: 10, desc: 'Unique boundaryless sea, critical eel breeding habitat' },
  { id: 'bering',         name: 'Bering Sea',           lat: 58,     lng: -175,  category: 'less_explored', radius: 10, desc: 'Remote subarctic sea separating Alaska & Russia' },

  // ─ Pacific Islands & Oceania
  { id: 'coral_sea',      name: 'Coral Sea',            lat: -18,    lng: 155,   category: 'popular',      radius: 10, desc: 'Home to the Great Barrier Reef — World Heritage site' },
  { id: 'tasman',         name: 'Tasman Sea',           lat: -38,    lng: 163,   category: 'less_explored', radius: 9, desc: 'Between Australia & New Zealand — deep pelagic zone' },
  { id: 'philippine',     name: 'Philippine Sea',       lat: 20,     lng: 135,   category: 'popular',      radius: 10, desc: 'Deepest trenches on Earth, Typhoon alley' },
  { id: 'java',           name: 'Java Sea',             lat: -5,     lng: 112,   category: 'polluted',     radius: 9,  desc: 'Shallow, heavily fished & high plastic pollution from Indonesia' },

  // ─ Africa
  { id: 'red_sea',        name: 'Red Sea',              lat: 21,     lng: 38,    category: 'popular',      radius: 9,  desc: 'Warmest sea — spectacular coral reefs under thermal stress' },
  { id: 'mozambique',     name: 'Mozambique Channel',   lat: -18,    lng: 42,    category: 'less_explored', radius: 8, desc: 'Between Madagascar & Africa — pristine marine biodiversity' },
];

/* category styling */
const CATEGORY_CONFIG = {
  polluted:      { color: '#ef4444', glow: 'rgba(239,68,68,0.35)',  label: 'Most Polluted',       icon: '🔴' },
  popular:       { color: '#f59e0b', glow: 'rgba(245,158,11,0.35)', label: 'High Traffic / Popular', icon: '🟡' },
  less_explored: { color: '#06b6d4', glow: 'rgba(6,182,212,0.35)',  label: 'Less Explored',       icon: '🔵' },
};

/* ─── Map controller ────────────────────────────────────────────────── */
function MapController() {
  const map = useMap();
  useEffect(() => { map.invalidateSize(); }, [map]);
  return null;
}

/* ─── Detail panel that shows on ocean click ────────────────────────── */
function OceanDetailPanel({ ocean, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await getChatResponse([{
          role: 'user',
          content: `Provide accurate marine environmental data for "${ocean.name}" as a JSON object ONLY (no other text). Include these fields:
- obp_tonnes_year: (number) estimated Ocean-Bound Plastic entering per year in tonnes
- biodiversity_index: (number 0-100) current biodiversity health index  
- species_threatened: (number) count of IUCN threatened marine species
- surface_temp_c: (number) average sea surface temperature in °C
- avg_wind_knots: (number) average surface wind speed in knots
- plastic_density_km2: (number) floating plastic pieces per km²
- dissolved_oxygen_pct: (number) average dissolved oxygen saturation percentage
- coral_reef_health: (string) "Critical"/"Poor"/"Fair"/"Good"/"Excellent" or "N/A"
- top_pollutant: (string) primary pollutant type
- conservation_status: (string) brief 1-sentence summary

Return ONLY the JSON object, no markdown, no backticks.`
        }]);

        if (cancelled) return;

        // Parse JSON from AI response
        const jsonMatch = resp.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid response format');
        const parsed = JSON.parse(jsonMatch[0]);
        setData(parsed);
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching ocean data:', err);
          setError('Unable to fetch marine data. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ocean.id]);

  const cat = CATEGORY_CONFIG[ocean.category];

  return (
    <motion.div
      className="ocean-detail-panel"
      initial={{ opacity: 0, x: 30, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="ocean-detail__header">
        <div>
          <span className="ocean-detail__badge" style={{ background: cat.color + '22', color: cat.color, borderColor: cat.color }}>
            {cat.label}
          </span>
          <h3 className="ocean-detail__title">{ocean.name}</h3>
          <p className="ocean-detail__desc">{ocean.desc}</p>
        </div>
        <button className="ocean-detail__close" onClick={onClose}><TbX size={18} /></button>
      </div>

      {/* Body */}
      {loading && (
        <div className="ocean-detail__loading">
          <TbLoader2 className="spinner" size={24} />
          <span>Fetching live marine intelligence…</span>
        </div>
      )}

      {error && (
        <div className="ocean-detail__error">
          <TbAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {data && !loading && (
        <div className="ocean-detail__grid">
          <div className="ocean-stat">
            <div className="ocean-stat__icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}><TbRecycle size={18} /></div>
            <div className="ocean-stat__info">
              <span className="ocean-stat__value">{Number(data.obp_tonnes_year).toLocaleString()}</span>
              <span className="ocean-stat__label">OBP tonnes/year</span>
            </div>
          </div>
          <div className="ocean-stat">
            <div className="ocean-stat__icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}><TbFish size={18} /></div>
            <div className="ocean-stat__info">
              <span className="ocean-stat__value">{data.biodiversity_index}/100</span>
              <span className="ocean-stat__label">Biodiversity Index</span>
            </div>
          </div>
          <div className="ocean-stat">
            <div className="ocean-stat__icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}><TbAlertTriangle size={18} /></div>
            <div className="ocean-stat__info">
              <span className="ocean-stat__value">{Number(data.species_threatened).toLocaleString()}</span>
              <span className="ocean-stat__label">Threatened Species</span>
            </div>
          </div>
          <div className="ocean-stat">
            <div className="ocean-stat__icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><TbTemperature size={18} /></div>
            <div className="ocean-stat__info">
              <span className="ocean-stat__value">{data.surface_temp_c}°C</span>
              <span className="ocean-stat__label">Surface Temp</span>
            </div>
          </div>
          <div className="ocean-stat">
            <div className="ocean-stat__icon" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}><TbWind size={18} /></div>
            <div className="ocean-stat__info">
              <span className="ocean-stat__value">{data.avg_wind_knots} kt</span>
              <span className="ocean-stat__label">Avg Wind Speed</span>
            </div>
          </div>
          <div className="ocean-stat">
            <div className="ocean-stat__icon" style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4' }}><TbDroplet size={18} /></div>
            <div className="ocean-stat__info">
              <span className="ocean-stat__value">{data.dissolved_oxygen_pct}%</span>
              <span className="ocean-stat__label">Dissolved O₂</span>
            </div>
          </div>
          <div className="ocean-stat ocean-stat--wide">
            <div className="ocean-stat__icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}><TbWaveSine size={18} /></div>
            <div className="ocean-stat__info">
              <span className="ocean-stat__value">{data.plastic_density_km2} pcs/km²</span>
              <span className="ocean-stat__label">Plastic Density</span>
            </div>
          </div>

          {/* Extra info */}
          <div className="ocean-detail__extras">
            <div className="ocean-extra-row">
              <span className="ocean-extra-label">Coral Reef Health</span>
              <span className={`ocean-extra-value ocean-coral--${(data.coral_reef_health || 'na').toLowerCase().replace(/\s/g, '-')}`}>
                {data.coral_reef_health || 'N/A'}
              </span>
            </div>
            <div className="ocean-extra-row">
              <span className="ocean-extra-label">Top Pollutant</span>
              <span className="ocean-extra-value">{data.top_pollutant}</span>
            </div>
            <div className="ocean-extra-row ocean-extra-row--full">
              <span className="ocean-extra-label">Conservation Status</span>
              <p className="ocean-conservation-text">{data.conservation_status}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}


/* ─── Main MapSection ───────────────────────────────────────────────── */
export default function MapSection({ domain }) {
  const [selectedOcean, setSelectedOcean] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const generateInsight = async () => {
    setLoadingInsight(true);
    try {
      const summary = OCEANS_AND_SEAS.map(o =>
        `${o.name}: ${CATEGORY_CONFIG[o.category].label}`
      ).join(', ');
      const response = await getChatResponse([{
        role: 'user',
        content: `Here is a summary of global oceans & seas and their pollution status: ${summary}. Please provide a 3-sentence expert environmental overview of the current state of ocean health globally in 2025. Focus on OBP (ocean-bound plastic), biodiversity loss, and key regions of concern.`
      }]);
      setAiInsight(response);
    } catch (err) {
      console.error(err);
      setAiInsight("Unable to generate insight at this time.");
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <motion.div
      className="map-section"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Legend */}
      <div className="map-section__legend">
        {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
          <div key={key} className="map-section__legend-item">
            <span className="map-section__legend-dot" style={{ background: val.color, boxShadow: `0 0 8px ${val.glow}` }} />
            <span>{val.label}</span>
          </div>
        ))}
      </div>

      <div className="map-wrapper">
        {/* Map + Detail side by side */}
        <div className={`map-layout ${selectedOcean ? 'map-layout--with-panel' : ''}`}>
          <div className="map-container">
            <MapContainer
              center={[15, 60]}
              zoom={3}
              minZoom={2}
              maxZoom={8}
              style={{ height: '100%', width: '100%', borderRadius: '16px' }}
              zoomControl={false}
              attributionControl={false}
              worldCopyJump={true}
            >
              <MapController />

              {/* ── White map with blue borders ── */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap &copy; CartoDB"
              />

              {/* ── Ocean / Sea markers ── */}
              {OCEANS_AND_SEAS.map((ocean) => {
                const cat = CATEGORY_CONFIG[ocean.category];
                const isSelected = selectedOcean?.id === ocean.id;

                return (
                  <CircleMarker
                    key={ocean.id}
                    center={[ocean.lat, ocean.lng]}
                    radius={isSelected ? ocean.radius + 4 : ocean.radius}
                    pathOptions={{
                      color: cat.color,
                      fillColor: cat.color,
                      fillOpacity: isSelected ? 0.6 : 0.35,
                      weight: isSelected ? 3 : 1.5,
                      opacity: 0.9,
                    }}
                    eventHandlers={{
                      click: () => setSelectedOcean(ocean),
                    }}
                  >
                    <Tooltip
                      direction="top"
                      offset={[0, -ocean.radius]}
                      className="ocean-tooltip"
                      permanent={ocean.radius >= 14}
                    >
                      <span className="ocean-tooltip__name">{ocean.name}</span>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* AI Insight Button */}
            <button
              className={`map-ai-btn ${loadingInsight ? 'loading' : ''}`}
              onClick={generateInsight}
              disabled={loadingInsight}
            >
              {loadingInsight ? <TbLoader2 className="spinner" /> : <TbSparkles />}
              <span>AI Insight</span>
            </button>

            {/* AI Insight Overlay */}
            <AnimatePresence>
              {aiInsight && (
                <motion.div
                  className="map-ai-overlay"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="map-ai-overlay__header">
                    <span><TbSparkles size={14} /> GLOBAL OCEAN INTELLIGENCE</span>
                    <button onClick={() => setAiInsight(null)}><TbX size={14} /></button>
                  </div>
                  <p>{aiInsight}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ocean Detail Panel */}
          <AnimatePresence>
            {selectedOcean && (
              <OceanDetailPanel
                key={selectedOcean.id}
                ocean={selectedOcean}
                onClose={() => setSelectedOcean(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="map-section__note">
        🌊 Tap any ocean or sea to view real-time marine intelligence
      </p>
    </motion.div>
  );
}
