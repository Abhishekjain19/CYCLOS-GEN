import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  TbRecycle, TbFish, TbAlertTriangle, TbThermometer, TbWind, 
  TbDroplet, TbTrash, TbCircleCheck, TbBuildingSkyscraper, 
  TbActivity, TbLeaf, TbMicroscope, TbGlobe, TbHistory, 
  TbSparkles, TbSearch, TbFilter, TbX, TbChevronRight
} from 'react-icons/tb';
import './MapPage.css';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OCEAN_DATA = [
  {
    id: 1,
    name: "Great Pacific Garbage Patch",
    coords: [35, -145],
    status: "polluted",
    metrics: {
      obp: "80,000",
      biodiversity: 24,
      threatened_species: 1420,
      temp: 22.4,
      wind: 12,
      o2: 82,
      plastic_density: 45000,
      coral_health: "Poor",
      top_pollutant: "Microplastics & Nets",
      shipping_density: "Moderate",
      dead_zones: 12,
      carbon_absorption: 2.1,
      microplastic_index: 9.8,
      initiatives: 4,
      ph_level: { current: 8.01, baseline: 8.12 },
      ai_insight: "The concentration of plastic in this region has reached a critical threshold, disrupting microbial ecosystems and carbon sequestration rates."
    }
  },
  {
    id: 2,
    name: "North Atlantic Gyre",
    coords: [30, -40],
    status: "moderate",
    metrics: {
      obp: "45,000",
      biodiversity: 48,
      threatened_species: 890,
      temp: 18.2,
      wind: 18,
      o2: 91,
      plastic_density: 12000,
      coral_health: "Fair",
      top_pollutant: "Shipping Waste",
      shipping_density: "Heavy",
      dead_zones: 5,
      carbon_absorption: 3.4,
      microplastic_index: 6.4,
      initiatives: 8,
      ph_level: { current: 8.06, baseline: 8.11 },
      ai_insight: "Heavy shipping traffic in this sector is the primary contributor to acoustic pollution and waste discharge."
    }
  },
  {
    id: 3,
    name: "Challenger Deep Region",
    coords: [11.3, 142.2],
    status: "biodiverse",
    metrics: {
      obp: "1,200",
      biodiversity: 92,
      threatened_species: 45,
      temp: 4.1,
      wind: 8,
      o2: 98,
      plastic_density: 150,
      coral_health: "Excellent",
      top_pollutant: "Deep-sea debris",
      shipping_density: "Sparse",
      dead_zones: 0,
      carbon_absorption: 1.2,
      microplastic_index: 1.2,
      initiatives: 12,
      ph_level: { current: 8.12, baseline: 8.14 },
      ai_insight: "One of the last pristine deep-sea habitats. Low bacterial activity means any pollutants introduced here persist for centuries."
    }
  },
  {
    id: 4,
    name: "Coral Triangle",
    coords: [-2, 125],
    status: "biodiverse",
    metrics: {
      obp: "12,000",
      biodiversity: 98,
      threatened_species: 2100,
      temp: 29.5,
      wind: 5,
      o2: 94,
      plastic_density: 3200,
      coral_health: "Excellent",
      top_pollutant: "Single-use plastic",
      shipping_density: "Moderate",
      dead_zones: 2,
      carbon_absorption: 4.2,
      microplastic_index: 3.1,
      initiatives: 25,
      ph_level: { current: 8.04, baseline: 8.13 },
      ai_insight: "The world's epicenter of marine biodiversity. Rising temperatures pose a 90% risk of bleaching if current trends continue through 2030."
    }
  },
  {
    id: 5,
    name: "Southern Ocean (Antarctic)",
    coords: [-65, 90],
    status: "clean",
    metrics: {
      obp: "400",
      biodiversity: 65,
      threatened_species: 120,
      temp: -1.2,
      wind: 35,
      o2: 99,
      plastic_density: 45,
      coral_health: "N/A",
      top_pollutant: "Atmospheric fallout",
      shipping_density: "Very Sparse",
      dead_zones: 0,
      carbon_absorption: 8.5,
      microplastic_index: 0.8,
      initiatives: 15,
      ph_level: { current: 8.09, baseline: 8.12 },
      ai_insight: "Crucial carbon sink. Cold waters absorb more CO2, but are also Acidifying faster than tropical regions."
    }
  },
  {
    id: 6,
    name: "Mediterranean Sea",
    coords: [35, 18],
    status: "polluted",
    metrics: {
      obp: "62,000",
      biodiversity: 55,
      threatened_species: 1100,
      temp: 21.8,
      wind: 10,
      o2: 85,
      plastic_density: 38000,
      coral_health: "Poor",
      top_pollutant: "Land-based runoff",
      shipping_density: "Heavy",
      dead_zones: 8,
      carbon_absorption: 1.5,
      microplastic_index: 8.9,
      initiatives: 18,
      ph_level: { current: 8.02, baseline: 8.10 },
      ai_insight: "Closed system with slow water exchange. Pollutants accumulate 5x faster than in open ocean basins."
    }
  }
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
      <div class="marker-container ${className}" style="animation-delay: ${index * 150}ms">
        <div class="marker-core" style="background: ${color}"></div>
        <div class="marker-ring" style="border-color: ${color}"></div>
        <div class="marker-glow" style="background: radial-gradient(circle, ${color}33 0%, transparent 70%)"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const MapController = ({ selectedCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 5, { duration: 1.5 });
    }
  }, [selectedCoords, map]);
  return null;
};

