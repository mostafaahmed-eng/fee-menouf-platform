import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FEE-MENOUF | Faculty of Engineering - Menoufia University",
    template: "%s | FEE-MENOUF",
  },
  description:
    "Smart University Platform for Faculty of Engineering, Menoufia University. Academic management, attendance tracking, grades, and more.",
  keywords: [
    "FEE-MENOUF",
    "Menoufia University",
    "Engineering",
    "Academic Platform",
    "Student Management",
  ],
  authors: [{ name: "FEE-MENOUF" }],
  creator: "FEE-MENOUF",
  publisher: "FEE-MENOUF",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_EG",
    siteName: "FEE-MENOUF Platform",
    title: "FEE-MENOUF | Faculty of Engineering - Menoufia University",
    description:
      "Smart University Platform for Faculty of Engineering, Menoufia University.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={inter.variable}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
