"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Seletor de tema: Claro, Escuro ou Sistema (dropdown estilo shadcn).
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function TriggerGlyph() {
    if (!mounted) {
      return <Moon className="size-4 opacity-60" aria-hidden />;
    }
    if (theme === "system") {
      return <Monitor className="size-4" aria-hidden />;
    }
    if (resolvedTheme === "dark") {
      return <Moon className="size-4" aria-hidden />;
    }
    return <Sun className="size-4" aria-hidden />;
  }

  const items = [
    { id: "light" as const, label: "Claro", glyph: Sun },
    { id: "dark" as const, label: "Escuro", glyph: Moon },
    { id: "system" as const, label: "Sistema", glyph: Monitor },
  ];

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-foreground"
        aria-label="Escolher tema"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <TriggerGlyph />
      </Button>

      {open && mounted ? (
        <div
          role="menu"
          aria-orientation="vertical"
          className="border-border bg-popover text-popover-foreground absolute right-0 z-[60] mt-1 min-w-[11.5rem] overflow-hidden rounded-lg border py-1 shadow-md"
        >
          {items.map(({ id, label, glyph: Glyph }) => (
            <button
              key={id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === id}
              className={cn(
                "hover:bg-muted focus:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none",
                theme === id && "bg-muted/80",
              )}
              onClick={() => {
                setTheme(id);
                setOpen(false);
              }}
            >
              <Glyph className="size-4 shrink-0 opacity-80" aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
