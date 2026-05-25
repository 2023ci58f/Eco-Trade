import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getSocket, joinConversation, leaveConversation, sendTyping } from '../utils/socket';
import { formatDateTime, timeAgo, getInitials } from '../utils/helpers';
import { SpinnerPage, EmptyState } from '../components/shared/index.jsx';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    api.get('/chat/conversations').then(r => {
      setConversations(r.data.data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (conversationId) {
      const conv = conversations.find(c => c._id === conversationId);
      if (conv) selectConversation(conv);
    }
  }, [conversationId, conversations]);

  const selectConversation = async (conv) => {
    if (activeConv) leaveConversation(activeConv._id);
    setActiveConv(conv);
    navigate(`/chat/${conv._id}`, { replace: true });
    try {
      const { data } = await api.get(`/chat/conversations/${conv._id}/messages`);
      setMessages(data.data || []);
      joinConversation(conv._id);
    } catch { }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeConv) return;
    const handleMsg = (msg) => {
      if (msg.conversation === activeConv._id) {
        setMessages(prev => [...prev, msg]);
        setConversations(prev => prev.map(c => c._id === activeConv._id ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt } : c));
      }
    };
    const handleTyping = ({ userId: tid, name, isTyping }) => {
      if (tid !== user?._id) setTyping(isTyping ? name : null);
    };
    socket.on('message', handleMsg);
    socket.on('user_typing', handleTyping);
    return () => { socket.off('message', handleMsg); socket.off('user_typing', handleTyping); };
  }, [activeConv, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleInput = (val) => {
    setInput(val);
    if (activeConv) {
      sendTyping(activeConv._id, true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => sendTyping(activeConv._id, false), 1500);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    try {
      setSending(true);
      const { data } = await api.post(`/chat/conversations/${activeConv._id}/messages`, { content: input.trim() });
      setMessages(prev => [...prev, data.data]);
      setInput('');
    } catch { toast.error('Failed to send message'); } finally { setSending(false); }
  };

  const getOtherParticipant = (conv) => conv.participants?.find(p => p._id !== user?._id);

  if (loading) return <SpinnerPage />;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Conversations sidebar */}
      <div className="w-80 border-r border-gray-100 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-syne font-bold text-lg">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <EmptyState icon="💬" title="No conversations" subtitle="Start chatting with publishers or manufacturers" />
          ) : (
            conversations.map(conv => {
              const other = getOtherParticipant(conv);
              return (
                <button key={conv._id} onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeConv?._id === conv._id ? 'bg-[#f0fdf4] border-l-2 border-l-[#2D6A4F]' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#D8F3DC] rounded-full flex items-center justify-center text-[#2D6A4F] font-semibold text-sm flex-shrink-0">
                      {getInitials(other?.name || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-gray-900 truncate">{other?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400 flex-shrink-0 ml-1">{conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage?.content || (conv.listing ? `Re: ${conv.listing.title}` : 'New conversation')}</p>
                      {other?.role && <span className="text-xs text-[#2D6A4F] capitalize">{other.role}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-cream">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon="💬" title="Select a conversation" subtitle="Choose a conversation from the left to start messaging" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D8F3DC] rounded-full flex items-center justify-center text-[#2D6A4F] font-semibold">
                {getInitials(getOtherParticipant(activeConv)?.name || 'U')}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{getOtherParticipant(activeConv)?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{getOtherParticipant(activeConv)?.role}</p>
              </div>
              {activeConv.listing && (
                <div className="ml-auto">
                  <span className="badge bg-[#D8F3DC] text-[#2D6A4F] text-xs">Re: {activeConv.listing.title}</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-8 h-8 bg-[#D8F3DC] rounded-full flex items-center justify-center text-[#2D6A4F] text-xs font-semibold mr-2 flex-shrink-0 mt-1">
                        {getInitials(msg.sender?.name || 'U')}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-[#2D6A4F] text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'}`}>
                        {msg.content}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-1">{timeAgo(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              {typing && <p className="text-xs text-gray-400 italic">{typing} is typing...</p>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="bg-white border-t border-gray-100 p-4 flex gap-3">
              <input
                className="input flex-1"
                placeholder="Type a message..."
                value={input}
                onChange={e => handleInput(e.target.value)}
                disabled={sending}
              />
              <button type="submit" disabled={!input.trim() || sending} className="btn-primary px-6 disabled:opacity-50">
                {sending ? '...' : '→'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
