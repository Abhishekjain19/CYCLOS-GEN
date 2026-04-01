import { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { TbRobot, TbX, TbSend, TbPhoto } from 'react-icons/tb';
import ReactMarkdown from 'react-markdown';
import './ChatbotPopup.css';

/* ── Canned text responses keyed by keywords ── */
const AI_RESPONSES = {
  plastic:
    '♻️ Plastic bottles (PET #1 & HDPE #2) can be recycled at most curbside programmes. Rinse them, remove caps, and flatten to save space. Avoid putting plastic bags in the bin — take them to grocery-store drop-off points instead.',
  'e-waste':
    '🔌 E-waste (phones, chargers, batteries) should NEVER go to landfill. Drop them off at a registered e-waste facility or any Cyclos partner recycler near you. Tap the map icon in the dock to find the closest one!',
  household:
    "🏠 Great question! Start with the 3 R's — Reduce, Reuse, Recycle. Composting food scraps, buying in bulk, and choosing products with less packaging are the biggest wins. Every small swap adds up.",
  recycling:
    '📍 Open the Cyclos map (dock → home icon) to discover verified recycling centres, drop-off bins, and community collection drives within 5 km of you.',
  center:
    '📍 Open the Cyclos map (dock → home icon) to discover verified recycling centres, drop-off bins, and community collection drives within 5 km of you.',
  reduce:
    '🌿 Simple swaps: carry a reusable bag, use a refillable water bottle, buy second-hand when possible, and choose products with minimal packaging. Every action counts for the planet!',
  paper:
    '📄 Paper and cardboard are highly recyclable. Flatten boxes, remove any plastic wrapping, and keep them dry. Soiled paper (greasy pizza boxes) should go to compost, not recycling.',
  glass:
    '🫙 Glass bottles and jars are 100 % recyclable. Rinse them clean and separate by colour (clear, green, brown) if your local centre requires it. Broken glass should be wrapped safely before disposal.',
  metal:
    '🥫 Aluminium cans and steel tins are infinitely recyclable. Rinse them out before placing in the recycling bin. Aluminium foil can also be recycled — scrunch several pieces together into a ball first.',
  organic:
    '🌱 Organic waste like food scraps and garden trimmings is perfect for composting. Keep a small kitchen compost bin and empty it regularly into an outdoor pile or a community compost station.',
  default:
    "🤔 Great question! I'm still expanding my knowledge base. Try asking me about plastic, e-waste, paper, glass, metal, or organic waste — or snap a photo of your waste and I'll classify it for you!",
};

/* ── Simulated image-analysis responses ── */
const IMAGE_CLASSIFICATIONS = [
  {
    category: 'Plastic Waste',
    emoji: '🧴',
    advice:
      'This appears to be plastic waste. Check the recycling number on the bottom. PET (#1) and HDPE (#2) are accepted at most curbside bins. Rinse clean before recycling.',
  },
  {
    category: 'Metal / Aluminium',
    emoji: '🥫',
    advice:
      'Looks like metal packaging. Aluminium cans and steel tins are infinitely recyclable — just rinse them and place in your recycling bin. Great choice to recycle!',
  },
  {
    category: 'Glass',
    emoji: '🫙',
    advice:
      'This looks like glass. Glass is 100 % recyclable and can be recycled indefinitely. Rinse it out and take it to your nearest glass bank or curbside collection.',
  },
  {
    category: 'Paper / Cardboard',
    emoji: '📦',
    advice:
      'This appears to be paper or cardboard. Flatten any boxes and keep the material dry. Remove plastic inserts or tape before recycling.',
  },
  {
    category: 'Organic Waste',
    emoji: '🍃',
    advice:
      'This looks like organic or food waste. Consider home composting! Organic matter breaks down naturally and enriches soil. Many local councils also offer food-waste collection.',
  },
  {
    category: 'E-Waste',
    emoji: '📱',
    advice:
      'This appears to be electronic waste. Never place e-waste in your regular bin — it contains hazardous materials. Use the Cyclos map to find a certified e-waste drop-off point near you.',
  },
];

const QUICK_SUGGESTIONS = [
  'How do I recycle plastic bottles?',
  'Where can I dispose e-waste?',
  'Tips to reduce household waste',
  'Find nearby recycling centers',
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'ai',
  text: "Hi! 👋 I'm the Cyclos assistant. You can ask me about recycling or upload a waste image for guidance.",
  ts: Date.now(),
};

function getAIReply(userText) {
  const lower = userText.toLowerCase();
  for (const [key, reply] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key.toLowerCase())) return reply;
  }
  return AI_RESPONSES.default;
}

