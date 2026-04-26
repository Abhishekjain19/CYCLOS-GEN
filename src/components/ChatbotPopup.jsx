import { useState, useRef, useEffect, useCallback } from 'react';
import { TbSend, TbPhoto, TbRobot, TbMicrophone, TbMicrophoneOff } from 'react-icons/tb';
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
    '### Organic Waste Protocols 🌱\n\nFor wet waste < 2kg:\n\n*   **Garbage Enzyme**: Mix 3 parts fruit peels, 1 part jaggery, 10 parts water. Ferment for 3 months.\n*   **Vermicompost**: Use a small bin with red wiggler worms.\n\nFor larger quantities, we will route a BBMP Auto-Tipper to your location.',
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
  'What is Circular Economy?',
  'How to earn Eco Points?',
  'Urban waste impact',
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'ai',
  text: "Hi! 👋 I'm the Cyclos assistant. You can ask me about recycling or upload a waste image for guidance.",
  ts: Date.now(),
};

function getAIReply(userText, history = []) {
  const lower = userText.toLowerCase();

  // Contextual memory check for recently uploaded images
  if (lower.includes('image') || lower.includes('photo') || lower.includes('picture') || lower.includes('this') || lower.includes('what is that') || lower.includes('it')) {
    const lastImageReply = [...history].reverse().find(m => m.isImageReply);
    if (lastImageReply) {
      const match = lastImageReply.text.match(/Detected:\s*([^*]+)/);
      if (match) {
        return `You're asking about the image you uploaded! As I analyzed earlier, it is **${match[1].trim()}**. Do you need specific recycling instructions for it?`;
      }
    }
  }

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
  const [voiceMode, setVoiceMode] = useState('English');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const typingTimeoutRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      
      // Update recognition language when dropdown changes
      if (voiceMode === 'Kannada') recognitionRef.current.lang = 'kn-IN';
      else if (voiceMode === 'Hindi') recognitionRef.current.lang = 'hi-IN';
      else recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onspeechstart = () => {
        // If user starts speaking while AI is talking, stop the AI immediately
        if (synthRef.current?.speaking) {
          synthRef.current.cancel();
        }
        // If AI was about to answer, pause and listen instead
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          setIsTyping(false);
        }
      };

      recognitionRef.current.onresult = (event) => {
        if (synthRef.current?.speaking) {
          synthRef.current.cancel();
        }
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript.trim()) {
          sendMessage(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if in voice mode
        if (isVoiceMode) {
          try {
            recognitionRef.current.start();
          } catch(e) {}
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [voiceMode, isVoiceMode]); // re-bind when language or mode changes

  useEffect(() => {
    if (isVoiceMode && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    } else if (!isVoiceMode && recognitionRef.current) {
      recognitionRef.current.stop();
      synthRef.current?.cancel();
    }
  }, [isVoiceMode]);

  const speakText = useCallback((text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    
    // Strip markdown formatting for speech
    const cleanText = text.replace(/[#*`_]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synthRef.current.getVoices();
    let selectedVoice = null;
    
    if (voiceMode === 'Kannada') {
      utterance.lang = 'kn-IN';
      selectedVoice = voices.find(v => v.lang === 'kn-IN' && v.name.includes('Google')) || voices.find(v => v.lang === 'kn-IN');
    } else if (voiceMode === 'Hindi') {
      utterance.lang = 'hi-IN';
      selectedVoice = voices.find(v => v.lang === 'hi-IN' && v.name.includes('Google')) || voices.find(v => v.lang === 'hi-IN');
    } else {
      utterance.lang = 'en-IN';
      selectedVoice = voices.find(v => (v.lang === 'en-IN' || v.lang === 'en-US') && (v.name.includes('Female') || v.name.includes('Google'))) 
        || voices.find(v => v.lang.startsWith('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    synthRef.current.speak(utterance);
  }, [voiceMode]);

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
    const currentHistory = messages;
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      const replyText = getAIReply(clean, currentHistory);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: replyText },
      ]);
      if (isVoiceMode) {
        speakText(replyText);
      }
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
      const replyText = `${cls.emoji} **Detected: ${cls.category}**\n\n${cls.advice}`;
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: replyText,
          isImageReply: true,
        },
      ]);
      if (isVoiceMode) {
        speakText(`Detected ${cls.category}. ${cls.advice}`);
      }
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
            ♻️
          </div>
          <div className="chatbot-header__text">
            <p className="chatbot-header__title">Cyclos AI</p>
            <p className="chatbot-header__subtitle">Eco-Intelligence Assistant</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              value={voiceMode} 
              onChange={(e) => setVoiceMode(e.target.value)}
              style={{ padding: '4px', borderRadius: '4px', background: 'var(--eco-100)', color: 'var(--eco-900)', border: 'none', fontSize: '12px', fontWeight: 'bold' }}
            >
              <option value="English">EN Voice</option>
              <option value="Kannada">ಕನ್ನಡ Voice</option>
              <option value="Hindi">हिंदी Voice</option>
            </select>
            <button
              className="chatbot-header__close"
              onClick={handleClose}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>
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

          {/* voice mode toggle */}
          <button
            className={`chatbot-upload-btn ${isVoiceMode ? 'active-voice' : ''}`}
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            aria-label="Toggle voice mode"
            title="Toggle Voice Mode"
            style={{ color: isVoiceMode ? '#EF4444' : 'inherit' }}
          >
            {isVoiceMode ? <TbMicrophone size={19} /> : <TbMicrophoneOff size={19} />}
          </button>

          <input
            ref={inputRef}
            className="chatbot-input"
            placeholder={isVoiceMode ? "Listening..." : "Ask about recycling, sustainability, or waste..."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isVoiceMode}
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
