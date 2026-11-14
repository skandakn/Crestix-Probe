import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crestix Probe — Deep Space Telemetry & Enclave Command",
  description:
    "Scientific planetary instrumentation, sensor telemetry, and secure operator enclave authentication.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#06080e] text-slate-100`}
    >
      <body className="min-h-full flex flex-col bg-[#06080e] text-slate-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
