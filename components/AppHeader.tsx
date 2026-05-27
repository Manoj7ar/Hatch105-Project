"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HatchLogo } from "./HatchLogo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Rankings" },
  { href: "/compare", label: "Compare" },
  { href: "/chat", label: "Ask dataset" },
] as const;

type AppHeaderProps = {
  fullWidth?: boolean;
};

export function AppHeader({ fullWidth = false }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="shrink-0 border-b border-black/10 bg-white">
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between gap-6 px-4 py-3",
          fullWidth ? "max-w-3xl" : "max-w-4xl px-6 py-4"
        )}
      >
        <HatchLogo height={28} />
        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "hatch-nav-link",
                pathname === href && "hatch-nav-link--active"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
