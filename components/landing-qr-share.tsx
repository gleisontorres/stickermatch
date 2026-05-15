"use client";

import { QRCodeSVG } from "qrcode.react";

/** URL oficial para compartilhamento via QR na landing (pública). */
const COLLECTHUB_URL = "https://collecthub.app";

/**
 * Bloco QR na landing para acesso rápido presencial ao site.
 */
export function LandingQrShare() {
  return (
    <section className="mt-16 flex w-full flex-col items-center gap-4 border-t border-border pt-10">
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <span aria-hidden>📱</span>
        Compartilhe com quem está do lado
      </p>

      <div
        className="rounded-2xl p-4"
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(16,185,129,0.3)",
        }}
      >
        <QRCodeSVG
          value={COLLECTHUB_URL}
          size={180}
          bgColor="#0a0a0a"
          fgColor="#10b981"
          level="H"
          style={{ borderRadius: "8px" }}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        Aponte a câmera para entrar
      </p>
    </section>
  );
}
