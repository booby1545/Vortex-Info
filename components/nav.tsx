"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Code2, Ghost, Home, Music } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";

const NAV_LINKS = [
  { href: "/", label: { ru: "Главная", en: "Home" }, icon: Home },
  { href: "/spotx", label: { ru: "SpotX", en: "SpotX" }, icon: Music },
  { href: "/lost-souls", label: { ru: "Lost Souls", en: "Lost Souls" }, icon: Ghost },
  { href: "/projects", label: { ru: "Мои проекты", en: "My Projects" }, icon: Code2 },
];

interface GlassRect {
  left: number;
  width: number;
}

export function Nav() {
  const pathname = usePathname();
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [glass, setGlass] = useState<GlassRect | null>(null);

  const targetHref = hoveredHref ?? pathname;

  useLayoutEffect(() => {
    // Measuring layout to position the glass slider can only happen after
    // the nav has painted — there's no pure-render equivalent for reading
    // ref geometry, so this is one of the legitimate DOM-measurement effects.
    function measure() {
      const container = containerRef.current;
      const target = itemRefs.current[targetHref] ?? itemRefs.current[pathname];
      if (!container || !target) return;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setGlass({
        left: targetRect.left - containerRect.left,
        width: targetRect.width,
      });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [targetHref, pathname]);

  return (
    <header className="border-b border-border/60">
      <nav
        ref={containerRef}
        onMouseLeave={() => setHoveredHref(null)}
        className="relative mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 px-4 py-5 2xl:max-w-[80rem]"
      >
        {glass && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-1.5 rounded-full border border-white/25 bg-gradient-to-b from-white/20 via-white/8 to-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-6px_10px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-md"
            animate={{ left: glass.left, width: glass.width, opacity: 1 }}
            initial={false}
            transition={{ type: "spring", stiffness: 260, damping: 32, mass: 1 }}
          >
            <div className="absolute inset-x-3 top-0 h-px rounded-full bg-white/60 blur-[1px]" />
          </motion.div>
        )}
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              ref={(el) => {
                itemRefs.current[href] = el;
              }}
              onMouseEnter={() => setHoveredHref(href)}
              onFocus={() => setHoveredHref(href)}
              onBlur={() => setHoveredHref(null)}
              className={cn(
                "relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active ? "text-accent" : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={2} />
              {t(label)}
            </Link>
          );
        })}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
