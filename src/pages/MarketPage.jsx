import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TbChevronLeft, TbShoppingCart, TbSearch,
  TbHeart, TbStarFilled, TbChevronRight, TbUpload, TbPhoto, TbCheck
} from 'react-icons/tb';
import './MarketPage.css';

/* ── Category tabs ─────────── */
const CATEGORIES = [
  { id: 'all',       emoji: '🌊', label: 'All' },
  { id: 'ornament',  emoji: '🐚', label: 'Ornaments' },
  { id: 'obp',       emoji: '♻️', label: 'OBP Plastic' },
  { id: 'fishing',   emoji: '🕸️', label: 'Nets' },
  { id: 'metals',    emoji: '🔩', label: 'Sea Metals' },
  { id: 'glass',     emoji: '🏺', label: 'Sea Glass' },
];

/* ── Product catalogue ───────────────────────────────── */
const PRODUCTS = [
  {
    id: 1, category: 'ornament',
    name: 'Ocean-Glass Pendant',
    desc: 'Hand-crafted pendant made from sea glass recovered near coastal reefs. Polished and wrapped in recycled silver wire.',
    price: '₹450',
    img: 'https://images.unsplash.com/photo-1611080277317-0b1e4da2880c?w=400&q=80',
  },
  {
    id: 2, category: 'obp',
    name: 'OBP Extruded Filament',
    desc: '3D printing filament (1.75mm) made entirely from Ocean Bound Plastic recovered off the coast. High durability for eco-printing.',
    price: '₹850/kg',
    img: 'https://images.unsplash.com/photo-1611284446314-60a58a7dd514?w=400&q=80',
  },
  {
    id: 3, category: 'fishing',
    name: 'Recycled Ghost Net Bag',
    desc: 'Durable tote bag woven from abandoned fishing nets (ghost nets) salvaged by deep-sea divers. Water-resistant and extremely tough.',
    price: '₹600',
    img: 'https://images.unsplash.com/photo-1597816045474-0402b8d0e74f?w=400&q=80',
  },
  {
    id: 4, category: 'metals',
    name: 'Recovered Hull Scrap',
    desc: 'Sorted steel from decommissioned coastal vessels. Cleaned and ready for industrial smelting. 99% iron content.',
    price: '₹45/kg',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    id: 5, category: 'glass',
    name: 'Crushed Sea Glass Aggregate',
    desc: 'Tumbled sea glass mixed for use in decorative terrazzo flooring and coastal landscaping projects.',
    price: '₹120/kg',
    img: 'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=400&q=80',
  },
  {
    id: 6, category: 'ornament',
    name: 'Driftwood Sculpture',
    desc: 'Artisanal tabletop sculpture shaped entirely from naturally smoothed ocean driftwood. Fully treated and sealed.',
    price: '₹1250',
    img: 'https://images.unsplash.com/photo-1615800098779-1be32e60cca3?w=400&q=80',
  },
];

