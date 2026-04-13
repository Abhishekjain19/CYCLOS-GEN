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

/* ─── EXHAUSTIVE OCEAN, SEA & RIVER DATA ────────────────────────────── */
const OCEANS_AND_SEAS = [
  // Oceans
  { id: 'pacific_n', name: 'North Pacific Ocean', lat: 35, lng: -145, status: 'polluted', desc: 'Home to the Great Pacific Garbage Patch.' },
  { id: 'pacific_s', name: 'South Pacific Ocean', lat: -30, lng: -140, status: 'moderate', desc: 'Islands under threat from rising sea levels.' },
  { id: 'atlantic_n', name: 'North Atlantic Ocean', lat: 30, lng: -40, status: 'moderate', desc: 'Major shipping routes & high microplastic concentration.' },
  { id: 'atlantic_s', name: 'South Atlantic Ocean', lat: -25, lng: -15, status: 'moderate', desc: 'Critical for deep-water current circulation.' },
  { id: 'indian', name: 'Indian Ocean', lat: -15, lng: 75, status: 'polluted', desc: 'Heavy industrial runoff from surrounding continents.' },
  { id: 'southern', name: 'Southern Ocean', lat: -62, lng: 0, status: 'clean', desc: 'Remote & pristine, experimental environment.' },
  { id: 'arctic', name: 'Arctic Ocean', lat: 82, lng: 10, status: 'clean', desc: 'Critical for climate monitoring.' },
  
  // Seas - Asia & Oceania
  { id: 'arabian_sea', name: 'Arabian Sea', lat: 14, lng: 65, status: 'polluted', desc: 'Heavy plastic influx from South Asian coastlines.' },
  { id: 'bay_bengal', name: 'Bay of Bengal', lat: 14, lng: 88, status: 'polluted', desc: 'Extreme microplastic concentration.' },
  { id: 'south_china', name: 'South China Sea', lat: 12, lng: 114, status: 'polluted', desc: 'Industrial runoff & heavy fishing traffic.' },
  { id: 'east_china', name: 'East China Sea', lat: 29, lng: 125, status: 'moderate', desc: 'Critical biodiversity zone.' },
  { id: 'sea_japan', name: 'Sea of Japan', lat: 40, lng: 135, status: 'moderate', desc: 'Unique deep-sea ecosystems.' },
  { id: 'andaman', name: 'Andaman Sea', lat: 10, lng: 96, status: 'biodiverse', desc: 'Rich coral reef systems.' },
  { id: 'laccadive', name: 'Laccadive Sea', lat: 8, lng: 74, status: 'biodiverse', desc: 'Pristine atolls & marine life.' },
  { id: 'coral_sea', name: 'Coral Sea', lat: -18, lng: 155, status: 'biodiverse', desc: 'Great Barrier Reef region.' },
  { id: 'tasman', name: 'Tasman Sea', lat: -38, lng: 163, status: 'moderate', desc: 'Deep pelagic corridor.' },
  { id: 'philippine_sea', name: 'Philippine Sea', lat: 18, lng: 134, status: 'biodiverse', desc: 'Deepest trenches on Earth.' },
  { id: 'java_sea', name: 'Java Sea', lat: -5, lng: 112, status: 'polluted', desc: 'High plastic discharge from river outlets.' },
  { id: 'banda_sea', name: 'Banda Sea', lat: -5, lng: 128, status: 'biodiverse', desc: 'Rich marine biodiversity.' },
  
  // Seas - Europe & Middle East
  { id: 'mediterranean', name: 'Mediterranean Sea', lat: 35, lng: 18, status: 'polluted', desc: 'Almost closed system, high plastic accumulation.' },
  { id: 'north_sea', name: 'North Sea', lat: 56, lng: 3, status: 'moderate', desc: 'Heavy shipping & oil rig activity.' },
  { id: 'baltic', name: 'Baltic Sea', lat: 59, lng: 20, status: 'polluted', desc: 'Severe eutrophication & dead zones.' },
  { id: 'black_sea', name: 'Black Sea', lat: 43, lng: 35, status: 'polluted', desc: 'Anoxic deep waters.' },
  { id: 'caspian', name: 'Caspian Sea', lat: 42, lng: 51, status: 'polluted', desc: 'Oil pollution & declining water levels.' },
  { id: 'red_sea', name: 'Red Sea', lat: 21, lng: 38, status: 'biodiverse', desc: 'Thermally resilient corals.' },
  { id: 'adriatic', name: 'Adriatic Sea', lat: 43, lng: 15, status: 'polluted', desc: 'Tourism-related plastic waste.' },
  { id: 'aegean', name: 'Aegean Sea', lat: 38, lng: 25, status: 'moderate', desc: 'Rich historical and biological value.' },
  
  // Americas
  { id: 'caribbean', name: 'Caribbean Sea', lat: 15, lng: -75, status: 'biodiverse', desc: 'Coral reef biodiversity hotspot.' },
  { id: 'gulf_mexico', name: 'Gulf of Mexico', lat: 25, lng: -90, status: 'polluted', desc: 'Runoff from Mississippi River.' },
  { id: 'sargasso', name: 'Sargasso Sea', lat: 30, lng: -60, status: 'biodiverse', desc: 'Unique lens of clear water.' },
  { id: 'bering', name: 'Bering Sea', lat: 58, lng: -175, status: 'moderate', desc: 'Rich subarctic fishery.' },
  { id: 'hudson_bay', name: 'Hudson Bay', lat: 60, lng: -85, status: 'clean', desc: 'Arctic ecosystems under climate stress.' },
  { id: 'sea_cortez', name: 'Sea of Cortez', lat: 26, lng: -110, status: 'biodiverse', desc: 'The "World\'s Aquarium".' },
  { id: 'labrador_sea', name: 'Labrador Sea', lat: 56, lng: -52, status: 'clean', desc: 'Key site for deep water formation.' },
  
  // Major Rivers (Mouths/Hotspots)
  { id: 'amazon_river', name: 'Amazon River Delta', lat: 0, lng: -48, status: 'moderate', desc: 'Massive freshwater influx to the Atlantic.' },
  { id: 'nile_river', name: 'Nile River Delta', lat: 31, lng: 31, status: 'polluted', desc: 'Heavy agricultural and urban runoff.' },
  { id: 'yangtze_river', name: 'Yangtze River Delta', lat: 31, lng: 121, status: 'polluted', desc: 'World\'s highest plastic emitting river.' },
  { id: 'mississippi_river', name: 'Mississippi River Delta', lat: 29, lng: -89, status: 'polluted', desc: 'Cause of massive dead zones in Gulf of Mexico.' },
  { id: 'ganges_river', name: 'Ganges-Brahmaputra Delta', lat: 22, lng: 90, status: 'polluted', desc: 'Intense microplastic and industrial waste.' },
  { id: 'mekong_river', name: 'Mekong River Delta', lat: 10, lng: 106, status: 'polluted', desc: 'Critical for regional food security.' },
  { id: 'danube_river', name: 'Danube River Mouth', lat: 45, lng: 29, status: 'moderate', desc: 'Bridges multiple nations and industries.' },
  { id: 'volga_river', name: 'Volga River Delta', lat: 46, lng: 48, status: 'polluted', desc: 'Major contributor to Caspian Sea pollution.' },
  { id: 'murray_river', name: 'Murray River Mouth', lat: -35, lng: 138, status: 'moderate', desc: 'Crucial for Southern Australian biodiversity.' },
  { id: 'niger_river', name: 'Niger River Delta', lat: 4, lng: 6, status: 'polluted', desc: 'Oil and plastic pollution hotspot.' }
];

