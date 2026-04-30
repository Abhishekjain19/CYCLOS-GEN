import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbSend, TbPhoto, TbRobot, TbMicrophone, TbMicrophoneOff, TbCamera, TbX, TbArrowLeft } from 'react-icons/tb';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeWasteImage, getChatResponse } from '../services/nvidiaNim';
import toast from 'react-hot-toast';
import './CyclosAIPage.css';

const QUICK_SUGGESTIONS = [
  'How do I recycle plastic bottles?',
  'Where can I dispose e-waste?',
  'Nearest recycling hub',
  'What is Circular Economy?',
  'How to earn Eco Points?',
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'ai',
  text: "Hi! 👋 I'm the Cyclos AI Assistant. You can ask me about recycling, sustainability, or scan a waste item for instant AI segregation guidance.",
  ts: Date.now(),
};

export default function CyclosAIPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice Mode controls AI speaking TTS
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const isVoiceModeRef = useRef(isVoiceMode);
  
  // Listening controls User STT
  const [isListening, setIsListening] = useState(false);
  
  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
    if (!isVoiceMode && synthRef.current) {
      synthRef.current.cancel();
    }
  }, [isVoiceMode]);
  
  const [showScanner, setShowScanner] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  
  const videoChatRef = useRef(null);
  const canvasChatRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Process one sentence at a time
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onspeechstart = () => {
        if (synthRef.current?.speaking) synthRef.current.cancel();
      };

      recognitionRef.current.onresult = (event) => {
        if (synthRef.current?.speaking) synthRef.current.cancel();
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          setInputVal(transcript);
          sendMessage(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const speakText = useCallback((text) => {
    if (!synthRef.current || !isVoiceModeRef.current) return;
    synthRef.current.cancel();
    
    const cleanText = text.replace(/[#*`_]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = synthRef.current.getVoices();
    const premiumVoices = [
      'Google UK English Female',
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Google US English',
      'Samantha'
    ];

    let selectedVoice = null;
    for (const vName of premiumVoices) {
      selectedVoice = voices.find(v => v.name === vName);
      if (selectedVoice) break;
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Google'))) || voices.find(v => v.lang.startsWith('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }
    
    utterance.pitch = 1.05;
    utterance.rate = 1.0;
    
    synthRef.current.speak(utterance);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const clean = text.trim();
    if (!clean) return;

    const userMsg = { id: Date.now(), role: 'user', text: clean };
    
    // Prepare API messages
    const apiMessages = messages.filter(m => m.text).map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text
    }));
    apiMessages.push({ role: 'user', content: clean });

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const replyText = await getChatResponse(apiMessages);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: replyText },
      ]);
      if (isVoiceModeRef.current) speakText(replyText);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      const errorMsg = "⚠️ I'm sorry, I'm having trouble connecting to Cyclos AI right now. Please try again.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: errorMsg },
      ]);
      if (isVoiceModeRef.current) speakText("I'm sorry, I am having trouble connecting right now.");
    }
  };

  const processCapturedImage = async (base64, objectUrl) => {
    const userMsg = {
      id: Date.now(),
      role: 'user',
      image: objectUrl,
      text: null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Use NVIDIA NIM AI for actual waste analysis
      const aiData = await analyzeWasteImage(base64);
      
      const emoji = aiData.stream.toLowerCase().includes('wet') || aiData.stream.toLowerCase().includes('organic') ? '🍃' 
                    : aiData.stream.toLowerCase().includes('e-waste') ? '📱' 
                    : aiData.stream.toLowerCase().includes('hazardous') ? '☣️' : '♻️';

      const replyText = `${emoji} **Detected: ${aiData.type}**\n\n**Category:** ${aiData.stream} (Grade ${aiData.grade})\n**Recyclability Score:** ${aiData.recyclability_score}\n**Selling Potential:** ${aiData.selling_potential}\n\n**Segregation Method:**\n${aiData.segregation_method || 'Please segregate appropriately into the designated bin.'}`;
      
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
      if (isVoiceModeRef.current) speakText(`Detected ${aiData.type}. ${aiData.segregation_method}`);
    } catch (err) {
      console.error("AI Analysis failed", err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: "⚠️ **Analysis Failed**\n\nI couldn't process this image clearly. Please try uploading a clearer photo.",
          isImageReply: true,
        },
      ]);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const objectUrl = URL.createObjectURL(file);
      processCapturedImage(base64, objectUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startChatCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoChatRef.current) {
        videoChatRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      toast.error('Camera access denied.');
      setShowScanner(false);
    }
  };

  const stopChatCamera = () => {
    if (videoChatRef.current?.srcObject) {
      videoChatRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    if (showScanner) startChatCamera();
    else stopChatCamera();
    return () => stopChatCamera();
  }, [showScanner]);

  const handleChatCameraCapture = () => {
    if (!videoChatRef.current) return;
    const video = videoChatRef.current;
    if (video.readyState !== 4 || video.videoWidth === 0) return;

    const canvas = canvasChatRef.current;
    if (!canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const base64withPrefix = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = base64withPrefix.split(',')[1];
    
    setShowScanner(false);
    processCapturedImage(base64, base64withPrefix);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputVal);
    }
  };

  return (
    <div className="cyclos-ai-page">
      {/* ── Header ── */}
      <div className="cyclos-ai-header">
        <button className="cyclos-ai-header__back" onClick={() => navigate(-1)}>
          <TbArrowLeft size={20} />
        </button>
        <div className="cyclos-ai-header__icon-wrap">♻️</div>
        <div className="cyclos-ai-header__text">
          <h1 className="cyclos-ai-header__title">Cyclos AI</h1>
          <p className="cyclos-ai-header__subtitle">Powered by NVIDIA NIM</p>
        </div>
        <div className="cyclos-ai-header-toggle-wrap">
          <span className="cyclos-ai-header-toggle-label">Voice Mode</span>
          <button
            className={`cyclos-ai-header-switch ${isVoiceMode ? 'active' : ''}`}
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            aria-label={isVoiceMode ? "Disable Voice" : "Enable Voice"}
            title="Toggle AI Voice Response"
          >
            <div className="cyclos-ai-header-switch-handle"></div>
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="cyclos-ai-messages">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`cyclos-ai-msg ${msg.role}`}
          >
            {msg.role === 'ai' && (
              <div className="cyclos-ai-msg__avatar">
                <TbRobot size={16} />
              </div>
            )}

            {msg.image ? (
              <div className="cyclos-ai-msg__image-bubble">
                <img src={msg.image} alt="Uploaded waste" className="cyclos-ai-msg__preview-img" />
                <span className="cyclos-ai-msg__image-label">📷 Analysing with NVIDIA NIM…</span>
              </div>
            ) : (
              <div className="cyclos-ai-msg__bubble">
                <div className="cyclos-ai-markdown">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <div className="cyclos-ai-msg ai">
            <div className="cyclos-ai-msg__avatar">
              <TbRobot size={16} />
            </div>
            <div className="cyclos-ai-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick suggestions ── */}
      {messages.length === 1 && (
        <div className="cyclos-ai-suggestions">
          {QUICK_SUGGESTIONS.map((s) => (
            <button key={s} className="cyclos-ai-suggestions__chip" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Scanner Overlay ── */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            className="cyclos-ai-scanner-overlay"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="cyclos-ai-scanner-header">
              <span>Waste Scanner</span>
              <button onClick={() => setShowScanner(false)} aria-label="Close Scanner"><TbX size={24} /></button>
            </div>
            <div className="cyclos-ai-scanner-video-wrap">
               <video ref={videoChatRef} autoPlay playsInline className="cyclos-ai-scanner-video" />
               <canvas ref={canvasChatRef} style={{ display: 'none' }} />
               <div className="cyclos-ai-scanner-hud">
                 <div className="corner tl"></div>
                 <div className="corner tr"></div>
                 <div className="corner bl"></div>
                 <div className="corner br"></div>
               </div>
            </div>
            <button className="cyclos-ai-scanner-capture" onClick={handleChatCameraCapture} aria-label="Capture Image">
               <TbCamera size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input area ── */}
      <div className="cyclos-ai-input-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />

        <button
          className="cyclos-ai-action-btn"
          onClick={() => setShowScanner(true)}
          aria-label="Scan object"
          title="Scan object using camera"
        >
          <TbCamera size={22} />
        </button>

        <button
          className="cyclos-ai-action-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload waste image"
          title="Upload a waste image"
        >
          <TbPhoto size={22} />
        </button>

        <button
          className={`cyclos-ai-action-btn ${isListening ? 'listening' : ''}`}
          onClick={() => setIsListening(!isListening)}
          aria-label="Toggle microphone"
          title="Speak to Cyclos AI"
        >
          {isListening ? <TbMicrophoneOff size={22} /> : <TbMicrophone size={22} />}
        </button>

        <input
          ref={inputRef}
          className="cyclos-ai-input"
          placeholder={isListening ? "Listening..." : "Message Cyclos AI..."}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isListening}
        />

        <button
          className="cyclos-ai-send-btn"
          onClick={() => sendMessage(inputVal)}
          aria-label="Send message"
        >
          <TbSend size={18} />
        </button>
      </div>
    </div>
  );
}
