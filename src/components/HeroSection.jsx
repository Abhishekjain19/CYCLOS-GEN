import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TbArrowRight, TbLeaf, TbChevronLeft, TbChevronRight } from 'react-icons/tb';
import './HeroSection.css';

const NEWS_CARDS = [
  {
    id: 0,
    tag: 'MARINE CRISIS',
    title: "8 million tonnes of plastic enter oceans every year — India's coastline at breaking point.",
    excerpt: "A new UNEP report reveals that India's 7,500 km coastline is among the worst affected by marine plastic pollution, with Mumbai, Chennai, and Kochi identified as critical hotspots. MORE",
    img: '/marine_news1.png',
    date: 'Mar 28, 2026',
  },
  {
    id: 1,
    tag: 'OCEAN ALERT',
    title: "Sea turtles found with plastic in 100% of sampled populations off Indian coast.",
    excerpt: "Marine biologists from NIO Goa confirm that every sea turtle sampled in a 2026 study had ingested microplastics, threatening the survival of critically endangered species. MORE",
    img: '/marine_news2.png',
    date: 'Mar 25, 2026',
  },
  {
    id: 2,
    tag: 'COASTAL CRISIS',
    title: "Ghost fishing nets blanket 40 km of Kerala shoreline — marine life suffocating.",
    excerpt: "Abandoned fishing gear, or 'ghost nets,' now cover vast stretches of Kerala's coast, trapping dolphins, turtles, and fish in lethal underwater tangles. MORE",
    img: '/marine_news3.png',
    date: 'Mar 20, 2026',
  },
  {
    id: 3,
    tag: 'ACTION',
    title: "India's largest coastal cleanup drive removes 12,000 tonnes of marine debris.",
    excerpt: "Over 50,000 volunteers across 13 coastal states participated in the 2026 Ocean Swachh Abhiyan, recovering tonnes of plastic, rubber, and industrial waste from beaches. MORE",
    img: '/marine_news4.png',
    date: 'Mar 15, 2026',
  },
  {
    id: 4,
    tag: 'DEEP SEA',
    title: "Microplastics detected at 7,000 m depth in the Bay of Bengal — deepest ever in Indian waters.",
    excerpt: "Scientists from INCOIS Hyderabad discover microplastic contamination in deep-sea sediments, raising alarms about the full extent of ocean pollution beyond surface-level waste. MORE",
    img: '/marine_news1.png',
    date: 'Mar 10, 2026',
  },
];

function NewsCarousel() {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const total = NEWS_CARDS.length;

  const prev = () => setActive((a) => (a - 1 + total) % total);
  const next = () => setActive((a) => (a + 1) % total);

  useEffect(() => {
    if (isHovered || expanded !== null) return;
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % total);
    }, 3500);
    return () => clearInterval(timer);
  }, [isHovered, expanded, total]);

  return (
    <div
      className="news-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="news-carousel__viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="news-card"
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setExpanded(active)}
          >
            <img src={NEWS_CARDS[active].img} alt={NEWS_CARDS[active].title} className="news-card__img" />
            <div className="news-card__overlay" />
            <div className="news-card__content">
              <span className="news-card__tag">{NEWS_CARDS[active].tag}</span>
              <h3 className="news-card__title">"{NEWS_CARDS[active].title}"</h3>
              <p className="news-card__date">{NEWS_CARDS[active].date}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Side peek cards */}
        <div className="news-carousel__peek news-carousel__peek--left" onClick={prev}>
          <img src={NEWS_CARDS[(active - 1 + total) % total].img} alt="" />
        </div>
        <div className="news-carousel__peek news-carousel__peek--right" onClick={next}>
          <img src={NEWS_CARDS[(active + 1) % total].img} alt="" />
        </div>

        {/* Arrow buttons */}
        <button className="news-carousel__arrow news-carousel__arrow--left" onClick={prev} aria-label="Previous">
          <TbChevronLeft size={20} />
        </button>
        <button className="news-carousel__arrow news-carousel__arrow--right" onClick={next} aria-label="Next">
          <TbChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div className="news-carousel__dots">
        {NEWS_CARDS.map((_, i) => (
          <button
            key={i}
            className={`news-carousel__dot ${i === active ? 'news-carousel__dot--active' : ''}`}
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Expanded modal */}
      <AnimatePresence>
        {expanded !== null && (
          <motion.div
            className="news-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(null)}
          >
            <motion.div
              className="news-modal"
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="news-modal__close" onClick={() => setExpanded(null)} aria-label="Close">✕</button>
              <img src={NEWS_CARDS[expanded].img} alt={NEWS_CARDS[expanded].title} className="news-modal__img" />
              <div className="news-modal__body">
                <span className="news-card__tag">{NEWS_CARDS[expanded].tag}</span>
                <h2 className="news-modal__title">{NEWS_CARDS[expanded].title}</h2>
                <p className="news-modal__excerpt">{NEWS_CARDS[expanded].excerpt}</p>
                <p className="news-modal__date">{NEWS_CARDS[expanded].date}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="hero">
      {/* Forest background */}
      <div className="hero__bg" />
      <div className="hero__bg-overlay" />

      <div className="container hero__body">
        {/* Left — text */}
        <div className="hero__left">
          <motion.div
            className="hero__badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <TbLeaf size={14} />
            <span>Circular Economy Platform · 2026</span>
          </motion.div>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            Turn Waste Into
            <br />
            <span className="hero__title-accent">Circular Value</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Cyclos connects waste producers with recyclers - building a
            sustainable marketplace where your waste becomes someone's
            resource, and vice versa.
          </motion.p>

          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
          >
            <Link to="/signup" className="hero__cta-btn">
              Start Your Journey <TbArrowRight size={18} />
            </Link>
            <a href="#what-we-do" className="hero__ghost-btn">See How It Works</a>
          </motion.div>
        </div>

        {/* Right — news carousel */}
        <motion.div
          className="hero__right"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero__carousel-label">
            <span className="hero__carousel-dot" />
            Marine Waste Events
          </div>
          <NewsCarousel />
        </motion.div>
      </div>

      {/* Bottom wave separator */}
      <div className="hero__wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#0E2425" />
        </svg>
      </div>
    </section>
  );
}
