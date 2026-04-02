"use client";

import type { ReactNode } from "react";

import { SessionProvider } from "@/features/session/session-context";

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Central place for all top-level client providers.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
}