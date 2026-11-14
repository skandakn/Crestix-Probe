import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { MobileBottomNav } from "@/components/pwa/mobile-bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Crestix Probe — Urban Flood Forecasting & Telemetry Command",
  description:
    "Scientific planetary instrumentation, physics-informed neural flood forecasting, hydrodynamic simulation, and ESP32 telemetry enclave.",
  applicationName: "Crestix Probe",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Crestix Probe",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-white text-[#1d1d1f] selection:bg-blue-500/15 selection:text-[#0071e3]`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#1d1d1f] pb-16 lg:pb-0 overflow-x-hidden">
        <AuthProvider>
          <PWAProvider>
            {children}
            <MobileBottomNav />
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
