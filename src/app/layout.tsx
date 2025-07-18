import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "./components/AppProviders";
import { ThemeProvider } from "next-themes";
import AIAgent from "./components/AIAgent";

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
      <body className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AppProviders>
            <main className="flex-1 mx-2 sm:mx-4 md:mx-8 lg:mx-[10%] pt-16 sm:pt-20 md:pt-25">{children}</main>
            <AIAgent />
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
