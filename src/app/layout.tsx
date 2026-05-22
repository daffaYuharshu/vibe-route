import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vibe Route — Eksplorasi Tempat & Rute Perjalanan",
  description:
    "Temukan tempat menarik di sekitar Anda, buat rute perjalanan, dan dapatkan rekomendasi dari asisten AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="h-full bg-[#F8FAFC] antialiased">{children}</body>
    </html>
  );
}
