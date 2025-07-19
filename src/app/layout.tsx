import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "./components/AppProviders";
import { ThemeProvider } from "next-themes";
import AIAgent from "./components/AIAgent";
import Head from 'next/head';
import { FaHome, FaCalendarCheck, FaTasks, FaUser, FaCog } from "react-icons/fa";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EduTracker",
  description: "Help you with Acadamics Management",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>
      <body className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AppProviders>
            <main className="flex-1 mx-2 sm:mx-4 md:mx-8 lg:mx-[10%] pt-16 sm:pt-20 md:pt-25">{children}</main>
            <AIAgent />
          </AppProviders>
          {/* Bottom Nav Bar for mobile, visible on all pages */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-light)] border-t border-[var(--border)] flex justify-around items-center py-2 sm:hidden" style={{ boxShadow: '0 -2px 12px 0 rgba(0,0,0,0.06)' }}>
            <Link href="/" className="flex flex-col items-center text-[var(--primary)] hover:text-[var(--primary)]/80 text-xs">
              <FaHome className="text-xl mb-0.5" />
              Home
            </Link>
            <Link href="/schedule" className="flex flex-col items-center text-[var(--text)] hover:text-[var(--primary)] text-xs">
              <FaCalendarCheck className="text-xl mb-0.5" />
              Schedule
            </Link>
            <Link href="/todo" className="flex flex-col items-center text-[var(--text)] hover:text-[var(--primary)] text-xs">
              <FaTasks className="text-xl mb-0.5" />
              ToDo
            </Link>
            <Link href="/profile" className="flex flex-col items-center text-[var(--text)] hover:text-[var(--primary)] text-xs">
              <FaUser className="text-xl mb-0.5" />
              Profile
            </Link>
          </nav>
        </ThemeProvider>
      </body>
    </html>
  );
}