const getMarkerIcon = (status, index) => {
  let color = "#00E5FF";
  let className = "pulse-marker-clean";
  
  if (status === "polluted") {
    color = "#FF4757";
    className = "pulse-marker-polluted";
  } else if (status === "moderate") {
    color = "#FFB347";
    className = "pulse-marker-moderate";
  } else if (status === "biodiverse") {
    color = "#2EE5B0";
    className = "pulse-marker-biodiverse";
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

function MapController({ selectedCoords }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 4, { duration: 1.2 });
    }
  }, [selectedCoords, map]);
  return null;
}

/* ─── Ocean Detail Panel ─────────────────────────────────────────── */
function OceanDetailPanel({ ocean, onClose }) {
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
          content: `Provide accurate marine environmental data for "${ocean.name}" as JSON. Include:
          obp_tonnes_year (number), biodiversity_index (0-100), species_threatened (number), threatened_species_list (array of 5 names), surface_temp_c (number), avg_wind_knots (number), o2_pct (number), plastic_density_km2 (number), coral_health ("Poor" to "Excellent"), top_pollutant (string), shipping_density ("Heavy" to "Sparse"), dead_zones (number), carbon_absorption_gt (number), microplastic_index (0-10), initiatives_count (number), ph_baseline (number), ph_current (number), ai_long_insight (string 3 sentences).
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
  }, [ocean.id]);


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
          <h2>{ocean.name}</h2>
          <span className={`status-badge ${ocean.status}`}>{ocean.status} zone</span>
        </div>
        <button onClick={onClose} className="sidebar-close"><TbX /></button>
      </div>

      <div className="sidebar-scrollable">
        {loading ? (
          <div className="sidebar-loading">
            <TbLoader2 className="spinner" />
            <p>Scanning Marine Channels...</p>
          </div>
        ) : data ? (
          <div className="metrics-grid">
            <div className="metric-card">
              <TbRecycle className="m-icon" />
              <div className="m-info">
                <span className="m-label">OBP (t/yr)</span>
                <span className="m-value">{Number(data.obp_tonnes_year).toLocaleString()}</span>
              </div>
            </div>
            <div className="metric-card">
              <TbFish className="m-icon" />
              <div className="m-info">
                <span className="m-label">Biodiversity</span>
                <span className="m-value">{data.biodiversity_index}/100</span>
              </div>
            </div>
            <div 
              className="metric-card threatened"
              onMouseEnter={() => setShowThreatenedList(true)}
              onMouseLeave={() => setShowThreatenedList(false)}
            >
              <TbAlertTriangle className="m-icon" />
              <div className="m-info">
                <span className="m-label">Threatened</span>
                <span className="m-value">{data.species_threatened}</span>
              </div>
              <AnimatePresence>
                {showThreatenedList && data.threatened_species_list && (
                  <motion.div 
                    className="species-list-overlay"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <div className="species-list-header">Threatened Species</div>
                    <ul>
                      {data.threatened_species_list.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="metric-card">
              <TbThermometer className="m-icon" />
              <div className="m-info">
                <span className="m-label">Temp</span>
                <span className="m-value">{data.surface_temp_c}°C</span>
              </div>
            </div>
            <div className="metric-card">
              <TbWind className="m-icon" />
              <div className="m-info">
                <span className="m-label">Wind</span>
                <span className="m-value">{data.avg_wind_knots} kt</span>
              </div>
            </div>
            <div className="metric-card">
              <TbDroplet className="m-icon" />
              <div className="m-info">
                <span className="m-label">Dissolved O₂</span>
                <span className="m-value">{data.o2_pct}%</span>
              </div>
            </div>
            <div className="metric-card full">
              <div className="m-info">
                <span className="m-label">Plastic Density (pcs/km²)</span>
                <span className="m-value highlight">{data.plastic_density_km2}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="m-info">
                <span className="m-label">Coral Health</span>
                <span className="m-badge">{data.coral_health}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="m-info">
                <span className="m-label">Shipping</span>
                <span className="m-value">{data.shipping_density}</span>
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
            <div className="metric-card full">
              <div className="m-info">
                <span className="m-label">Acidification (Current vs 1980)</span>
                <div className="ph-comparison">
                  <div className="ph-dot">8.12 <span>1980</span></div>
                  <div className="ph-line"></div>
                  <div className="ph-dot active">{data.ph_current} <span>Now</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="error-text">Failed to connect to marine uplink.</p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Map Component ─────────────────────────────────────────── */
export default function MapSection() {
  const [selectedOcean, setSelectedOcean] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    return OCEANS_AND_SEAS.filter(o => {
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
            placeholder="Search ocean channels..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="map-filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={`polluted ${filter === 'polluted' ? 'active' : ''}`} onClick={() => setFilter('polluted')}>Polluted</button>
          <button className={`moderate ${filter === 'moderate' ? 'active' : ''}`} onClick={() => setFilter('moderate')}>High Traffic</button>
          <button className={`biodiverse ${filter === 'biodiverse' ? 'active' : ''}`} onClick={() => setFilter('biodiverse')}>Biodiverse</button>
        </div>
      </div>

      <div className="map-frame">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxBounds={[[-85, -180], [85, 180]]}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          className="leaflet-integrated-container"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
            noWrap={true}
          />
          <MapController selectedCoords={selectedOcean?.lat ? [selectedOcean.lat, selectedOcean.lng] : null} />
          
          {filteredData.map((ocean, idx) => (
            <Marker 
              key={ocean.id}
              position={[ocean.lat, ocean.lng]}
              icon={getMarkerIcon(ocean.status, idx)}
              eventHandlers={{ click: () => setSelectedOcean(ocean) }}
            >
              <Tooltip direction="top" className="map-integrated-tooltip" opacity={1}>
                <strong>{ocean.name}</strong>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        <AnimatePresence>
          {selectedOcean && (
            <OceanDetailPanel 
              ocean={selectedOcean} 
              onClose={() => setSelectedOcean(null)} 
            />
          )}
        </AnimatePresence>
      </div>

      <div className="map-footer-note">
        <TbRipple /> 📡 Select a sector to engage deep-sea telemetry sensors
      </div>
    </div>
  );
}
