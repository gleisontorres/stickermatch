"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn, normalizeCodigo } from "@/lib/utils";

/** Linha mínima do catálogo para resolver código ou número. */
export interface PacoteCatalogRow {
  id: string;
  nome: string;
  numero: number | null;
}

interface PacoteModeClientProps {
  catalog: readonly PacoteCatalogRow[];
  initialQuantities: Record<string, number>;
}

interface LogLine {
  key: string;
  ok: boolean;
  message: string;
}

const MAX_LOG = 40;

/**
 * Entrada rápida tipo “abri um pacote”: código ou número + Enter incrementa +1.
 */
export function PacoteModeClient({
  catalog,
  initialQuantities,
}: PacoteModeClientProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<Record<string, number>>(initialQuantities);

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);

  useEffect(() => {
    qtyRef.current = initialQuantities;
  }, [initialQuantities]);

  const { canonicalByUpper, numeroToId, nomePorId } = useMemo(() => {
    const canonicalByUpper = new Map<string, string>();
    const numeroToId = new Map<number, string>();
    const nomePorId = new Map<string, string>();

    for (const row of catalog) {
      canonicalByUpper.set(row.id.toUpperCase(), row.id);
      nomePorId.set(row.id, row.nome);
      if (row.numero != null && !numeroToId.has(row.numero)) {
        numeroToId.set(row.numero, row.id);
      }
    }

    return { canonicalByUpper, numeroToId, nomePorId };
  }, [catalog]);

  const persistIncrement = useCallback(
    async (figurinhaId: string, oldVal: number, newVal: number) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        qtyRef.current = { ...qtyRef.current, [figurinhaId]: oldVal };
        setSaveError("Sessão expirada. Entre novamente.");
        return false;
      }

      const { error } = await supabase.from("colecao").upsert(
        {
          user_id: user.id,
          figurinha_id: figurinhaId,
          quantidade: newVal,
        },
        { onConflict: "user_id,figurinha_id" },
      );

      if (error) {
        qtyRef.current = { ...qtyRef.current, [figurinhaId]: oldVal };
        setSaveError(error.message);
        return false;
      }

      setSaveError(null);
      return true;
    },
    [],
  );

  const resolveFigurinhaId = useCallback(
    (raw: string): string | null => {
      const t = raw.trim();
      if (!t) {
        return null;
      }
      // Id literal (ex.: "00") antes de tratar só dígitos como número do álbum.
      const byExactId = canonicalByUpper.get(t.toUpperCase());
      if (byExactId) {
        return byExactId;
      }
      if (/^\d+$/.test(t)) {
        const n = parseInt(t, 10);
        if (n >= 1 && n <= 9999) {
          return numeroToId.get(n) ?? null;
        }
        return null;
      }
      const normalized = normalizeCodigo(t);
      const byCode = canonicalByUpper.get(normalized);
      if (byCode) {
        return byCode;
      }
      return null;
    },
    [canonicalByUpper, numeroToId],
  );

  const appendLog = useCallback((line: LogLine) => {
    setLog((prev) => [line, ...prev].slice(0, MAX_LOG));
  }, []);

  const submitCurrent = useCallback(async () => {
    const raw = draft;
    const figurinhaId = resolveFigurinhaId(raw);
    const trimmed = raw.trim();

    if (!trimmed || busy) {
      return;
    }

    if (!figurinhaId) {
      appendLog({
        key: `${Date.now()}-err`,
        ok: false,
        message: `“${trimmed}” não existe no catálogo.`,
      });
      setDraft("");
      inputRef.current?.focus();
      return;
    }

    const nome = nomePorId.get(figurinhaId) ?? figurinhaId;
    const oldVal = qtyRef.current[figurinhaId] ?? 0;
    const newVal = Math.min(99, oldVal + 1);

    if (newVal === oldVal && oldVal >= 99) {
      appendLog({
        key: `${Date.now()}-cap`,
        ok: false,
        message: `${figurinhaId} (${nome}) já está no máximo (99).`,
      });
      setDraft("");
      inputRef.current?.focus();
      return;
    }

    setBusy(true);
    qtyRef.current = { ...qtyRef.current, [figurinhaId]: newVal };

    const ok = await persistIncrement(figurinhaId, oldVal, newVal);
    setBusy(false);

    if (ok) {
      appendLog({
        key: `${Date.now()}-ok`,
        ok: true,
        message: `+1 · ${figurinhaId} · ${nome} → qty ${newVal}`,
      });
    } else {
      appendLog({
        key: `${Date.now()}-fail`,
        ok: false,
        message: `Falha ao salvar ${figurinhaId}.`,
      });
    }

    setDraft("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [
    appendLog,
    busy,
    draft,
    nomePorId,
    persistIncrement,
    resolveFigurinhaId,
  ]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void submitCurrent();
    }
    if (e.key === "Escape") {
      setDraft("");
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Modo pacote</h1>
        <p className="text-muted-foreground text-sm">
          Digite o código da figurinha (ex.:{" "}
          <span className="font-mono text-foreground">BRA2</span>) ou só o{" "}
          <span className="font-mono text-foreground">número</span> do álbum e
          pressione <kbd className="font-mono text-xs">Enter</kbd> para somar{" "}
          <strong className="text-foreground">+1</strong> na quantidade.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/album"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Voltar ao álbum
        </Link>
      </div>

      {saveError ? (
        <p
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
          role="alert"
        >
          {saveError}
        </p>
      ) : null}

      <div className="border-border rounded-xl border bg-card p-4 shadow-sm">
        <label className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium">
            Próxima figurinha
          </span>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ex.: BRA2 ou 142"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            autoFocus
            aria-busy={busy}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring font-mono h-11 w-full rounded-lg border px-3 text-base tracking-wide outline-none focus-visible:ring-2 disabled:opacity-60"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="gradient"
            size="sm"
            disabled={busy || !draft.trim()}
            onClick={() => void submitCurrent()}
          >
            Adicionar (+1)
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft("");
              inputRef.current?.focus();
            }}
          >
            Limpar campo
          </Button>
        </div>
      </div>

      <section aria-labelledby="pacote-log-heading" className="space-y-2">
        <h2 id="pacote-log-heading" className="text-sm font-semibold">
          Últimas entradas
        </h2>
        <div
          className="border-border bg-muted text-muted-foreground max-h-[min(50vh,22rem)] overflow-y-auto rounded-lg border p-4 font-mono text-sm"
          aria-live="polite"
        >
          {log.length === 0 ? (
            <p className="text-muted-foreground">
              Nada registrado ainda. Comece digitando um código acima.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {log.map((line) => (
                <li
                  key={line.key}
                  className={cn(
                    "break-all",
                    line.ok ? "text-primary" : "text-destructive",
                  )}
                >
                  {line.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
