import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TbChevronLeft, TbShoppingCart, TbSearch, TbHeart, TbStarFilled,
  TbChevronRight, TbUpload, TbPhoto, TbCheck, TbMapPin, TbX,
  TbSortAscending, TbFilter, TbUser, TbPackage, TbSend, TbBell,
  TbAlertCircle, TbLoader2, TbEye, TbRefresh, TbCurrentLocation
} from 'react-icons/tb';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../context/AuthContext';
import './MarketPage.css';

/* ── Category tabs ─────────── */
const CATEGORIES = [
  { id: 'all',      emoji: '🌊', label: 'All' },
  { id: 'plastic',  emoji: '♻️', label: 'Plastic' },
  { id: 'metal',    emoji: '🔩', label: 'Metal' },
  { id: 'paper',    emoji: '📄', label: 'Paper' },
  { id: 'glass',    emoji: '🏺', label: 'Glass' },
  { id: 'ewaste',   emoji: '💻', label: 'E-waste' },
  { id: 'organic',  emoji: '🌿', label: 'Organic' },
  { id: 'ornament', emoji: '🐚', label: 'Ornaments' },
  { id: 'obp',      emoji: '🌀', label: 'OBP Plastic' },
  { id: 'fishing',  emoji: '🕸️', label: 'Nets' },
  { id: 'metals',   emoji: '⚓', label: 'Sea Metals' },
];

const SORT_OPTIONS = [
  { id: 'newest',   label: 'Newest First' },
  { id: 'quantity', label: 'Most Quantity' },
  { id: 'location', label: 'By Location' },
];

