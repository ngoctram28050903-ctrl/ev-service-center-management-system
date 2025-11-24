"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth"; // Hook lấy user hiện tại của bạn
import { sendMessage, subscribeToMessages, ChatMessage } from "@/services/firebaseChatService";

export default function ChatBox({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Đăng ký lắng nghe realtime
    const unsubscribe = subscribeToMessages(roomId, (data) => {
      setMessages(data);
      // Tự động cuộn xuống cuối
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe(); // Hủy lắng nghe khi đóng chat
  }, [roomId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await sendMessage(roomId, newMessage, user);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-white dark:bg-gray-800">
      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-lg p-3 ${
                isMe ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
              }`}>
                <p className="text-xs opacity-70 mb-1">{msg.senderName}</p>
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Form nhập */}
      <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-700 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 border rounded-lg px-4 py-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition">
          Gửi
        </button>
      </form>
    </div>
  );
}