"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export interface PerfilFormInitial {
  nome: string;
  /** E-mail da sessão (somente leitura na UI). */
  email: string;
  avatarUrl: string;
  whatsapp: string;
}

interface PerfilFormProps {
  userId: string;
  initial: PerfilFormInitial;
}

/**
 * Normaliza URL de avatar (http/https) ou retorna null se inválida/vazia.
 */
function normalizeAvatarUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) {
    return null;
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return null;
    }
    return u.href;
  } catch {
    return null;
  }
}

/**
 * Formulário de edição do perfil (nome, foto por URL, WhatsApp).
 */
export function PerfilForm({ userId, initial }: PerfilFormProps) {
  const [nome, setNome] = useState(initial.nome);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrlError, setAvatarUrlError] = useState<string | null>(null);

  const [avatarPreviewFailed, setAvatarPreviewFailed] = useState(false);

  const previewSrc = useMemo(() => {
    const n = normalizeAvatarUrl(avatarUrl);
    return n ?? "";
  }, [avatarUrl]);

  useEffect(() => {
    setAvatarPreviewFailed(false);
  }, [previewSrc]);

  const save = useCallback(async () => {
    const nomeTrim = nome.trim();
    const avatarTrim = avatarUrl.trim();
    const waTrim = whatsapp.trim();

    if (avatarTrim && !normalizeAvatarUrl(avatarTrim)) {
      setAvatarUrlError("Use uma URL válida começando com http:// ou https://.");
      return;
    }
    setAvatarUrlError(null);

    setPending(true);
    setError(null);
    setSavedAt(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      setPending(false);
      setError("Sessão inválida. Entre novamente.");
      return;
    }

    const payload = {
      id: user.id,
      nome: nomeTrim || null,
      email: user.email ?? initial.email,
      avatar_url: normalizeAvatarUrl(avatarTrim),
      whatsapp: waTrim || null,
    };

    const { error: upsertError } = await supabase
      .from("perfis")
      .upsert(payload, { onConflict: "id" });

    setPending(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setSavedAt(new Date().toISOString());
  }, [avatarUrl, initial.email, nome, userId, whatsapp]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground text-sm">
          Nome e foto aparecem para o grupo nas trocas. WhatsApp é opcional e
          usado nos botões de contato.
        </p>
      </header>

      {error ? (
        <p
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {savedAt ? (
        <p className="text-muted-foreground text-sm" role="status">
          Alterações salvas.
        </p>
      ) : null}

      <div className="border-border space-y-6 rounded-xl border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-2">
          <label
            htmlFor="perfil-email"
            className="text-muted-foreground text-xs font-medium"
          >
            E-mail
          </label>
          <input
            id="perfil-email"
            type="email"
            readOnly
            value={initial.email}
            className="border-input bg-muted/40 text-muted-foreground h-9 w-full cursor-not-allowed rounded-lg border px-3 text-sm"
          />
          <p className="text-muted-foreground text-[11px]">
            Vinculado ao login Google; não é editável aqui.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="perfil-nome"
            className="text-muted-foreground text-xs font-medium"
          >
            Nome exibido
          </label>
          <input
            id="perfil-nome"
            type="text"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setSavedAt(null);
            }}
            placeholder="Como quer aparecer nos matches"
            autoComplete="name"
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="perfil-avatar"
            className="text-muted-foreground text-xs font-medium"
          >
            URL da foto (avatar)
          </label>
          <input
            id="perfil-avatar"
            type="url"
            value={avatarUrl}
            onChange={(e) => {
              setAvatarUrl(e.target.value);
              setAvatarUrlError(null);
              setSavedAt(null);
            }}
            placeholder="https://…"
            autoCapitalize="none"
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-lg border px-3 font-mono text-sm outline-none focus-visible:ring-2"
          />
          {avatarUrlError ? (
            <p className="text-destructive text-xs">{avatarUrlError}</p>
          ) : null}
          <div className="flex items-center gap-4 pt-1">
            <div className="border-border bg-muted/30 size-16 shrink-0 overflow-hidden rounded-full border">
              {previewSrc && !avatarPreviewFailed ? (
                // next/image exigiria allowlist de hostnames; URL é livre do usuário.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt=""
                  className="size-full object-cover"
                  onError={() => setAvatarPreviewFailed(true)}
                />
              ) : (
                <div className="text-muted-foreground flex size-full items-center justify-center text-[10px]">
                  preview
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-xs leading-snug">
              Cole um link público <strong className="text-foreground">https</strong>{" "}
              da imagem. Deixe em branco para não usar foto customizada.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="perfil-whatsapp"
            className="text-muted-foreground text-xs font-medium"
          >
            WhatsApp
          </label>
          <input
            id="perfil-whatsapp"
            type="tel"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              setSavedAt(null);
            }}
            placeholder="+55 11 99999-9999"
            autoComplete="tel"
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
          />
          <p className="text-muted-foreground text-[11px]">
            Apenas números são usados no link{" "}
            <span className="font-mono text-foreground">wa.me</span>. Espaços e
            símbolos são ignorados na hora de abrir o chat.
          </p>
        </div>

        <Button
          type="button"
          disabled={pending}
          onClick={() => void save()}
          className="w-full sm:w-auto"
        >
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
