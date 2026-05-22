import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://vibe-route.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Vibe Route — Eksplorasi Tempat & Rute Perjalanan",
    template: "%s | Vibe Route",
  },
  description:
    "Temukan tempat menarik di sekitar Anda, buat rute perjalanan, dan dapatkan rekomendasi dari asisten AI.",
  keywords: ["peta", "rute", "tempat makan", "wisata", "navigasi", "Indonesia"],
  authors: [{ name: "Vibe Route" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: BASE_URL,
    siteName: "Vibe Route",
    title: "Vibe Route — Eksplorasi Tempat & Rute Perjalanan",
    description:
      "Temukan tempat menarik di sekitar Anda, buat rute perjalanan, dan dapatkan rekomendasi dari asisten AI.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vibe Route — Peta Interaktif Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Route — Eksplorasi Tempat & Rute Perjalanan",
    description: "Temukan tempat menarik, buat rute, dan dapatkan rekomendasi AI.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
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