function getRandomClassification() {
  return IMAGE_CLASSIFICATIONS[
    Math.floor(Math.random() * IMAGE_CLASSIFICATIONS.length)
  ];
}

export default function ChatbotPopup({ onClose }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragControls = useDragControls();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 240);
  };

  /* ── Text message ── */
  const sendMessage = (text) => {
    const clean = text.trim();
    if (!clean) return;

    const userMsg = { id: Date.now(), role: 'user', text: clean };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: getAIReply(clean) },
      ]);
    }, 900 + Math.random() * 600);
  };

  /* ── Image upload ── */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    /* user bubble with image preview */
    const userMsg = {
      id: Date.now(),
      role: 'user',
      image: objectUrl,
      text: null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    /* simulate AI analysing image */
    setTimeout(() => {
      const cls = getRandomClassification();
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: `${cls.emoji} **Detected: ${cls.category}**\n\n${cls.advice}`,
          isImageReply: true,
        },
      ]);
    }, 1400 + Math.random() * 800);

    /* reset file input so the same file can be re-uploaded */
    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputVal);
    }
  };



  return (
    <div className="chatbot-overlay">
      <motion.div 
        className={`chatbot-popup${isClosing ? ' closing' : ''}`}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
        initial={{ opacity: 0, y: 32, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.92 }}
      >

        {/* ── Header (Drag Handle) ── */}
        <div 
          className="chatbot-header"
          onPointerDown={(e) => dragControls.start(e)}
          style={{ cursor: 'grab' }}
        >
          <div className="chatbot-header__icon-wrap">
            <TbRobot />
          </div>
          <div className="chatbot-header__text">
            <p className="chatbot-header__title">Cyclos AI Assistant</p>
            <p className="chatbot-header__subtitle">
              Your guide for recycling and sustainable waste management.
            </p>
          </div>
          <button
            className="chatbot-header__close"
            onClick={handleClose}
            aria-label="Close chatbot"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <TbX />
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chatbot-msg ${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="chatbot-msg__avatar">
                  <TbRobot size={14} />
                </div>
              )}

              {/* image bubble */}
              {msg.image ? (
                <div className="chatbot-msg__image-bubble">
                  <img
                    src={msg.image}
                    alt="Uploaded waste"
                    className="chatbot-msg__preview-img"
                  />
                  <span className="chatbot-msg__image-label">
                    📷 Analysing your image…
                  </span>
                </div>
              ) : (
                <div className="chatbot-msg__bubble">
                  <div className="chatbot-markdown">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* typing indicator */}
          {isTyping && (
            <div className="chatbot-msg ai">
              <div className="chatbot-msg__avatar">
                <TbRobot size={14} />
              </div>
              <div className="chatbot-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick suggestion chips (only before first user message) ── */}
        {messages.length === 1 && (
          <div className="chatbot-suggestions">
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="chatbot-suggestions__chip"
                onClick={() => sendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input area ── */}
        <div className="chatbot-input-area">
          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            id="chatbot-image-upload"
            onChange={handleImageUpload}
          />

          {/* image upload button */}
          <button
            className="chatbot-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload waste image"
            id="chatbot-upload-btn"
            title="Upload a waste image for AI classification"
          >
            <TbPhoto size={19} />
          </button>

          <input
            ref={inputRef}
            className="chatbot-input"
            placeholder="Ask about recycling, sustainability, or waste disposal..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            id="chatbot-input-field"
          />

          <button
            className="chatbot-send-btn"
            onClick={() => sendMessage(inputVal)}
            aria-label="Send message"
            id="chatbot-send-btn"
          >
            <TbSend size={17} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
