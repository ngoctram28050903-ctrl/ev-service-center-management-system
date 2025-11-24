import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 👇 Import Widget
import CustomerChatWidget from "@/components/chat/CustomerChatWidget"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EV Service Center",
  description: "Hệ thống bảo dưỡng xe điện",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Phần Main Content */}
        {children}
        
        {/* 👇 Gắn Chat Widget vào đây (Nó sẽ nổi lên trên cùng) */}
        <CustomerChatWidget />
        
      </body>
    </html>
  );
}