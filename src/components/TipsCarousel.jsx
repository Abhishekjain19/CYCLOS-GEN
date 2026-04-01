import { useRef, useEffect } from 'react';
import './TipsCarousel.css';

const TIPS = [
  { emoji: '♻️', title: 'Segregate at Source', body: 'Separate wet, dry, and hazardous waste at home. This is the #1 step in waste management.' },
  { emoji: '🧴', title: 'Rinse Before Recycling', body: 'Always rinse plastic and glass containers before placing them in recycling bins to avoid contamination.' },
  { emoji: '🌱', title: 'Start Composting', body: 'Kitchen organic waste can be composted into rich fertilizer. Even a small indoor compost bin makes a difference.' },
  { emoji: '📦', title: 'Reduce Packaging Waste', body: 'Choose products with minimal packaging. Reusable bags & containers save thousands of plastic pieces annually.' },
  { emoji: '💡', title: 'E-Waste Awareness', body: 'Never throw electronics in regular trash. E-waste contains toxic metals. Use certified collection centers.' },
  { emoji: '🔥', title: 'Say No to Burning', body: 'Open burning of waste releases toxic gases and PM2.5 particles. Use authorized waste collection services instead.' },
  { emoji: '💧', title: 'Liquid Waste First', body: 'Drain all liquids before disposing containers. Liquid contamination ruins entire batches of recyclables.' },
  { emoji: '🌊', title: 'Microplastics Crisis', body: 'Over 8 million tonnes of plastic enter oceans yearly. Choose biodegradable alternatives wherever possible.' },
  { emoji: '📊', title: 'Track Your Impact', body: 'Use Cyclos dashboard to monitor your carbon footprint, recycling score, and eco points earned over time.' },
  { emoji: '🤝', title: 'Build Circular Chains', body: 'Connect with local businesses to form closed-loop systems where one\'s waste is another\'s raw material.' },
];

export default function TipsCarousel() {
  const tickerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    const clone = ticker.innerHTML;
    ticker.innerHTML = clone + clone;

    const totalWidth = ticker.scrollWidth / 2;
    let pos = 0;
    let raf;

    const animate = () => {
      pos -= 0.4;
      if (Math.abs(pos) >= totalWidth) pos = 0;
      ticker.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const el = wrapRef.current;
    if (el) {
      el.addEventListener('mouseenter', () => cancelAnimationFrame(raf));
      el.addEventListener('mouseleave', () => { raf = requestAnimationFrame(animate); });
    }

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="tips-carousel" ref={wrapRef}>
      <div className="tips-carousel__track">
        <div className="tips-carousel__ticker" ref={tickerRef}>
          {TIPS.map((t, i) => (
            <div key={i} className="tip-card">
              <div className="tip-card__emoji">{t.emoji}</div>
              <h3 className="tip-card__title">{t.title}</h3>
              <p className="tip-card__body">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
