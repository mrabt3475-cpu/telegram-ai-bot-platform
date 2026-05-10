'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AIChat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [bots, setBots] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchBots();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchBots = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/bots', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBots(res.data.bots);
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
        { message: input, model: selectedModel, botId: bots[0]?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const aiMessage = { role: 'assistant', content: res.data.response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = { role: 'error', content: 'Failed to get response. Please try again.', timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  const clearChat = () => setMessages([]);

  const models = [
    { id: 'gpt-4', name: 'GPT-4', icon: '🤖' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5', icon: '⚡' },
    { id: 'claude-3', name: 'Claude 3', icon: '🧠' },
    { id: 'gemini-pro', name: 'Gemini Pro', icon: '✨' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">AI Chat</h1>
          <nav className="flex gap-4">
            <a href="/dashboard" className="text-gray-600 hover:text-primary">Dashboard</a>
            <a href="/profile" className="text-gray-600 hover:text-primary">Profile</a>
            <a href="/integrations" className="text-gray-600 hover:text-primary">Integrations</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="card h-[calc(100vh-200px)] flex flex-col">
          {/* Model Selector */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <span className="text-sm text-gray-500">Model:</span>
            <div className="flex gap-2">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`px-3 py-1 rounded-full text-sm ${selectedModel === model.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {model.icon} {model.name}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-2xl mb-2">💬</p>
                <p>Start a conversation with AI</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-4 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white' : msg.role === 'error' ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-50 mt-2 block">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-lg">
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
          <form onSubmit={sendMessage} className="border-t pt-4 flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
              Send
            </button>
            <button type="button" onClick={clearChat} className="btn btn-secondary">
              Clear
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}