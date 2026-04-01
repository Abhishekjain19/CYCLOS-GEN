import { useRef, useEffect, useState } from 'react';
import './LocalFactsCarousel.css';

// Import local high-fidelity assets
import coastalCleanupImg from '../assets/facts/coastal_cleanup.png';
import microplasticsImg from '../assets/facts/microplastics.png';
import coralRestorationImg from '../assets/facts/coral_restoration.png';
import ghostNetImg from '../assets/facts/ghost_net_recovery.png';
import wildlifeImg from '../assets/facts/dolphin_sighting.png';

const GET_FACTS = (loc) => [
  { img: coastalCleanupImg, title: `${loc} Coastal Cleanup`, body: `Recent data shows ${loc} has recovered over 2,500 lbs of ocean-bound plastic this year alone.`, color: '#0ea5e9' },
  { img: microplasticsImg, title: `Microplastics Alert`, body: `Samples in the ${loc} district reveal 30% less microplastics than the national average! Great work.`, color: '#0369a1' },
  { img: coralRestorationImg, title: `Coral Restoration`, body: `New ${loc} marine initiatives are replanting 500+ coral fragments to restore the local reef ecosystem.`, color: '#0284c7' },
  { img: ghostNetImg, title: `Ghost Net Recovery`, body: `Local divers in ${loc} successfully removed 4 major commercial fishing nets, saving countless sea turtles.`, color: '#0284c7' },
  { img: wildlifeImg, title: 'Wildlife Sightings', body: `Proper waste sorting directly impacts the marine cleanliness of ${loc}, leading to increased dolphin sightings!`, color: '#38bdf8' }
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
