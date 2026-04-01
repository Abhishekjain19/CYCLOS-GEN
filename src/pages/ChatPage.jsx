import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TbChevronLeft, TbUserCircle, TbSend } from 'react-icons/tb';
import ReactMarkdown from 'react-markdown';
import { getChatResponse } from '../services/nvidiaNim';
import './ChatPage.css';

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { 
      id: 'welcome', 
      user: 'EcoCaptain', 
      message: 'Hello! I am EcoCaptain, your marine waste management expert. How can I help you protect our oceans today?', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      mine: false 
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || typing) return;
    
    const userMsg = { 
      id: Date.now(), 
      user: 'You', 
      message: input, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      mine: true 
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      // Prepare history for API (excluding system prompt which is in the service)
      const history = messages.concat(userMsg).map(m => ({
        role: m.mine ? 'user' : 'assistant',
        content: m.message
      }));

      const response = await getChatResponse(history);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        user: 'EcoCaptain',
        message: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mine: false
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        user: 'EcoCaptain',
        message: 'Sorry, I encountered an error. Please try again later.',
        time: 'Error',
        mine: false
      }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="chat-back-btn" onClick={() => navigate(-1)}>
          <TbChevronLeft size={24} />
        </button>
        <div className="chat-header-info">
          <TbUserCircle size={32} />
          <div className="chat-user-details">
             <span className="chat-user-name">Eco Support / Community</span>
             <span className="chat-user-status">Online</span>
          </div>
        </div>
      </div>

      <div className="chat-body">
        {messages.map((m) => (
          <motion.div 
            key={m.id} 
            className={`chat-bubble-container ${m.mine ? 'mine' : 'theirs'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {!m.mine && <span className="chat-bubble-user">{m.user}</span>}
            <div className="chat-bubble">
              <ReactMarkdown>{m.message}</ReactMarkdown>
              <span className="chat-bubble-time">{m.time}</span>
            </div>
          </motion.div>
        ))}
        {typing && (
          <motion.div 
            className="chat-bubble-container theirs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="chat-bubble-user">EcoCaptain</span>
            <div className="chat-bubble typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="chat-input-area">
        <div className="chat-input-pill">
          <input 
            placeholder="Type a message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="chat-send-btn" onClick={handleSend}>
            <TbSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
