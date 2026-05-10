import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { dummyChats, dummyUsers } from '../assets/assets';
import { platformIcons } from '../assets/assets';
import {
  Send, ArrowLeft, MessageCircle, Circle, Search, X
} from 'lucide-react';
import Footer from '../components/Footer';

const Messages = () => {
  const { user } = useUser();
  const currency = import.meta.env.VITE_CURRENCY || '$';

  const [chats, setChats] = useState(dummyChats);
  const [activeChat, setActiveChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showChatPanel, setShowChatPanel] = useState(false); // mobile
  const messagesEndRef = useRef(null);

  const filteredChats = chats.filter(c => {
    const q = searchInput.toLowerCase();
    return (
      c.listing?.title?.toLowerCase().includes(q) ||
      c.chatUser?.name?.toLowerCase().includes(q) ||
      c.ownerUser?.name?.toLowerCase().includes(q)
    );
  });

  const openChat = (chat) => {
    // Mark as read
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, isLastMessageRead: true } : c));
    setActiveChat(chat);
    setShowChatPanel(true);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !activeChat) return;
    const newMsg = {
      id: `msg_${Date.now()}`,
      chatId: activeChat.id,
      sender_id: 'user_1', // current user (demo)
      message: messageInput.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedChat = {
      ...activeChat,
      messages: [...(activeChat.messages || []), newMsg],
      lastMessage: newMsg.message,
      updatedAt: newMsg.createdAt,
    };
    setChats(prev => prev.map(c => c.id === activeChat.id ? updatedChat : c));
    setActiveChat(updatedChat);
    setMessageInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const getOtherUser = (chat) => {
    // In demo: current user = user_1 (sender), other = ownerUser
    return chat.ownerUser || chat.chatUser;
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const diff = today - d;
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 px-6 md:px-16 lg:px-24 xl:px-32 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Messages</h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex h-[calc(100vh-220px)] min-h-[480px]">

          {/* ——— LEFT: Chat list ——— */}
          <div className={`flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-100 flex-shrink-0 ${showChatPanel ? 'hidden md:flex' : 'flex'}`}>
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <label className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search conversations..."
                  className="flex-1 text-sm outline-none bg-transparent text-gray-700"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </label>
            </div>

            {/* Chat items */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageCircle size={32} className="text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No conversations found</p>
                </div>
              ) : filteredChats.map(chat => {
                const other = getOtherUser(chat);
                const isActive = activeChat?.id === chat.id;
                const hasUnread = !chat.isLastMessageRead;

                return (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    className={`w-full flex items-start gap-3 px-4 py-4 border-b border-gray-50 text-left transition hover:bg-indigo-50/40 ${isActive ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={other?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'User')}&background=e0e7ff&color=4f46e5`}
                        alt={other?.name}
                        className="size-10 rounded-full object-cover border border-gray-200"
                      />
                      {chat.active && (
                        <Circle size={9} className="absolute bottom-0 right-0 text-green-500 fill-green-500 stroke-white stroke-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-gray-800 truncate">{other?.name || 'User'}</p>
                        <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDate(chat.updatedAt)}</p>
                      </div>
                      <p className="text-xs text-indigo-500 truncate mb-1 capitalize">{chat.listing?.platform} · {chat.listing?.title}</p>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate ${hasUnread ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                          {chat.lastMessage}
                        </p>
                        {hasUnread && (
                          <span className="ml-2 flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ——— RIGHT: Chat thread ——— */}
          <div className={`flex flex-col flex-1 min-w-0 ${showChatPanel ? 'flex' : 'hidden md:flex'}`}>
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white">
                  {/* Mobile back */}
                  <button className="md:hidden text-gray-500 hover:text-gray-700 mr-1" onClick={() => setShowChatPanel(false)}>
                    <ArrowLeft size={20} />
                  </button>

                  {(() => {
                    const other = getOtherUser(activeChat);
                    return (
                      <>
                        <img
                          src={other?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=e0e7ff&color=4f46e5`}
                          alt={other?.name}
                          className="size-9 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">{other?.name}</p>
                          <p className="text-xs text-gray-400 capitalize truncate">{activeChat.listing?.platform} · {activeChat.listing?.title}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {platformIcons[activeChat.listing?.platform]}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Listing Preview Strip */}
                <div className="px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {activeChat.listing?.images?.[0] && (
                      <img src={activeChat.listing.images[0]} alt="" className="size-8 rounded-lg object-cover border border-indigo-100 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{activeChat.listing?.title}</p>
                      <p className="text-xs text-indigo-600 font-semibold">{currency}{activeChat.listing?.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
                  {(activeChat.messages || []).map((msg, i) => {
                    const isMe = msg.sender_id === 'user_1';
                    return (
                      <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <img
                            src={getOtherUser(activeChat)?.image || `https://ui-avatars.com/api/?name=U&background=e0e7ff&color=4f46e5`}
                            alt=""
                            className="size-7 rounded-full object-cover mr-2 self-end flex-shrink-0"
                          />
                        )}
                        <div className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-2.5 ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'} text-right`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-4 bg-white border-t border-gray-100">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none transition"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim()}
                      className="flex-shrink-0 w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle size={28} className="text-indigo-400" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Your messages</h3>
                <p className="text-sm text-gray-400 max-w-xs">Select a conversation from the left to start chatting with buyers and sellers.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Messages;
