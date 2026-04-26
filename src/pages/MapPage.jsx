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

const URBAN_ECO_ZONES = [
  { id: 'ward_76', name: 'Malleswaram Ward 76', coords: [13.0031, 77.5643], status: 'eco_hub', metrics: { swm: '1,200', biodiversity: 85, threatened_species: 2, temp: 28.5, wind: 5, o2: 90, plastic_density: 150, coral_health: 'Good', top_pollutant: 'Mixed Dry Waste', shipping_density: 'High', dead_zones: 0, carbon_absorption: 1.2, microplastic_index: 2.1, initiatives: 12, ph_level: { current: 7.2, baseline: 7.0 }, ai_insight: 'High citizen participation and active dry waste collection centers.' } },
  { id: 'ward_150', name: 'Bellandur Ward 150', coords: [12.9304, 77.6784], status: 'critical_waste', metrics: { swm: '8,500', biodiversity: 30, threatened_species: 15, temp: 29.1, wind: 8, o2: 60, plastic_density: 4500, coral_health: 'Poor', top_pollutant: 'E-Waste & Plastics', shipping_density: 'High', dead_zones: 3, carbon_absorption: 0.5, microplastic_index: 8.5, initiatives: 4, ph_level: { current: 6.5, baseline: 7.0 }, ai_insight: 'Frequent illegal dumping and low collection efficiency in commercial sectors.' } },
  { id: 'ward_174', name: 'HSR Layout Ward 174', coords: [12.9121, 77.6446], status: 'moderate', metrics: { swm: '4,200', biodiversity: 65, threatened_species: 5, temp: 28.8, wind: 6, o2: 75, plastic_density: 1200, coral_health: 'Fair', top_pollutant: 'Organic Waste', shipping_density: 'Medium', dead_zones: 1, carbon_absorption: 2.1, microplastic_index: 4.5, initiatives: 8, ph_level: { current: 6.8, baseline: 7.0 }, ai_insight: 'Improving segregation but high commercial waste volume remains a challenge.' } },
  { id: 'ward_111', name: 'Shantala Nagar Ward 111', coords: [12.9716, 77.5946], status: 'moderate', metrics: { swm: '5,100', biodiversity: 50, threatened_species: 8, temp: 29.5, wind: 4, o2: 70, plastic_density: 2100, coral_health: 'Fair', top_pollutant: 'Commercial Packaging', shipping_density: 'Very High', dead_zones: 0, carbon_absorption: 0.8, microplastic_index: 6.2, initiatives: 6, ph_level: { current: 6.9, baseline: 7.0 }, ai_insight: 'Central business district with heavy mixed waste generation.' } },
  { id: 'ward_168', name: 'Jayanagar Ward 168', coords: [12.9250, 77.5938], status: 'eco_hub', metrics: { swm: '900', biodiversity: 92, threatened_species: 1, temp: 28.2, wind: 5, o2: 95, plastic_density: 80, coral_health: 'Excellent', top_pollutant: 'Leaf Litter', shipping_density: 'Low', dead_zones: 0, carbon_absorption: 3.5, microplastic_index: 1.5, initiatives: 25, ph_level: { current: 7.1, baseline: 7.0 }, ai_insight: 'Model ward with extensive composting initiatives and high compliance.' } }
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
  const [selectedZone, setSelectedZone] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [aiInsight, setAiInsight] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const filteredZones = useMemo(() => {
    return URBAN_ECO_ZONES.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "all" || 
                            (filter === "critical_waste" && o.status === "critical_waste") ||
                            (filter === "moderate" && o.status === "moderate") ||
                            (filter === "eco_hub" && (o.status === "eco_hub" || o.status === "clean"));
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter]);

  const handleZoneClick = (ocean) => {
    setSelectedZone(ocean);
    setIsSidebarOpen(true);
    setAiInsight("");
    setIsStreaming(false);
  };

  useEffect(() => {
    let interval;
    if (isStreaming && selectedZone) {
      setAiInsight("");
      const text = selectedZone.metrics.ai_insight;
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
  }, [isStreaming, selectedZone]);

  const triggerAIInsight = () => {
    setIsStreaming(true);
  };

  return (
    <div className="zone-map-page">
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
            placeholder="Search wards, districts, zones..." 
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
            className={`legend-pill critical_waste ${filter === 'critical_waste' ? 'active' : ''}`}
            onClick={() => setFilter('critical_waste')}
          >
            <span className="dot"></span> Critical Waste
          </button>
          <button 
            className={`legend-pill moderate ${filter === 'moderate' ? 'active' : ''}`}
            onClick={() => setFilter('moderate')}
          >
            <span className="dot"></span> High Traffic
          </button>
          <button 
            className={`legend-pill eco_hub ${filter === 'eco_hub' ? 'active' : ''}`}
            onClick={() => setFilter('eco_hub')}
          >
            <span className="dot"></span> Eco Hubs
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
        <MapController selectedCoords={selectedZone?.coords} />
        
        {filteredZones.map((ocean, idx) => (
          <Marker 
            key={zone.id} 
            position={zone.coords} 
            icon={getMarkerIcon(zone.status, idx)}
            eventHandlers={{
              click: () => handleZoneClick(ocean)
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className="zone-tooltip">
              <div className="tooltip-content">
                <strong>{zone.name}</strong>
                <span>Biodiversity: {zone.metrics.biodiversity}/100</span>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Sidebar Panel */}
      <div className={`sidebar-panel ${isSidebarOpen ? 'open' : ''}`}>
        {selectedZone && (
          <>
            <div className="sidebar-header sticky">
              <div className="header-top">
                <h2>{selectedZone.name}</h2>
                <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
                  <TbX />
                </button>
              </div>
              <div className={`status-badge ${selectedZone.status}`}>
                {selectedZone.status.charAt(0).toUpperCase() + selectedZone.status.slice(1)} Zone
              </div>
            </div>

            <div className="sidebar-content">
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon"><TbRecycle /></div>
                  <div className="metric-info">
                    <span className="label">Waste (tonnes/yr)</span>
                    <span className="value">{selectedZone.metrics.swm}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbFish /></div>
                  <div className="metric-info">
                    <span className="label">Biodiversity</span>
                    <div className="gauge-container">
                      <div className="gauge-fill" style={{ width: `${selectedZone.metrics.biodiversity}%` }}></div>
                    </div>
                    <span className="value">{selectedZone.metrics.biodiversity}/100</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbAlertTriangle /></div>
                  <div className="metric-info">
                    <span className="label">Threatened Species</span>
                    <span className="value">{selectedZone.metrics.threatened_species}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbThermometer /></div>
                  <div className="metric-info">
                    <span className="label">Surface Temp</span>
                    <span className={`value temp-${selectedZone.metrics.temp > 20 ? 'warm' : 'cool'}`}>
                      {selectedZone.metrics.temp}°C
                    </span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbWind /></div>
                  <div className="metric-info">
                    <span className="label">Avg Wind Speed</span>
                    <span className="value">{selectedZone.metrics.wind} knots</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbDroplet /></div>
                  <div className="metric-info">
                    <span className="label">Dissolved O2</span>
                    <span className="value">{selectedZone.metrics.o2}%</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-info">
                    <span className="label">Plastic Density (pcs/km²)</span>
                    <span className="value">{selectedZone.metrics.plastic_density}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-info">
                    <span className="label">Ward Cleanliness</span>
                    <span className={`badge health-${selectedZone.metrics.coral_health.toLowerCase()}`}>
                      {selectedZone.metrics.coral_health}
                    </span>
                  </div>
                </div>

                <div className="metric-card full">
                  <div className="metric-info">
                    <span className="label">Top Pollutant</span>
                    <span className="value highlight">{selectedZone.metrics.top_pollutant}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbBuildingSkyscraper /></div>
                  <div className="metric-info">
                    <span className="label">Shipping Lanes</span>
                    <span className="value">{selectedZone.metrics.shipping_density}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbActivity /></div>
                  <div className="metric-info">
                    <span className="label">Dead Zones</span>
                    <span className="value">{selectedZone.metrics.dead_zones}</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbLeaf /></div>
                  <div className="metric-info">
                    <span className="label">Carbon Absorption</span>
                    <span className="value">{selectedZone.metrics.carbon_absorption} Gt</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon"><TbMicroscope /></div>
                  <div className="metric-info">
                    <span className="label">Microplastic Index</span>
                    <span className="value">{selectedZone.metrics.microplastic_index}/10</span>
                  </div>
                </div>

                <div className="metric-card full primary">
                  <div className="metric-info">
                    <span className="label">Conservation Initiatives</span>
                    <div className="flex-row">
                      <span className="value">{selectedZone.metrics.initiatives} Active</span>
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
                        <span className="ph-val">{selectedZone.metrics.ph_level.baseline}</span>
                      </div>
                      <div className="ph-progress-container">
                        <div className="ph-progress" style={{ width: '60%' }}></div>
                      </div>
                      <div className="ph-item active">
                        <span className="ph-label">NOW</span>
                        <span className="ph-val">{selectedZone.metrics.ph_level.current}</span>
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
