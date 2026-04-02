import Link from "next/link";

import { APP_NAME, ROUTES } from "@ai-dj/shared";

import { Container } from "@/components/ui/container";

/**
 * Primary site header and navigation.
 */
export function AppHeader() {
  const navItems = [
    { label: "Home", href: ROUTES.home },
    { label: "Player", href: ROUTES.player },
    { label: "Chat", href: ROUTES.chat },
    { label: "Session", href: ROUTES.session },
  ];

  return (
    <header className="app-header">
      <Container>
        <div className="app-header__inner">
          <Link href={ROUTES.home} className="app-brand">
            {APP_NAME}
          </Link>

          <nav aria-label="Primary" className="app-nav">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="app-nav__link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  );
}