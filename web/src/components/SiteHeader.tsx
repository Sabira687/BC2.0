"use client";
/**
 * <SiteHeader /> — night navigation bar: AIGO COLLECTION wordmark + nav
 * (Collection · Console · Guide · Progress · Premium; Home = the wordmark). Highlights the current route via aria-current.
 * No props. Styles live in app/globals.css (.siteHeader, .siteNav ...).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string }[] = [
  { href: "/collection", label: "Collection" },
  { href: "/console", label: "Console" },
  { href: "/guide", label: "Guide" },
  { href: "/progress", label: "Progress" },
  { href: "/pro", label: "Premium" },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** The landing page ("/") has its own header with section anchors; the app header is hidden there only. */
export function hidesAppHeader(pathname: string): boolean {
  return pathname === "/";
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  if (hidesAppHeader(pathname)) return null; // the landing renders its own header
  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <Link href="/" className="wordmark" aria-label="AIGO Collection home">
          <span className="wordmarkMain">AIGO</span>
          <span className="wordmarkSub">COLLECTION</span>
        </Link>
        <nav aria-label="Main" className="siteNav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(pathname, n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