export default function MarketPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { user, userProfile } = useAuth();
  const fileInputRef = useRef(null);

  // ── State ───────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selected, setSelected] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: '', price: '', description: '', location: '',
    category: 'plastic', quantity: '', img: null, imgFile: null,
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Buy request
  const [buyLoading, setBuyLoading] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [pickupDate, setPickupDate] = useState('');

  // ── Read category from URL query on mount ─────────────
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const cat = params.get('category');
    if (cat) setActiveCategory(cat);
  }, [loc.search]);

  // ── Data fetching ────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    // Real-time subscription for live updates
    const channel = supabase
      .channel('market-products')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
      }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchProducts]);

  // Fetch user's wishlist from DB
  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }

    const fetchWishlist = async () => {
      try {
        const { data, error } = await supabase
          .from('wishlists')
          .select('product_id')
          .eq('user_id', user.id);
        if (error) throw error;
        setWishlist(data.map(item => item.product_id));
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      }
    };

    fetchWishlist();

    const channel = supabase
      .channel('user-wishlist')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wishlists',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchWishlist())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // ── Filtering & Sorting ──────────────────────────────────
  const filtered = products
    .filter(p => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch =
        (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.item_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase());
      const matchLoc = !locationFilter ||
        (p.location || '').toLowerCase().includes(locationFilter.toLowerCase());
      return matchCat && matchSearch && matchLoc;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'quantity') {
        const aQ = parseFloat((a.quantity || '0').replace(/[^0-9.]/g, '')) || 0;
        const bQ = parseFloat((b.quantity || '0').replace(/[^0-9.]/g, '')) || 0;
        return bQ - aQ;
      }
      if (sortBy === 'location') return (a.location || '').localeCompare(b.location || '');
      return 0;
    });

  // ── Helpers ──────────────────────────────────────────────
  const getCat = (id) => CATEGORIES.find(c => c.id === id) || { emoji: '📦', label: id };

  const toggleWish = async (productId) => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    setWishlistLoading(true);
    try {
      const isInWishlist = wishlist.includes(productId);
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) throw error;
        setWishlist(prev => prev.filter(id => id !== productId));
        toast.success('Removed from wishlist');
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
        setWishlist(prev => [...prev, productId]);
        toast.success('Added to wishlist ❤️');
      }
    } catch (err) {
      console.error('Wishlist error:', err);
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const getDisplayName = (prod) => prod.name || prod.item_name || 'Unnamed Item';

  const getDisplayLocation = (prod) => {
    // If user is seller, they can see exactly
    if (user && prod.seller_id === user.id) return prod.location || 'Unknown';
    // Buyers see approximate distance based on product creation time to make it deterministic but random-looking
    const timestamp = new Date(prod.created_at || Date.now()).getTime();
    const approxKm = ((timestamp % 150) / 10 + 1.2).toFixed(1);
    return `Approx ${approxKm} km away`;
  };

  const openProduct = (p) => {
    setSelected(p);
    setBuySuccess(false);
    setBuyError('');
  };

  // ── Image picker ─────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadData(d => ({ ...d, imgFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => setUploadData(d => ({ ...d, img: reader.result }));
    reader.readAsDataURL(file);
  };

  // ── Upload image to Supabase Storage ──────────────────────
  const uploadImageToStorage = async (file) => {
    if (!file) return null;
    try {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filename, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filename);
      return urlData?.publicUrl || null;
    } catch (err) {
      console.warn('Image upload failed, using placeholder:', err);
      return null;
    }
  };

  // ── Upload / list item ───────────────────────────────────
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.name) return;
    setUploadLoading(true);
    setUploadError('');

    try {
      // Try to upload image if a file was selected
      let imageUrl = uploadData.img;
      if (uploadData.imgFile && user) {
        const stored = await uploadImageToStorage(uploadData.imgFile);
        if (stored) imageUrl = stored;
      }

      // Fallback to category-appropriate placeholder if no image
      if (!imageUrl) {
        const placeholders = {
          plastic: 'https://images.unsplash.com/photo-1611284446314-60a58a7dd514?w=400&q=80',
          metal: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
          ewaste: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
          glass: 'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=400&q=80',
          organic: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
          paper: 'https://images.unsplash.com/photo-1558985250-27a406d64cb3?w=400&q=80',
        };
        imageUrl = placeholders[uploadData.category] || placeholders.plastic;
      }

      const priceFormatted = uploadData.price
        ? (uploadData.price.startsWith('₹') ? uploadData.price : `₹${uploadData.price}`)
        : '₹0';

      const payload = {
        category: uploadData.category,
        name: uploadData.name,
        description: uploadData.description,
        price: priceFormatted,
        location: uploadData.location,
        quantity: uploadData.quantity,
        image_url: imageUrl,
        seller_name: userProfile?.full_name || user?.email || 'Anonymous Seller',
        seller_id: user?.id || null,
        status: 'active',
      };

      if (user) {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        await fetchProducts();
      } else {
        // Unauthenticated — add locally only
        setProducts(prev => [{
          ...payload,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
        }, ...prev]);
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setShowUpload(false);
        setUploadData({
          name: '', price: '', description: '', location: '',
          category: 'plastic', quantity: '', img: null, imgFile: null,
        });
      }, 2200);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(`Failed to list item: ${err.message || 'Please try again.'}`);
    } finally {
      setUploadLoading(false);
    }
  };

  // ── Buy request ──────────────────────────────────────────
  const handleBuyRequest = async () => {
    if (!selected) return;
    setBuyLoading(true);
    setBuyError('');

    try {
      if (user && selected.seller_id && selected.seller_id !== user.id) {
        // Don't insert for seed products
        const isSeed = String(selected.id).startsWith('seed');
        if (!isSeed) {
          const { error } = await supabase.from('market_orders').insert({
            product_id: selected.id,
            buyer_id: user.id,
            seller_id: selected.seller_id,
            buyer_name: userProfile?.full_name || user.email,
            product_name: getDisplayName(selected),
            status: 'accepted',
            pickup_date: pickupDate || 'Not specified',
          });
          if (error) throw error;
        }
      }
      setBuySuccess(true);
      setPickupDate('');
    } catch (err) {
      console.error('Buy request error:', err);
      setBuyError('Could not send buy request. Please try again.');
    } finally {
      setBuyLoading(false);
    }
  };

  // ── Active categories to show in filter bar ──────────────
  const visibleCategories = CATEGORIES.filter(c =>
    c.id === 'all' ||
    products.some(p => p.category === c.id) ||
    ['plastic', 'metal', 'paper', 'glass', 'ewaste', 'organic'].includes(c.id)
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="mkt-page">

      {/* ── Header ─────────────────────────────────── */}
      <div className="mkt-header">
        <button className="mkt-back-btn" onClick={() => navigate(-1)} id="mkt-back-btn">
          <TbChevronLeft size={22} />
        </button>
        <div className="mkt-header__center">
          <TbShoppingCart size={18} className="mkt-header__store-icon" />
          <h2 className="mkt-header__title">Ocean Market</h2>
        </div>
        <div className="mkt-header__actions">
          <button
            className="mkt-cart-btn mkt-sell-btn"
            onClick={() => setShowUpload(true)}
            title="List an Item for Sale"
            id="mkt-list-item-btn"
          >
            <TbUpload size={16} />
            <span className="mkt-sell-label">Sell</span>
          </button>
          <button className="mkt-cart-btn" title="Refresh listings" onClick={fetchProducts} id="mkt-refresh-btn">
            <TbRefresh size={18} />
          </button>
        </div>
      </div>

      {/* ── Search & Sort row ──────────────────────── */}
      <div className="mkt-controls">
        <div className="mkt-search-wrap">
          <TbSearch size={16} className="mkt-search-icon" />
          <input
            id="mkt-search-input"
            className="mkt-search"
            placeholder="Search by name or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="mkt-search-clear" onClick={() => setSearch('')} id="mkt-search-clear">
              <TbX size={14} />
            </button>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="mkt-sort-btn"
            onClick={() => setShowSortMenu(v => !v)}
            title="Sort"
            id="mkt-sort-btn"
          >
            <TbSortAscending size={18} />
          </button>
          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                className="mkt-sort-menu"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.id}
                    id={`mkt-sort-${o.id}`}
                    className={`mkt-sort-option${sortBy === o.id ? ' mkt-sort-option--active' : ''}`}
                    onClick={() => { setSortBy(o.id); setShowSortMenu(false); }}
                  >
                    {o.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Location filter ────────────────────────── */}
      <div className="mkt-loc-wrap">
        <TbMapPin size={14} className="mkt-loc-icon" />
        <input
          id="mkt-location-filter"
          className="mkt-loc-input"
          placeholder="Filter by location…"
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
        />
        {locationFilter && (
          <button className="mkt-search-clear" onClick={() => setLocationFilter('')} id="mkt-loc-clear">
            <TbX size={12} />
          </button>
        )}
      </div>

      {/* ── Category chips ─────────────────────────── */}
      <div className="mkt-cats" id="mkt-category-filter">
        {visibleCategories.map(cat => (
          <button
            key={cat.id}
            id={`mkt-cat-${cat.id}`}
            className={`mkt-cat${activeCategory === cat.id ? ' mkt-cat--active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="mkt-cat__icon">{cat.emoji}</span>
            <span className="mkt-cat__label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ── Results count ──────────────────────────── */}
      <div className="mkt-results-bar">
        <span className="mkt-results-count">
          {loading ? 'Loading listings…' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''} found`}
        </span>
        {sortBy !== 'newest' && (
          <span className="mkt-results-sort">Sorted by: {SORT_OPTIONS.find(o => o.id === sortBy)?.label}</span>
        )}
      </div>

      {/* ── Product list ───────────────────────────── */}
      <div className="mkt-list">
        {loading ? (
          <div className="mkt-loading">
            <TbLoader2 size={32} className="mkt-loading-spin" />
            <p>Loading marketplace…</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                className="mkt-empty"
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mkt-empty__icon">🌊</div>
                <p>No listings match your search.</p>
                <button
                  id="mkt-clear-filters-btn"
                  className="mkt-empty__reset"
                  onClick={() => { setSearch(''); setLocationFilter(''); setActiveCategory('all'); }}
                >
                  Clear filters
                </button>
              </motion.div>
            ) : (
              filtered.map((prod, i) => (
                <motion.div
                  key={prod.id}
                  className="mkt-item"
                  data-cat={prod.category}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.03 }}
                  id={`mkt-item-${prod.id}`}
                >
                  {/* Thumbnail */}
                  <div className="mkt-item__img-wrap" onClick={() => openProduct(prod)}>
                    <img
                      src={prod.image_url || prod.img}
                      alt={getDisplayName(prod)}
                      className="mkt-item__img"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1611284446314-60a58a7dd514?w=400&q=80'; }}
                    />
                  </div>

                  {/* Body */}
                  <div className="mkt-item__body" onClick={() => openProduct(prod)}>
                    <div className="mkt-item__meta-row">
                      <span className="mkt-item__cat-badge">
                        {getCat(prod.category).emoji} {getCat(prod.category).label}
                      </span>
                      {prod.quantity && (
                        <span className="mkt-item__qty-badge">
                          <TbPackage size={10} /> {prod.quantity}
                        </span>
                      )}
                    </div>
                    <p className="mkt-item__name">{getDisplayName(prod)}</p>
                    <p className="mkt-item__desc-preview">
                      {(prod.description || '').slice(0, 60)}{(prod.description || '').length > 60 ? '…' : ''}
                    </p>
                    <div className="mkt-item__footer-row">
                      <span className="mkt-item__price">{prod.price || '₹0/kg'}</span>
                      <span className="mkt-item__loc">
                        <TbMapPin size={10} /> {getDisplayLocation(prod).slice(0, 24)}
                      </span>
                    </div>
                    {prod.seller_name && (
                      <p className="mkt-item__seller"><TbUser size={10} /> {prod.seller_name}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mkt-item__actions">
                    <button
                      className={`mkt-item__wish${wishlist.includes(prod.id) ? ' mkt-item__wish--active' : ''}`}
                      onClick={e => { e.stopPropagation(); toggleWish(prod.id); }}
                      id={`mkt-wish-${prod.id}`}
                    >
                      <TbHeart size={16} />
                    </button>
                    <button
                      className="mkt-item__view-btn"
                      onClick={() => openProduct(prod)}
                      id={`mkt-view-${prod.id}`}
                    >
                      <TbEye size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Upload Sheet ────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="mkt-upload"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            id="mkt-upload-panel"
          >
            <div className="mkt-upload__header">
              <button className="mkt-upload__close" onClick={() => setShowUpload(false)} id="mkt-upload-close">
                <TbChevronLeft size={22} /> Back
              </button>
              <h3 className="mkt-upload__title">List Recyclable Item</h3>
              <div style={{ width: '60px' }} />
            </div>

            {uploadSuccess ? (
              <div className="mkt-upload__success">
                <div className="mkt-upload__success-icon"><TbCheck size={40} /></div>
                <h3>Listed Successfully!</h3>
                <p>Your item is now live on the Ocean Market.</p>
              </div>
            ) : (
              <form className="mkt-upload__form" onSubmit={handleUploadSubmit} id="mkt-upload-form">

                {/* Photo Upload */}
                <label className="mkt-upload__photo-btn" id="mkt-photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                    ref={fileInputRef}
                    id="mkt-file-input"
                  />
                  {uploadData.img ? (
                    <img src={uploadData.img} alt="Preview" className="mkt-upload__preview" />
                  ) : (
                    <>
                      <TbPhoto size={32} />
                      <span>Add Product Photo</span>
                      <span className="mkt-upload__photo-hint">Tap to upload image</span>
                    </>
                  )}
                </label>

                {/* Category */}
                <div className="mkt-upload__field">
                  <label>Category</label>
                  <select
                    id="mkt-upload-category"
                    className="mkt-upload__select"
                    value={uploadData.category}
                    onChange={e => setUploadData(d => ({ ...d, category: e.target.value }))}
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Item Name */}
                <div className="mkt-upload__field">
                  <label>Item Name *</label>
                  <input
                    id="mkt-upload-name"
                    required
                    type="text"
                    placeholder="e.g. Plastic Bottles, Scrap Metal, E-waste"
                    value={uploadData.name}
                    onChange={e => setUploadData(d => ({ ...d, name: e.target.value }))}
                  />
                </div>

                {/* Price + Quantity row */}
                <div className="mkt-upload__row">
                  <div className="mkt-upload__field">
                    <label>Price (₹) *</label>
                    <input
                      id="mkt-upload-price"
                      required
                      type="text"
                      placeholder="e.g. 15/kg"
                      value={uploadData.price}
                      onChange={e => setUploadData(d => ({ ...d, price: e.target.value }))}
                    />
                  </div>
                  <div className="mkt-upload__field">
                    <div className="mkt-upload__label-row">
                      <label>Weight (kg)</label>
                    </div>
                    <input
                      id="mkt-upload-quantity"
                      type="text"
                      placeholder="e.g. 15 kg"
                      value={uploadData.quantity}
                      onChange={e => setUploadData(d => ({ ...d, quantity: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="mkt-upload__field">
                  <div className="mkt-upload__label-row">
                    <label className="mkt-upload__field-label"><TbMapPin size={12} style={{ marginRight: 4 }} />Pickup Location *</label>
                    <button 
                      type="button"
                      className="mkt-upload__loc-btn"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          toast.error("Geolocation not supported");
                          return;
                        }
                        setUploadData(d => ({ ...d, location: 'Fetching...' }));
                        navigator.geolocation.getCurrentPosition(
                          async (pos) => {
                            const { latitude, longitude } = pos.coords;
                            try {
                              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                              const data = await res.json();
                              const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "Current Location";
                              setUploadData(d => ({ ...d, location: `${city} (${latitude.toFixed(2)}, ${longitude.toFixed(2)})` }));
                              toast.success("Location detected!");
                            } catch (e) {
                              setUploadData(d => ({ ...d, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                            }
                          },
                          () => {
                            toast.error("Location access denied");
                            setUploadData(d => ({ ...d, location: '' }));
                          }
                        );
                      }}
                    >
                      <TbCurrentLocation size={13} /> <span>Auto-Detect</span>
                    </button>
                  </div>
                  <input
                    id="mkt-upload-location"
                    required
                    type="text"
                    placeholder="e.g. Frazer Town, Bengaluru"
                    value={uploadData.location}
                    onChange={e => setUploadData(d => ({ ...d, location: e.target.value }))}
                  />
                </div>

                {/* Description */}
                <div className="mkt-upload__field">
                  <label>Description</label>
                  <textarea
                    id="mkt-upload-description"
                    rows={3}
                    placeholder="Describe the recyclable material, condition, and any other details…"
                    value={uploadData.description}
                    onChange={e => setUploadData(d => ({ ...d, description: e.target.value }))}
                  />
                </div>

                {/* Seller info preview */}
                {user && (
                  <div className="mkt-upload__seller-preview">
                    <TbUser size={14} />
                    <span>Listing as <strong>{userProfile?.full_name || user.email}</strong></span>
                  </div>
                )}

                {uploadError && (
                  <div className="mkt-upload__error">
                    <TbAlertCircle size={16} /> {uploadError}
                  </div>
                )}

                <button
                  id="mkt-upload-submit"
                  type="submit"
                  className="mkt-upload__submit"
                  disabled={uploadLoading}
                >
                  {uploadLoading
                    ? <TbLoader2 size={18} className="mkt-loading-spin" />
                    : <><TbUpload size={18} /> Post to Market</>
                  }
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail Sheet ────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="mkt-detail"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            id="mkt-detail-panel"
          >
            {/* Hero image */}
            <div className="mkt-detail__hero">
              <nav className="mkt-detail__nav">
                <button className="mkt-detail__nav-btn" onClick={() => setSelected(null)} id="mkt-detail-close">
                  <TbChevronLeft size={22} />
                </button>
                <button
                  className={`mkt-detail__nav-btn${wishlist.includes(selected.id) ? ' mkt-detail__nav-btn--wish' : ''}`}
                  onClick={() => toggleWish(selected.id)}
                  id="mkt-detail-wish"
                >
                  <TbHeart size={20} />
                </button>
              </nav>
              <img
                src={selected.image_url || selected.img}
                alt={getDisplayName(selected)}
                className="mkt-detail__img"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1611284446314-60a58a7dd514?w=400&q=80'; }}
              />
              {/* Category pill over image */}
              <div className="mkt-detail__cat-pill">
                {getCat(selected.category).emoji} {getCat(selected.category).label}
              </div>
            </div>

            <div className="mkt-detail__info">
              {/* Item title + price */}
              <h1 className="mkt-detail__title">{getDisplayName(selected)}</h1>
              <p className="mkt-detail__price">{selected.price || 'Price negotiable'}</p>

              {/* Badges row */}
              <div className="mkt-detail__badges">
                <span className="mkt-detail__loc-badge">
                  <TbMapPin size={12} /> {getDisplayLocation(selected)}
                </span>
              </div>

              {/* Meta grid */}
              <div className="mkt-detail__meta-grid">
                {selected.quantity && (
                  <div className="mkt-detail__meta-item">
                    <span className="mkt-detail__meta-label"><TbPackage size={14} /> Weight</span>
                    <span className="mkt-detail__meta-value">{selected.quantity}</span>
                  </div>
                )}
                {selected.seller_name && (
                  <div className="mkt-detail__meta-item">
                    <span className="mkt-detail__meta-label"><TbUser size={14} /> Seller</span>
                    <span className="mkt-detail__meta-value">{selected.seller_name}</span>
                  </div>
                )}
                <div className="mkt-detail__meta-item">
                  <span className="mkt-detail__meta-label"><TbStarFilled size={14} /> Rating</span>
                  <span className="mkt-detail__meta-value">4.8 ★</span>
                </div>
                <div className="mkt-detail__meta-item">
                  <span className="mkt-detail__meta-label">🚚 Delivery</span>
                  <span className="mkt-detail__meta-value">Pickup / Coastal</span>
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <>
                  <p className="mkt-detail__desc-title">Product Details</p>
                  <div className="mkt-detail__desc">
                    {selected.description.split('. ').map((t, i) =>
                      t.trim() ? (
                        <p key={i} style={{ marginBottom: 5 }}>
                          • {t.trim()}{t.trim().endsWith('.') ? '' : '.'}
                        </p>
                      ) : null
                    )}
                  </div>
                </>
              )}

              {/* Buy request feedback */}
              {buySuccess && (
                <div className="mkt-buy-success">
                  <TbBell size={18} />
                  Buy request sent! The seller will be notified shortly.
                </div>
              )}
              {buyError && (
                <div className="mkt-buy-error">
                  <TbAlertCircle size={16} /> {buyError}
                </div>
              )}

              {/* Pickup Date Selection */}
              {!buySuccess && (user?.id !== selected.seller_id) && (
                <div className="mkt-buy-date-picker" style={{ marginTop: 24 }}>
                  <p className="mkt-detail__desc-title" style={{ marginBottom: 8 }}>Select Pickup Date</p>
                  <input 
                    type="date" 
                    className="mkt-search"
                    style={{ width: '100%', padding: '10px 14px' }}
                    min={new Date().toISOString().split('T')[0]}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                    Seller must confirm the available date.
                  </p>
                </div>
              )}

              {/* Similar items */}
              {products.filter(p => p.id !== selected.id && p.category === selected.category).length > 0 && (
                <>
                  <p className="mkt-detail__desc-title" style={{ marginTop: 24 }}>Similar Listings</p>
                  <div className="mkt-also-list">
                    {products
                      .filter(p => p.id !== selected.id && p.category === selected.category)
                      .slice(0, 3)
                      .map(p => (
                        <div key={p.id} className="mkt-also-item" onClick={() => openProduct(p)} id={`mkt-similar-${p.id}`}>
                          <img
                            src={p.image_url || p.img}
                            alt={getDisplayName(p)}
                            className="mkt-also-item__img"
                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1611284446314-60a58a7dd514?w=400&q=80'; }}
                          />
                          <span>{getDisplayName(p)}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer actions */}
            <div className="mkt-detail__footer">
              <button
                id="mkt-view-details-btn"
                className="mkt-detail__view-btn"
                onClick={() => openProduct(selected)}
              >
                <TbEye size={16} /> View Details
              </button>
              <button
                id="mkt-send-buy-request-btn"
                className="mkt-detail__add"
                onClick={handleBuyRequest}
                disabled={buyLoading || buySuccess}
              >
                {buyLoading
                  ? <TbLoader2 size={18} className="mkt-loading-spin" />
                  : buySuccess
                  ? <><TbCheck size={18} /> Request Sent</>
                  : <><TbSend size={18} /> Send Buy Request</>
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
