import { useRef, useEffect, useState } from 'react';
import './LocalFactsCarousel.css';

const GET_FACTS = (loc) => [
  { img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&q=80', title: `BBMP Dry Waste Centres`, body: `${loc}'s local Dry Waste Collection Centre has diverted 2,500 tonnes of plastic this year.`, color: 'var(--eco-500)' },
  { img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80', title: `E-Waste Tracking`, body: `KSPCB initiates digitized tracking for toxic electronic waste in the ${loc} industrial sector.`, color: 'var(--eco-600)' },
  { img: 'https://images.unsplash.com/photo-1611284446314-60a58a7dd514?w=500&q=80', title: `Community Composting`, body: `Citizen initiatives in ${loc} are converting 50% of wet waste into organic fertilizer.`, color: 'var(--eco-500)' },
  { img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=80', title: `Circular Economy Hubs`, body: `New material recovery facilities in ${loc} are processing multi-layer plastics for construction.`, color: 'var(--eco-600)' },
  { img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80', title: `Civic Cleanups`, body: `Weekend plogging drives in ${loc} have significantly reduced roadside littering!`, color: 'var(--eco-400)' }
];

export default function LocalFactsCarousel({ location }) {
  const [isHovered, setIsHovered] = useState(false);

  // Parse location to a shorter format if possible
  let shortLocation = location?.includes(',') ? location.split(',')[1].trim() : (location?.split(' ')[0] || 'Your Region');
  if (shortLocation.toLowerCase() === 'local') {
    shortLocation = 'Your City';
  }
  const facts = GET_FACTS(shortLocation);

  return (
    <div 
      className="local-facts" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="local-facts__track">
        {/* Double/Triple the facts for seamless looping across any screen size */}
        {[...facts, ...facts, ...facts].map((f, i) => (
          <div key={i} className="local-fact-card">
            <div className="local-fact-card__img-wrap">
              <img src={f.img} alt={f.title} className="local-fact-card__img" loading="lazy" />
            </div>
            <div className="local-fact-card__content">
              <h3 className="local-fact-card__title">{f.title}</h3>
              <p className="local-fact-card__body">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
