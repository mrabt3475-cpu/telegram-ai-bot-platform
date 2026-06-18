'use client';
import { useState, useRef, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

function ChatInner() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/api/ai/chat', { message: userMsg.content, history: messages });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply || res.message || '...' }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
      <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-y-auto mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`mb-4 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100'}`}>
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400 text-sm">AI is typing...</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..."
          className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
        <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-3 rounded-lg disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatInner />
    </ProtectedRoute>
  );
}