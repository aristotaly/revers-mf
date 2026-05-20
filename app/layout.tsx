import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { DashboardHomeButton } from "@/components/layout/dashboard-home-button";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Weight Trend Tracker",
  description: "Log daily scale weight and see your EWMA weight trend.",
  applicationName: "Weight Trend",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Weight Trend",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#5b21b6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-neutral-50 font-sans antialiased">
        <div className="mx-auto min-h-screen max-w-md">{children}</div>
        <DashboardHomeButton />
        <Toaster richColors position="top-center" />
        <PwaRegister />
      </body>
    </html>
  );
}
