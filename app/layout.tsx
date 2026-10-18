import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Packet Panic — Networking Escape Room",
  description: "An interactive computer networking challenge for college students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-pp-bg text-pp-text`}>
        {children}
      </body>
    </html>
  );
}