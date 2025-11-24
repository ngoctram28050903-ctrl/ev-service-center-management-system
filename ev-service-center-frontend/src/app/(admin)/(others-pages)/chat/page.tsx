"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth"; // Hook lấy user của bạn
import { 
  subscribeToChatRooms, 
  subscribeToMessages, 
  sendMessage, 
  ChatRoom, 
  ChatMessage 
} from "@/services/firebaseChatService";

export default function AdminChatPage() {
  const { user } = useAuth();
  
  // State quản lý danh sách phòng và phòng đang chọn
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  // State quản lý tin nhắn và input
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load danh sách phòng chat (Sidebar)
  useEffect(() => {
    const unsubscribe = subscribeToChatRooms((data) => {
      setRooms(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. Load tin nhắn khi chọn một phòng
  useEffect(() => {
    if (!selectedRoomId) return;
    
    const unsubscribe = subscribeToMessages(selectedRoomId, (data) => {
      setMessages(data);
      // Scroll xuống cuối
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [selectedRoomId]);

  // 3. Xử lý gửi tin nhắn (Admin trả lời)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoomId || !user) return;

    try {
      await sendMessage(selectedRoomId, inputText, {
        id: user.id,
        role: "ADMIN", // Cứng role là ADMIN
        name: user.username || "Admin",
        email: user.email
      });
      setInputText("");
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  return (
    <div className="relative z-10 flex h-[calc(100vh-80px)] border rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-900">

      {/* --- SIDEBAR TRÁI: Danh sách khách hàng --- */}
      <div className="w-1/3 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <h2 className="font-bold text-lg text-gray-700 dark:text-gray-200">Hộp thư hỗ trợ</h2>
          <p className="text-xs text-gray-500">{rooms.length} cuộc hội thoại</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <p className="text-center p-4 text-gray-400">Chưa có tin nhắn nào.</p>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`p-4 border-b cursor-pointer transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  selectedRoomId === room.id ? "bg-blue-50 dark:bg-gray-800 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                    {room.customerName || `Khách #${room.id}`}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {formatChatTime(room.updatedAt)}
                  </span>
                  {/* <span className="text-xs text-gray-400">10:00 AM</span> (Bạn có thể format date ở đây) */}
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">
                  {room.lastMessage}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- CỬA SỔ CHÍNH: Nội dung chat --- */}
      <div className="w-2/3 flex flex-col bg-gray-50 dark:bg-gray-900">
        {selectedRoomId ? (
          <>
            {/* Header chat */}
            <div className="p-4 bg-white dark:bg-gray-800 shadow-sm border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-700 dark:text-white">
                  Đang chat với: {rooms.find(r => r.id === selectedRoomId)?.customerName}
                </h3>
                <span className="text-xs text-green-500">● Đang hoạt động</span>
              </div>
            </div>

            {/* List tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isAdmin = msg.senderRole === "ADMIN";
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                      isAdmin 
                        ? "bg-blue-600 text-white rounded-br-none" 
                        : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input gửi tin */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-800 border-t flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập câu trả lời..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 font-medium disabled:opacity-50 transition"
              >
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p>Chọn một cuộc hội thoại để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
}
const formatChatTime = (timestamp: any) => {
  if (!timestamp || !timestamp.toDate) return "";
  
  // Chuyển Firestore Timestamp sang JS Date object
  const date = timestamp.toDate(); 
  
  const now = new Date();
  // Nếu là tin nhắn hôm nay
  if (date.toDateString() === now.toDateString()) {
    // Hiển thị Giờ: Phút (ví dụ: 14:30)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } else {
    // Nếu là tin nhắn từ ngày trước đó, hiển thị Ngày/Tháng (ví dụ: 24/11)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }
};