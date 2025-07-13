"use client";
import { SessionProvider } from "next-auth/react";
import { SettingsProvider } from "./SettingsProvider";
import Header from "./header";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>
      <Header />
      {children}
      </SettingsProvider>
    </SessionProvider>
  );
} 