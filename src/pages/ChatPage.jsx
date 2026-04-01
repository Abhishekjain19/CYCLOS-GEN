import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TbChevronLeft, TbSend, TbUserCircle } from 'react-icons/tb';
import './ChatPage.css';

const MOCK_CHATS = [
  { id: 1, user: 'Eco Collector', message: 'I can pick up the plastic items today at 5 PM.', time: '12:45 PM', mine: false },
  { id: 2, user: 'You', message: 'Sure, that works for me. I have sorted them.', time: '12:48 PM', mine: true },
];

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(MOCK_CHATS);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), user: 'You', message: input, time: 'Just now', mine: true }]);
    setInput('');
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
              {m.message}
              <span className="chat-bubble-time">{m.time}</span>
            </div>
          </motion.div>
        ))}
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