export default function MapPage() {
  const [selectedOcean, setSelectedOcean] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [aiInsight, setAiInsight] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const filteredOceans = useMemo(() => {
    return OCEAN_DATA.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "all" || 
                            (filter === "polluted" && o.status === "polluted") ||
                            (filter === "moderate" && o.status === "moderate") ||
                            (filter === "biodiverse" && (o.status === "biodiverse" || o.status === "clean"));
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter]);

  const handleOceanClick = (ocean) => {
    setSelectedOcean(ocean);
    setIsSidebarOpen(true);
    setAiInsight("");
    setIsStreaming(false);
  };

  useEffect(() => {
    let interval;
    if (isStreaming && selectedOcean) {
      setAiInsight("");
      const text = selectedOcean.metrics.ai_insight;
      let i = 0;
      interval = setInterval(() => {
        setAiInsight(prev => prev + text.charAt(i));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setIsStreaming(false);
        }
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isStreaming, selectedOcean]);

  const triggerAIInsight = () => {
    setIsStreaming(true);
  };

  return (
    <div className="ocean-map-page">
      {/* Background Noise & Waves */}
      <div className="map-overlay-noise"></div>
      <div className="map-overlay-waves">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M0,500 C250,450 250,550 500,500 C750,450 750,550 1000,500" stroke="rgba(0, 229, 255, 0.05)" fill="transparent" strokeWidth="2">
            <animate attributeName="d" values="M0,500 C250,450 250,550 500,500 C750,450 750,550 1000,500; M0,500 C250,550 250,450 500,500 C750,550 750,450 1000,500; M0,500 C250,450 250,550 500,500" dur="10s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>

      {/* Header UI */}
      <div className="map-header">
        <div className="search-pill">
          <TbSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search oceans, gyres, reefs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <TbX className="clear-search" onClick={() => setSearchQuery("")} />}
        </div>

        <div className="legend-pills">
          <button 
            className={`legend-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Zones
          </button>
          <button 
            className={`legend-pill polluted ${filter === 'polluted' ? 'active' : ''}`}
            onClick={() => setFilter('polluted')}
          >
            <span className="dot"></span> Most Polluted
          </button>
          <button 
            className={`legend-pill moderate ${filter === 'moderate' ? 'active' : ''}`}
            onClick={() => setFilter('moderate')}
          >
            <span className="dot"></span> High Traffic
          </button>
          <button 
            className={`legend-pill biodiverse ${filter === 'biodiverse' ? 'active' : ''}`}
            onClick={() => setFilter('biodiverse')}
          >
            <span className="dot"></span> Clean / Biodiverse
          </button>
        </div>
      </div>

      <MapContainer 
        center={[20, 0]} 
        zoom={3} 
        scrollWheelZoom={true} 
        className="map-main-container"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController selectedCoords={selectedOcean?.coords} />
        
        {filteredOceans.map((ocean, idx) => (
          <Marker 
            key={ocean.id} 
            position={ocean.coords} 
            icon={getMarkerIcon(ocean.status, idx)}
            eventHandlers={{
              click: () => handleOceanClick(ocean)
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className="ocean-tooltip">
              <div className="tooltip-content">
                <strong>{ocean.name}</strong>
                <span>Biodiversity: {ocean.metrics.biodiversity}/100</span>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Sidebar Panel */}
      <div className={`sidebar-panel ${isSidebarOpen ? 'open' : ''}`}>
        {selectedOcean && (
          <>
            <div className="sidebar-header sticky">
              <div className="header-top">
                <h2>{selectedOcean.name}</h2>
                <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
                  <TbX />
                </button>
              </div>
              <div className={`status-badge ${selectedOcean.status}`}>
                {selectedOcean.status.charAt(0).toUpperCase() + selectedOcean.status.slice(1)} Zone
              </div>
            </div>

            <div className="sidebar-content">
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon"><TbRecycle /></div>
                  <div className="metric-info">
                    <span className="label">OBP (tonnes/yr)</span>
                    <span className="value">{selectedOcean.metrics.obp}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbFish /></div>
                  <div className="metric-info">
                    <span className="label">Biodiversity</span>
                    <div className="gauge-container">
                      <div className="gauge-fill" style={{ width: `${selectedOcean.metrics.biodiversity}%` }}></div>
                    </div>
                    <span className="value">{selectedOcean.metrics.biodiversity}/100</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbAlertTriangle /></div>
                  <div className="metric-info">
                    <span className="label">Threatened Species</span>
                    <span className="value">{selectedOcean.metrics.threatened_species}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbThermometer /></div>
                  <div className="metric-info">
                    <span className="label">Surface Temp</span>
                    <span className={`value temp-${selectedOcean.metrics.temp > 20 ? 'warm' : 'cool'}`}>
                      {selectedOcean.metrics.temp}°C
                    </span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbWind /></div>
                  <div className="metric-info">
                    <span className="label">Avg Wind Speed</span>
                    <span className="value">{selectedOcean.metrics.wind} knots</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbDroplet /></div>
                  <div className="metric-info">
                    <span className="label">Dissolved O2</span>
                    <span className="value">{selectedOcean.metrics.o2}%</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-info">
                    <span className="label">Plastic Density (pcs/km²)</span>
                    <span className="value">{selectedOcean.metrics.plastic_density}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-info">
                    <span className="label">Coral Reef Health</span>
                    <span className={`badge health-${selectedOcean.metrics.coral_health.toLowerCase()}`}>
                      {selectedOcean.metrics.coral_health}
                    </span>
                  </div>
                </div>

                <div className="metric-card full">
                  <div className="metric-info">
                    <span className="label">Top Pollutant</span>
                    <span className="value highlight">{selectedOcean.metrics.top_pollutant}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbBuildingSkyscraper /></div>
                  <div className="metric-info">
                    <span className="label">Shipping Lanes</span>
                    <span className="value">{selectedOcean.metrics.shipping_density}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbActivity /></div>
                  <div className="metric-info">
                    <span className="label">Dead Zones</span>
                    <span className="value">{selectedOcean.metrics.dead_zones}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbLeaf /></div>
                  <div className="metric-info">
                    <span className="label">Carbon Absorption</span>
                    <span className="value">{selectedOcean.metrics.carbon_absorption} Gt</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbMicroscope /></div>
                  <div className="metric-info">
                    <span className="label">Microplastic Index</span>
                    <span className="value">{selectedOcean.metrics.microplastic_index}/10</span>
                  </div>
                </div>

                <div className="metric-card full primary">
                  <div className="metric-info">
                    <span className="label">Conservation Initiatives</span>
                    <div className="flex-row">
                      <span className="value">{selectedOcean.metrics.initiatives} Active</span>
                      <button className="ghost-btn">Learn More <TbChevronRight /></button>
                    </div>
                  </div>
                </div>

                <div className="metric-card full">
                  <div className="metric-info">
                    <span className="label">Acidification pH (Current vs 1980)</span>
                    <div className="ph-strip">
                      <div className="ph-item">
                        <span className="ph-label">1980</span>
                        <span className="ph-val">{selectedOcean.metrics.ph_level.baseline}</span>
                      </div>
                      <div className="ph-progress-container">
                        <div className="ph-progress" style={{ width: '60%' }}></div>
                      </div>
                      <div className="ph-item active">
                        <span className="ph-label">NOW</span>
                        <span className="ph-val">{selectedOcean.metrics.ph_level.current}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ai-insight-section">
                <button 
                  className="ai-insight-btn" 
                  onClick={triggerAIInsight}
                  disabled={isStreaming}
                >
                  <TbSparkles /> {isStreaming ? "Analyzing..." : "Generate AI Insight"}
                </button>
                
                {(aiInsight || isStreaming) && (
                  <div className="ai-insight-card">
                    <p>{aiInsight}</p>
                    {isStreaming && <span className="streaming-dot"></span>}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
