import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-screen lg:grid items-center hidden relative">
            {/* Background image */}
            <GridShape />

            {/* Content on top */}
            <div className="relative flex flex-col items-center max-w-xs mx-auto z-10">
              <Link href="/" className="block mb-4">
                <Image
                  width={231}
                  height={48}
                  src="./images/logo/logo-dark.svg"
                  alt="Logo"
                />
              </Link>
              <p className="text-center text-gray-200 dark:text-white/80">
                Phần mềm quản lý bảo dưỡng xe điện cho trung tâm dịch vụ
              </p>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
