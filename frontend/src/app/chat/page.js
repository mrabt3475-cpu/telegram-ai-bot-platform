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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUsage();
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
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:3000/api/ai/chat',
        { message: input, history: messages },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const aiMessage = { role: 'assistant', content: res.data.response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      setUsage(res.data.usage);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to get response';
      const errorMessage = { role: 'error', content: errorMsg, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">🤖 AI Chat</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {usage.messages} / {usage.limit} messages
            </span>
            <nav className="flex gap-3 text-sm">
              <a href="/dashboard" className="text-gray-600 hover:text-primary">Dashboard</a>
              <a href="/profile" className="text-gray-600 hover:text-primary">Profile</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="card h-[calc(100vh-220px)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <p className="text-4xl mb-3">🤖</p>
                <p className="text-lg">Start chatting with AI</p>
                <p className="text-sm mt-2">Powered by your custom AI model</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-br-md' 
                    : msg.role === 'error' 
                      ? 'bg-red-100 text-red-700 rounded-bl-md'
                      : 'bg-gray-100 rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <span className="text-xs opacity-60 mt-2 block">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t pt-4 flex gap-3">
            <input
              type="text"
              className="input flex-1"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || usage.messages >= usage.limit}
            />
            <button 
              type="submit" 
              className="btn btn-primary px-6"
              disabled={loading || !input.trim() || usage.messages >= usage.limit}
            >
              {loading ? '...' : 'Send'}
            </button>
            <button type="button" onClick={clearChat} className="btn btn-secondary">
              Clear
            </button>
          </form>
          
          {usage.messages >= usage.limit && (
            <p className="text-center text-red-500 text-sm mt-2">
              ⚠️ Monthly limit reached. Upgrade your plan for more messages.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}