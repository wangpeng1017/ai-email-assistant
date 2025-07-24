import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppQueryProvider } from "@/providers/QueryProvider";

// 移除StagewiseToolbar，因为它在Server Component中不能使用ssr: false

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI邮件自动化助手",
  description: "智能邮件自动化生成工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppQueryProvider>
          <AuthProvider>
            {children}
            {/* StagewiseToolbar已移除 */}
          </AuthProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
