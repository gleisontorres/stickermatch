"use client";

import type { ReactNode } from "react";

import type { UserMenuUser } from "@/components/nav/user-menu";
import { BottomNav } from "@/components/nav/bottom-nav";
import { MobileHeader } from "@/components/nav/mobile-header";
import { Sidebar } from "@/components/nav/sidebar";

interface AppShellProps {
  user: UserMenuUser;
  children: ReactNode;
}

/**
 * Layout cliente da área autenticada: sidebar desktop, header + bottom nav mobile.
 */
export function AppShell({ user, children }: AppShellProps) {
  return (
    <>
      <Sidebar user={user} />
      <MobileHeader user={user} />
      <main className="md:ml-64 pt-14 pb-20 md:pb-0 md:pt-0">{children}</main>
      <BottomNav />
    </>
  );
}
