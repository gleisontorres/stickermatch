"use client";

import { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD_PX = 70;

export interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
}

export interface UsePullToRefreshResult {
  isPulling: boolean;
  pullProgress: number;
  isRefreshing: boolean;
}

/**
 * Detecta gesto de pull-to-refresh no topo da página (apenas touch).
 */
export function usePullToRefresh({
  onRefresh,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const pullDistanceRef = useRef(0);
  const isTrackingRef = useRef(false);
  const isHorizontalRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  onRefreshRef.current = onRefresh;
  isRefreshingRef.current = isRefreshing;

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined" || !("ontouchstart" in window)) return;

    const resetPull = () => {
      isTrackingRef.current = false;
      isHorizontalRef.current = false;
      pullDistanceRef.current = 0;
      setIsPulling(false);
      setPullProgress(0);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY !== 0 || isRefreshingRef.current) return;

      const touch = event.touches[0];
      if (!touch) return;

      startYRef.current = touch.clientY;
      startXRef.current = touch.clientX;
      isTrackingRef.current = true;
      isHorizontalRef.current = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isTrackingRef.current || isHorizontalRef.current) return;

      if (window.scrollY !== 0) {
        resetPull();
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - startYRef.current;
      const deltaX = touch.clientX - startXRef.current;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isHorizontalRef.current = true;
        resetPull();
        return;
      }

      if (deltaY <= 0) {
        pullDistanceRef.current = 0;
        setIsPulling(false);
        setPullProgress(0);
        return;
      }

      pullDistanceRef.current = deltaY;
      setIsPulling(true);
      setPullProgress(Math.min(deltaY / PULL_THRESHOLD_PX, 1));
    };

    const handleTouchEnd = async () => {
      if (!isTrackingRef.current || isHorizontalRef.current) {
        resetPull();
        return;
      }

      const shouldRefresh = pullDistanceRef.current >= PULL_THRESHOLD_PX;
      resetPull();

      if (!shouldRefresh || isRefreshingRef.current) return;

      setIsRefreshing(true);
      isRefreshingRef.current = true;

      try {
        await onRefreshRef.current();
      } finally {
        setIsRefreshing(false);
        isRefreshingRef.current = false;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [disabled]);

  return { isPulling, pullProgress, isRefreshing };
}
