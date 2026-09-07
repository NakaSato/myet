"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/essays", label: "Essays" },
  { href: "/stats", label: "Progress" },
  { href: "/settings", label: "Settings" },
];

/** The exam screen owns the whole viewport — no app chrome, like the real test. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/write") return <>{children}</>;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-background/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-2.5 text-sm">
          <Link href="/" className="mr-4 flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#e31e24]" aria-hidden />
            IELTS Prep
          </Link>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                isActive(n.href) ? "bg-panel-2 text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link href="/write" className="btn-primary ml-auto !py-1.5 !text-xs">
            Start timed essay
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{children}</main>
    </>
  );
}
