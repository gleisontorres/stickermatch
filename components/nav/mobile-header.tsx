"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";

import type { UserMenuUser } from "@/components/nav/user-menu";
import { UserMenu } from "@/components/nav/user-menu";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  user: UserMenuUser;
  className?: string;
}

/**
 * Cabeçalho fixo no mobile: marca CollectHub e menu do usuário (avatar).
 */
export function MobileHeader({ user, className }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "border-border bg-background fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b px-4 md:hidden",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className="transition-colors duration-150 flex min-w-0 items-center gap-2 font-semibold tracking-tight hover:text-primary"
        aria-label="CollectHub — ir para o painel"
      >
        <Ticket className="text-primary size-7 shrink-0" aria-hidden />
        <span className="truncate">CollectHub</span>
      </Link>
      <UserMenu user={user} variant="mobile" />
    </header>
  );
}
