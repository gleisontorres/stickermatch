"use client";

import "flag-icons/css/flag-icons.min.css";

import { useEffect, useRef } from "react";

import { flagSlugForSelecaoCodigo } from "@/lib/album/copa-groups";
import { cn } from "@/lib/utils";

const CANVAS_WIDTH = 120;
const CANVAS_HEIGHT = 80;
const WAVE_AMPLITUDE = 8;
const WAVE_FREQUENCY = 0.05;
const PHASE_STEP = 0.05;
const WATERMARK_OPACITY = 0.38;

interface WavingFlagProps {
  selecaoCodigo: string | null | undefined;
  className?: string;
}

function flagSvgUrl(slug: string): string {
  return `/api/flag-icons/flags/4x3/${slug}.svg`;
}

/**
 * Bandeira flag-icons desenhada em canvas com ondulação senoidal (marca d'água do álbum).
 */
export function WavingFlag({ selecaoCodigo, className }: WavingFlagProps) {
  const slug = flagSlugForSelecaoCodigo(selecaoCodigo);
  const containerRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    imageRef.current = img;

    const drawFrame = () => {
      if (!visibleRef.current || cancelled || !imageRef.current?.complete) {
        rafRef.current = null;
        return;
      }

      const image = imageRef.current;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = WATERMARK_OPACITY;

      for (let x = 0; x < CANVAS_WIDTH; x += 1) {
        const sourceX = Math.floor((x / CANVAS_WIDTH) * image.naturalWidth);
        const waveOffset =
          WAVE_AMPLITUDE * Math.sin(WAVE_FREQUENCY * x + phaseRef.current);
        ctx.drawImage(
          image,
          sourceX,
          0,
          1,
          image.naturalHeight,
          x,
          waveOffset,
          1,
          CANVAS_HEIGHT,
        );
      }

      phaseRef.current += PHASE_STEP;
      rafRef.current = requestAnimationFrame(drawFrame);
    };

    const startLoop = () => {
      if (cancelled || !visibleRef.current) {
        return;
      }
      if (rafRef.current != null) {
        return;
      }
      rafRef.current = requestAnimationFrame(drawFrame);
    };

    const stopLoop = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    img.onload = () => {
      if (cancelled) {
        return;
      }
      if (visibleRef.current) {
        startLoop();
      }
    };

    img.onerror = () => {
      imageRef.current = null;
      stopLoop();
    };

    img.src = flagSvgUrl(slug);

    const root = containerRef.current;
    if (!root) {
      return () => {
        cancelled = true;
        stopLoop();
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        visibleRef.current = isVisible;
        if (isVisible && imageRef.current?.complete) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { root: null, threshold: 0 },
    );

    observer.observe(root);

    return () => {
      cancelled = true;
      observer.disconnect();
      stopLoop();
      imageRef.current = null;
    };
  }, [slug]);

  if (!slug) {
    return null;
  }

  return (
    <span
      ref={containerRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute right-[4px] -bottom-[16px] z-0 select-none",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="h-20 w-[120px]"
      />
    </span>
  );
}