export default function MarketPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState([]);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', price: '', desc: '' });
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const filtered = PRODUCTS.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleWish = (id) =>
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const openProduct = (p) => { setSelected(p); setQty(1); };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadData.title) return;
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setShowUpload(false);
      setUploadData({ title: '', price: '', desc: '' });
    }, 2000);
  };

  return (
    <div className="mkt-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mkt-header">
        <button className="mkt-back-btn" onClick={() => navigate(-1)}>
          <TbChevronLeft size={22} />
        </button>
        <h2 className="mkt-header__title">Ocean Market</h2>
        <div className="mkt-header__actions">
          <button className="mkt-cart-btn" onClick={() => setShowUpload(true)}>
            <TbUpload size={18} />
          </button>
          <button className="mkt-cart-btn">
            <TbShoppingCart size={20} />
          </button>
        </div>
      </div>

      {/* ── Search bar ─────────────────────────────────────── */}
      <div className="mkt-search-wrap">
        <TbSearch size={18} className="mkt-search-icon" />
        <input
          className="mkt-search"
          placeholder="Search Marine Goods"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="mkt-search-btn"><TbSearch size={16} /></button>
      </div>

      {/* ── Category chips ─────────────────────────────────── */}
      <div className="mkt-cats">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`mkt-cat${activeCategory === cat.id ? ' mkt-cat--active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="mkt-cat__icon">{cat.emoji}</span>
            <span className="mkt-cat__label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ── Product list ───────────────────────────────────── */}
      <div className="mkt-list">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              className="mkt-empty"
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No items discovered in the deep 🌊
            </motion.div>
          ) : (
            filtered.map((prod, i) => (
              <motion.div
                key={prod.id}
                className="mkt-item"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openProduct(prod)}
              >
                <div className="mkt-item__img-wrap">
                  <img src={prod.img} alt={prod.name} className="mkt-item__img" />
                </div>
                <div className="mkt-item__body">
                  <p className="mkt-item__name">{prod.name}</p>
                  <p className="mkt-item__price">{prod.price}</p>
                </div>
                <button
                  className={`mkt-item__wish${wishlist.includes(prod.id) ? ' mkt-item__wish--active' : ''}`}
                  onClick={e => { e.stopPropagation(); toggleWish(prod.id); }}
                >
                  <TbHeart size={16} />
                </button>
                <TbChevronRight size={16} className="mkt-item__arrow" />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Upload Sheet ───────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="mkt-upload"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            <div className="mkt-upload__header">
              <button className="mkt-upload__close" onClick={() => setShowUpload(false)}>
                <TbChevronLeft size={22} /> Back
              </button>
              <h3 className="mkt-upload__title">Sell Item</h3>
              <div style={{width: '60px'}}></div>
            </div>

            {uploadSuccess ? (
              <div className="mkt-upload__success">
                <div className="mkt-upload__success-icon"><TbCheck size={40} /></div>
                <h3>Listed Successfully</h3>
                <p>Your item is now live on the Ocean Market.</p>
              </div>
            ) : (
              <form className="mkt-upload__form" onSubmit={handleUploadSubmit}>
                <div className="mkt-upload__photo-btn">
                  <TbPhoto size={24} /> Add Product Photo
                </div>
                
                <div className="mkt-upload__field">
                  <label>Product Title</label>
                  <input required type="text" placeholder="e.g. Recycled Net Bag" value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} />
                </div>

                <div className="mkt-upload__field">
                  <label>Price (₹)</label>
                  <input required type="text" placeholder="e.g. 500/kg" value={uploadData.price} onChange={e => setUploadData({...uploadData, price: e.target.value})} />
                </div>

                <div className="mkt-upload__field">
                  <label>Description</label>
                  <textarea rows={4} placeholder="Tell the buyer about this recycled product..." value={uploadData.desc} onChange={e => setUploadData({...uploadData, desc: e.target.value})} />
                </div>

                <button type="submit" className="mkt-upload__submit">Post to Market</button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail sheet ───────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="mkt-detail"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            <div className="mkt-detail__hero">
              <nav className="mkt-detail__nav">
                <button className="mkt-detail__nav-btn" onClick={() => setSelected(null)}>
                  <TbChevronLeft size={22} />
                </button>
                <button
                  className={`mkt-detail__nav-btn${wishlist.includes(selected.id) ? ' mkt-detail__nav-btn--wish' : ''}`}
                  onClick={() => toggleWish(selected.id)}
                >
                  <TbHeart size={20} />
                </button>
              </nav>
              <img src={selected.img} alt={selected.name} className="mkt-detail__img" />
            </div>

            <div className="mkt-detail__info">
              <h1 className="mkt-detail__title">{selected.name}</h1>
              <p className="mkt-detail__price">{selected.price}</p>

              <div className="mkt-detail__meta">
                <span>🚚 Coastal Delivery</span>
                <span className="mkt-detail__rating"><TbStarFilled size={13} /> 4.8</span>
              </div>

              <p className="mkt-detail__desc-title">Description</p>
              <p className="mkt-detail__desc">{selected.desc}</p>

              <p className="mkt-detail__desc-title">Discover similar</p>
              <div className="mkt-also-list">
                {PRODUCTS.filter(p => p.id !== selected.id && p.category === selected.category).slice(0, 2).map(p => (
                  <div key={p.id} className="mkt-also-item" onClick={() => openProduct(p)}>
                    <img src={p.img} alt={p.name} className="mkt-also-item__img" />
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mkt-detail__footer">
              <div className="mkt-detail__qty">
                <button className="mkt-detail__qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="mkt-detail__qty-val">{qty}</span>
                <button className="mkt-detail__qty-btn" onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button className="mkt-detail__add">
                <TbShoppingCart size={18} /> Buy Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
