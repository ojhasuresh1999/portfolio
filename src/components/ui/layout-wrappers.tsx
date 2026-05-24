"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function NavbarWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Don't show Navbar on admin or chat routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/chat")) {
    return null;
  }
  return <>{children}</>;
}

export function FooterWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Don't show Footer on admin or chat routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/chat")) {
    return null;
  }
  return <>{children}</>;
}
