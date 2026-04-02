import type { ReactNode } from "react";

import { AppHeader } from "@/components/ui/app-header";

type AppShellProps = {
  children: ReactNode;
};

/**
 * Single outer app shell for the whole site.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <AppHeader />
      <main className="app-main">{children}</main>
    </>
  );
}