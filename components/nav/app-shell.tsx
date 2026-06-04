"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import type { UserMenuUser } from "@/components/nav/user-menu";
import { BottomNav } from "@/components/nav/bottom-nav";
import { MobileHeader } from "@/components/nav/mobile-header";
import { Sidebar } from "@/components/nav/sidebar";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface AppShellProps {
  user: UserMenuUser;
  children: ReactNode;
}

/**
 * Layout cliente da área autenticada: sidebar desktop, header + bottom nav mobile.
 */
export function AppShell({ user, children }: AppShellProps) {
  const router = useRouter();

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const { isPulling, pullProgress, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <>
      <PullToRefreshIndicator
        isPulling={isPulling}
        pullProgress={pullProgress}
        isRefreshing={isRefreshing}
      />
      <Sidebar user={user} />
      <MobileHeader user={user} />
      <main className="md:ml-64 pt-14 pb-20 md:pb-0 md:pt-0">{children}</main>
      <BottomNav />
    </>
  );
}
