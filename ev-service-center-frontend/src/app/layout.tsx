import { Roboto } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ToasterProvider from '@/components/ui/toast';

const roboto = Roboto({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${roboto.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <ToasterProvider />
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
