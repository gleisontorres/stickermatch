"use client";

import "flag-icons/css/flag-icons.min.css";

import { useEffect, useRef } from "react";

import { flagSlugForSelecaoCodigo } from "@/lib/album/copa-groups";
import { cn } from "@/lib/utils";

const CANVAS_WIDTH = 120;
const CANVAS_HEIGHT = 60;
const WAVE_AMPLITUDE = 8;
const WAVE_FREQUENCY = 0.05;
/** Fase fixa — aparência de vento congelado no meio da onda. */
const WAVE_PHASE = 1.2;
const WATERMARK_OPACITY = 0.38;

interface WavingFlagProps {
  selecaoCodigo: string | null | undefined;
  className?: string;
}

function flagSvgUrl(slug: string): string {
  return `/api/flag-icons/flags/4x3/${slug}.svg`;
}

function drawStaticWavyFlag(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.globalAlpha = WATERMARK_OPACITY;

  for (let x = 0; x < CANVAS_WIDTH; x += 1) {
    const sourceX = Math.floor((x / CANVAS_WIDTH) * image.naturalWidth);
    const waveOffset =
      WAVE_AMPLITUDE * Math.sin(WAVE_FREQUENCY * x + WAVE_PHASE);
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
}

/**
 * Bandeira flag-icons no canvas com ondulação senoidal estática (marca d'água do álbum).
 */
export function WavingFlag({ selecaoCodigo, className }: WavingFlagProps) {
  const slug = flagSlugForSelecaoCodigo(selecaoCodigo);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    img.onload = () => {
      if (cancelled) {
        return;
      }
      drawStaticWavyFlag(ctx, img);
    };

    img.onerror = () => {
      if (!cancelled) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    };

    img.src = flagSvgUrl(slug);

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [slug]);

  if (!slug) {
    return null;
  }

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-auto right-2 bottom-0 z-0 select-none",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="h-[60px] w-[120px]"
      />
    </span>
  );
}
