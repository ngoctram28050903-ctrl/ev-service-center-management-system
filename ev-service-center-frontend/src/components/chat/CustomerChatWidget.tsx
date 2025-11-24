"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToMessages, sendMessage, ChatMessage } from "@/services/firebaseChatService";

export default function CustomerChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false); // Trạng thái đóng/mở
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // RoomID của khách chính là UserID của họ (Mỗi khách 1 phòng riêng)
  const roomId = user?.id?.toString();

  // 1. Lắng nghe tin nhắn (Real-time)
  useEffect(() => {
    if (!isOpen || !roomId) return;

    const unsubscribe = subscribeToMessages(roomId, (data) => {
      setMessages(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [isOpen, roomId]);

  // 2. Gửi tin nhắn
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !roomId) return;

    try {
      await sendMessage(roomId, text, {
        id: user.id,
        role: "USER", // Quan trọng: Đánh dấu là USER gửi
        name: user.username || user.email || "Khách",
        email: user.email
      });
      setText("");
    } catch (err) {
      console.error("Lỗi gửi tin:", err);
    }
  };

  // Nếu chưa đăng nhập thì không hiện chat
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* --- CỬA SỔ CHAT (Chỉ hiện khi isOpen = true) --- */}
      {isOpen && (
        <div className="w-80 h-96 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl flex flex-col mb-4 border dark:border-gray-700 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold">Hỗ trợ trực tuyến</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">✖</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && (
              <p className="text-center text-xs text-gray-400 mt-4">Hãy nhắn gì đó cho Admin...</p>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderRole === "USER";
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    isMe 
                      ? "bg-blue-500 text-white rounded-br-none" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t flex gap-2">
            <input
              className="flex-1 border rounded-full px-3 py-1 text-sm focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nhập tin nhắn..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" disabled={!text.trim()} className="text-blue-600 font-bold text-sm disabled:opacity-50">
              Gửi
            </button>
          </form>
        </div>
      )}

      {/* --- NÚT TRÒN (FLOATING BUTTON) --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition transform hover:scale-110"
      >
        {isOpen ? (
          <span className="text-2xl font-bold">▼</span>
        ) : (
          // Icon tin nhắn (SVG)
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        )}
      </button>
    </div>
  );
}