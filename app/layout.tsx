import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import StoreProvider from "@/lib/redux/provider";

export const metadata: Metadata = {
  title: "Poker Analytics - Покерная аналитика",
  description: "Инструмент для анализа покерных игр и турниров",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-gray-950 text-gray-100`}
      >
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
