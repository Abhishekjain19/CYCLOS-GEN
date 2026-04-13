import { useState, useRef, useEffect } from 'react';
import { TbSend, TbPhoto, TbRobot } from 'react-icons/tb';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import './ChatbotPopup.css';

/* ── Canned text responses keyed by keywords ── */
const AI_RESPONSES = {
  plastic:
    '### Plastic Recycling ♻️\n\nPlastic bottles (PET #1 & HDPE #2) can be recycled at most curbside programmes. \n\n*   **Rinse** them clean\n*   **Remove** caps\n*   **Flatten** to save space\n\nAvoid putting plastic bags in the bin — take them to grocery-store drop-off points instead.',
  'e-waste':
    '### E-Waste Handling 🔌\n\nE-waste (phones, chargers, batteries) should **NEVER** go to landfill. \n\nDrop them off at a registered e-waste facility or any Cyclos partner recycler near you. Tap the map icon in the dock to find the closest one!',
  household:
    "### Sustainable Living 🏠\n\nGreat question! Start with the 3 R's:\n\n1.  **Reduce** waste at the source\n2.  **Reuse** items when possible\n3.  **Recycle** correctly\n\nComposting food scraps and choosing products with less packaging are the biggest wins.",
  recycling:
    '### Find Facilities 📍\n\nOpen the Cyclos map (dock → home icon) to discover verified recycling centres, drop-off bins, and community collection drives within 5 km of you.',
  center:
    '### Recycling Centers 📍\n\nOpen the Cyclos map (dock → home icon) to discover verified recycling centres, drop-off bins, and community collection drives within 5 km of you.',
  reduce:
    '### Waste Reduction 🌿\n\nSimple swaps make a huge difference:\n\n*   Carry a reusable bag\n*   Use a refillable water bottle\n*   Buy second-hand when possible\n*   Choose minimal packaging',
  paper:
    '### Paper & Cardboard 📄\n\nPaper and cardboard are highly recyclable. \n\n*   **Flatten** boxes\n*   **Remove** plastic tape\n*   **Keep dry** for better processing\n\n*Note: Soiled paper (greasy pizza boxes) should go to compost.*',
  glass:
    '### Glass Jars & Bottles 🫙\n\nGlass is 100% recyclable. \n\n*   **Rinse** clean\n*   **Separate by colour** if required\n*   **Wrap broken glass** safely before disposal',
  metal:
    '### Metal & Aluminium 🥫\n\nAluminium cans and steel tins are infinitely recyclable. \n\n*   **Rinse** out before recycling\n*   **Scrunch** aluminium foil into a ball\n*   **Metal is high-value** for local recyclers!',
  organic:
    '### Organic Waste 🌱\n\nFood scraps and garden trimmings are perfect for composting. \n\n*   Start a kitchen **compost bin**\n*   Use community **compost stations**\n*   Turn waste into soil!',
  default:
    "### I'm Learning! 🤔\n\nI'm still expanding my knowledge base. Try asking me about:\n\n*   **Plastic**\n*   **E-waste**\n*   **Paper**\n*   **Glass**\n*   **Metal**\n*   **Organic**\n\n*Tip: You can also upload a photo!*",
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
  'Nearest recycling hub',
  'What is OBP?',
  'How to earn Eco Points?',
  'Ocean plastic impact',
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
        dragMomentum={false}
        dragConstraints={{ top: -500, bottom: 50, left: -400, right: 400 }}
      >

        {/* ── Drag Handle ── */}
        <div className="chatbot-drag-handle" />

        {/* ── Header ── */}
        <div className="chatbot-header">
          <div className="chatbot-header__icon-wrap">
            🌊
          </div>
          <div className="chatbot-header__text">
            <p className="chatbot-header__title">Cyclos</p>
            <p className="chatbot-header__subtitle">AI Assistant</p>
          </div>
          <button
            className="chatbot-header__close"
            onClick={handleClose}
            aria-label="Close chatbot"
          >
            ✕
          </button>
        </div>

        {/* ── Identity Strip ── */}
        <div className="chatbot-identity">
          <div className="chatbot-identity__pulse">
            <span />
          </div>
          <p className="chatbot-identity__text">
            Your guide for recycling and sustainable waste management
          </p>
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
            placeholder="Ask about recycling, sustainability, or waste..."
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
