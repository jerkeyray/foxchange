"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, LayoutDashboard, BookOpen, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/how-it-works", label: "How It Works", icon: BookOpen },
  { href: "/sandbox", label: "Sandbox", icon: FlaskConical },
];

export function Nav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="text-[15px] font-bold tracking-tight shrink-0">
          FoxChange
        </Link>

        {/* Separator */}
        <div className="w-px h-5 bg-border/60" />

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors",
                  isActive
                    ? "text-foreground font-medium bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors hidden sm:block"
          >
            v0.1.0
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="w-[15px] h-[15px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-[15px] h-[15px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  );
}
