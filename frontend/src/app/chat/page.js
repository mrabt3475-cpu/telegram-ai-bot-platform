'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AIChat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ messages: 0, limit: 100 });
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    personality: 'helpful'
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
    else fetchUsage();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/ai/usage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsage(res.data.usage);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:3000/api/ai/chat',
        { message: input, history: messages, ...settings },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const aiMsg = { role: 'assistant', content: res.data.response, time: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setUsage(res.data.usage);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: err.response?.data?.message || 'Error', time: new Date() }]);
    }
    setLoading(false);
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-white font-bold">AI Assistant</h1>
              <p className="text-purple-300 text-xs">Custom AI Model</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white text-sm">{usage.messages}/{usage.limit}</p>
              <p className="text-purple-300 text-xs">messages</p>
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-white/10 px-4 py-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-purple-300 text-sm block mb-2">Temperature: {settings.temperature}</label>
              <input 
                type="range" min="0" max="1" step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-purple-300 text-sm block mb-2">Max Tokens: {settings.maxTokens}</label>
              <input 
                type="range" min="256" max="4096" step="256"
                value={settings.maxTokens}
                onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-purple-300 text-sm block mb-2">Personality</label>
              <select 
                value={settings.personality}
                onChange={(e) => setSettings({...settings, personality: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-lg p-2"
              >
                <option value="helpful">Helpful</option>
                <option value="creative">Creative</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Messages */}
          <div className="h-[calc(100%-80px)] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl">✨</span>
                </div>
                <h2 className="text-2xl text-white font-bold mb-2">Start a Conversation</h2>
                <p className="text-purple-300">Powered by your custom AI model</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm' 
                    : msg.role === 'error' 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-white/10 text-white rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-xs opacity-50 mt-2">
                    {msg.time?.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 p-4 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }}></span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="h-20 border-t border-white/10 p-4 flex gap-3">
            <input
              type="text"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
              disabled={loading || usage.messages >= usage.limit}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !input.trim() || usage.messages >= usage.limit}
              className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? '⏳' : '➤'}
            </button>
            <button 
              onClick={clearChat}
              className="px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
            >
              🗑️
            </button>
          </div>
        </div>

        {usage.messages >= usage.limit && (
          <p className="text-center text-red-400 mt-4">⚠️ Monthly limit reached. <a href="/billing" className="underline">Add points →</a></p>
        )}
      </main>
    </div>
  );
}