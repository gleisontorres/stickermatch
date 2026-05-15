"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

interface OnboardingFormProps {
  /** E-mail da sessão (somente exibição). */
  initialEmail: string;
}

/**
 * Formulário único do onboarding: captura WhatsApp e grava `wa.me` no perfil.
 */
export function OnboardingForm({ initialEmail }: OnboardingFormProps) {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSalvar = async () => {
    if (!whatsapp.trim()) {
      return;
    }

    let numeroLimpo = whatsapp.replace(/\D/g, "");
    if (numeroLimpo.startsWith("55") && numeroLimpo.length >= 12) {
      numeroLimpo = numeroLimpo.slice(2);
    }

    if (numeroLimpo.length < 10) {
      toast.error(
        "Digite um número válido com DDD. Ex: (11) 99999-9999",
      );
      return;
    }

    setLoading(true);
    const linkWhatsApp = `https://wa.me/55${numeroLimpo}`;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Sessão expirada. Entre novamente.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("perfis")
      .update({ whatsapp: linkWhatsApp })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-6"
      style={{
        backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)`,
      }}
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <Image
            src="/icons/icon-192.png"
            alt="CollectHub"
            width={64}
            height={64}
            className="mx-auto shrink-0"
          />
          <h1 className="text-2xl font-bold">Quase lá!</h1>
          <p className="text-muted-foreground text-sm">
            Adicione seu WhatsApp pra que seus parceiros de troca possam te
            contatar.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="onboarding-wa">
              WhatsApp
            </label>
            <input
              id="onboarding-wa"
              type="tel"
              placeholder="(11) 99999-9999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-primary w-full rounded-xl border px-4 py-3 focus:ring-2 focus:outline-none"
              autoFocus
            />
            <p className="text-muted-foreground text-xs">
              Só seus parceiros de match vão ver. Nunca será compartilhado
              publicamente.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleSalvar();
            }}
            disabled={loading || !whatsapp.trim()}
            className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #10b981, #f59e0b)",
              color: "#0a0a0a",
            }}
          >
            {loading ? "Salvando..." : "Entrar no CollectHub →"}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Logado como {initialEmail}
        </p>
      </div>
    </div>
  );
}
