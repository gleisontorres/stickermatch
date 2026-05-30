"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";

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

type EntryMode = "individual" | "batch";
type PacoteDelta = 1 | -1;

/**
 * Entrada rápida tipo “abri um pacote”: adicionar ou remover ±1 por código/número.
 */
export function PacoteModeClient({
  catalog,
  initialQuantities,
}: PacoteModeClientProps) {
  const qtyRef = useRef<Record<string, number>>(initialQuantities);

  const [addEntryMode, setAddEntryMode] = useState<EntryMode>("individual");
  const [addDraft, setAddDraft] = useState("");
  const [addBatchDraft, setAddBatchDraft] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const addBatchRef = useRef<HTMLTextAreaElement>(null);

  const [removeEntryMode, setRemoveEntryMode] = useState<EntryMode>("individual");
  const [removeDraft, setRemoveDraft] = useState("");
  const [removeBatchDraft, setRemoveBatchDraft] = useState("");
  const removeInputRef = useRef<HTMLInputElement>(null);
  const removeBatchRef = useRef<HTMLTextAreaElement>(null);

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

  const persistQuantity = useCallback(
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

  const processOneEntry = useCallback(
    async (raw: string, logKeySuffix: string, delta: PacoteDelta) => {
      const figurinhaId = resolveFigurinhaId(raw);
      const trimmed = raw.trim();

      if (!trimmed) {
        return;
      }

      if (!figurinhaId) {
        appendLog({
          key: `${Date.now()}-${logKeySuffix}-err`,
          ok: false,
          message: `“${trimmed}” não existe no catálogo.`,
        });
        return;
      }

      const nome = nomePorId.get(figurinhaId) ?? figurinhaId;
      const oldVal = qtyRef.current[figurinhaId] ?? 0;
      let newVal: number;
      const logPrefix = delta === 1 ? "+1" : "-1";

      if (delta === 1) {
        if (oldVal >= 99) {
          appendLog({
            key: `${Date.now()}-${logKeySuffix}-cap`,
            ok: false,
            message: `${figurinhaId} (${nome}) já está no máximo (99).`,
          });
          return;
        }
        newVal = Math.min(99, oldVal + 1);
      } else {
        if (oldVal <= 0) {
          appendLog({
            key: `${Date.now()}-${logKeySuffix}-zero`,
            ok: false,
            message:
              "Figurinha já está em 0, não é possível remover",
          });
          return;
        }
        newVal = oldVal - 1;
      }

      qtyRef.current = { ...qtyRef.current, [figurinhaId]: newVal };

      const ok = await persistQuantity(figurinhaId, oldVal, newVal);

      if (ok) {
        appendLog({
          key: `${Date.now()}-${logKeySuffix}-ok`,
          ok: true,
          message: `${logPrefix} · ${figurinhaId} · ${nome} → qty ${newVal}`,
        });
      } else {
        appendLog({
          key: `${Date.now()}-${logKeySuffix}-fail`,
          ok: false,
          message: `Falha ao salvar ${figurinhaId}.`,
        });
      }
    },
    [appendLog, nomePorId, persistQuantity, resolveFigurinhaId],
  );

  const runIndividual = useCallback(
    async (
      raw: string,
      delta: PacoteDelta,
      inputRef: RefObject<HTMLInputElement>,
      clear: () => void,
    ) => {
      const trimmed = raw.trim();
      if (!trimmed || busy) {
        return;
      }

      setBusy(true);
      await processOneEntry(raw, delta === 1 ? "add-one" : "remove-one", delta);
      setBusy(false);
      clear();
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [busy, processOneEntry],
  );

  const runBatch = useCallback(
    async (
      batchText: string,
      delta: PacoteDelta,
      batchRef: RefObject<HTMLTextAreaElement>,
      clear: () => void,
    ) => {
      const codes = batchText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (codes.length === 0 || busy) {
        return;
      }

      const prefix = delta === 1 ? "add" : "remove";
      setBusy(true);
      for (let i = 0; i < codes.length; i += 1) {
        await processOneEntry(codes[i], `${prefix}-batch-${i}`, delta);
      }
      setBusy(false);
      clear();
      setTimeout(() => batchRef.current?.focus(), 0);
    },
    [busy, processOneEntry],
  );

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Modo pacote</h1>
        <p className="text-muted-foreground text-sm">
          Adicione ou remova cópias digitando o código (ex.:{" "}
          <span className="font-mono text-foreground">BRA2</span>) ou só o{" "}
          <span className="font-mono text-foreground">número</span> do álbum.
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

      <PacoteEntrySection
        title="Adicionar Figurinha"
        variant="add"
        entryMode={addEntryMode}
        onEntryModeChange={setAddEntryMode}
        busy={busy}
        individualDraft={addDraft}
        onIndividualDraftChange={setAddDraft}
        individualInputRef={addInputRef}
        batchDraft={addBatchDraft}
        onBatchDraftChange={setAddBatchDraft}
        batchInputRef={addBatchRef}
        onSubmitIndividual={() =>
          void runIndividual(addDraft, 1, addInputRef, () => setAddDraft(""))
        }
        onSubmitBatch={() =>
          void runBatch(addBatchDraft, 1, addBatchRef, () => setAddBatchDraft(""))
        }
        autoFocusIndividual
      />

      <PacoteEntrySection
        title="Remover Figurinha"
        subtitle="Digite o código para subtrair -1 da quantidade."
        variant="remove"
        entryMode={removeEntryMode}
        onEntryModeChange={setRemoveEntryMode}
        busy={busy}
        individualDraft={removeDraft}
        onIndividualDraftChange={setRemoveDraft}
        individualInputRef={removeInputRef}
        batchDraft={removeBatchDraft}
        onBatchDraftChange={setRemoveBatchDraft}
        batchInputRef={removeBatchRef}
        onSubmitIndividual={() =>
          void runIndividual(
            removeDraft,
            -1,
            removeInputRef,
            () => setRemoveDraft(""),
          )
        }
        onSubmitBatch={() =>
          void runBatch(
            removeBatchDraft,
            -1,
            removeBatchRef,
            () => setRemoveBatchDraft(""),
          )
        }
      />

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
              Nada registrado ainda. Use as seções acima para adicionar ou
              remover figurinhas.
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

interface PacoteEntrySectionProps {
  title: string;
  subtitle?: string;
  variant: "add" | "remove";
  entryMode: EntryMode;
  onEntryModeChange: (mode: EntryMode) => void;
  busy: boolean;
  individualDraft: string;
  onIndividualDraftChange: (value: string) => void;
  individualInputRef: RefObject<HTMLInputElement>;
  batchDraft: string;
  onBatchDraftChange: (value: string) => void;
  batchInputRef: RefObject<HTMLTextAreaElement>;
  onSubmitIndividual: () => void;
  onSubmitBatch: () => void;
  autoFocusIndividual?: boolean;
}

/** Bloco Individual/Lote compartilhado entre adicionar e remover. */
function PacoteEntrySection({
  title,
  subtitle,
  variant,
  entryMode,
  onEntryModeChange,
  busy,
  individualDraft,
  onIndividualDraftChange,
  individualInputRef,
  batchDraft,
  onBatchDraftChange,
  batchInputRef,
  onSubmitIndividual,
  onSubmitBatch,
  autoFocusIndividual = false,
}: PacoteEntrySectionProps) {
  const isAdd = variant === "add";
  /** Mesma estrutura do toggle de Adicionar; só a cor do selecionado muda. */
  const toggleSelectedClass = isAdd
    ? "bg-primary text-primary-foreground"
    : "bg-[var(--destructive)] text-[var(--destructive-foreground)]";

  const onIndividualKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmitIndividual();
    }
    if (e.key === "Escape") {
      onIndividualDraftChange("");
    }
  };

  return (
    <section className="border-border rounded-xl border bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        ) : null}
      </div>

      {entryMode === "individual" ? (
        <label className="mt-3 flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium">
            {isAdd ? "Próxima figurinha" : "Código da figurinha"}
          </span>
          <input
            ref={individualInputRef}
            type="text"
            value={individualDraft}
            disabled={busy}
            onChange={(e) => onIndividualDraftChange(e.target.value)}
            onKeyDown={onIndividualKeyDown}
            placeholder="Ex.: BRA2 ou 142"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            autoFocus={autoFocusIndividual}
            aria-busy={busy}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring font-mono h-11 w-full rounded-lg border px-3 text-base tracking-wide outline-none focus-visible:ring-2 disabled:opacity-60"
          />
        </label>
      ) : null}

      <div
        className={cn(
          "flex rounded-lg border p-0.5",
          entryMode === "individual" ? "mt-3" : "mt-3",
        )}
        role="group"
        aria-label={`Modo de ${isAdd ? "adição" : "remoção"}`}
      >
        <button
          type="button"
          disabled={busy}
          onClick={() => onEntryModeChange("individual")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
            entryMode === "individual"
              ? toggleSelectedClass
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Individual
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onEntryModeChange("batch")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
            entryMode === "batch"
              ? toggleSelectedClass
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Lote
        </button>
      </div>

      {entryMode === "batch" ? (
        <div className="mt-3 space-y-3">
          <label className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {isAdd ? "Cadastro em lote" : "Remoção em lote"}
            </span>
            <textarea
              ref={batchInputRef}
              value={batchDraft}
              disabled={busy}
              onChange={(e) => onBatchDraftChange(e.target.value)}
              placeholder="BRA1,BRA2,FRA5,MEX03"
              rows={4}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-busy={busy}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring font-mono w-full resize-y rounded-lg border px-3 py-2 text-sm tracking-wide outline-none focus-visible:ring-2 disabled:opacity-60"
            />
            <span className="text-muted-foreground text-xs">
              Cole códigos separados por vírgula.
            </span>
          </label>
          <Button
            type="button"
            variant={isAdd ? "gradient" : "destructive"}
            size="sm"
            disabled={busy || !batchDraft.trim()}
            onClick={onSubmitBatch}
          >
            {isAdd ? "Adicionar lote" : "Remover lote"}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={isAdd ? "gradient" : "destructive"}
            size="sm"
            disabled={busy || !individualDraft.trim()}
            onClick={onSubmitIndividual}
          >
            {isAdd ? "Adicionar (+1)" : "Remover (-1)"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onIndividualDraftChange("");
              individualInputRef.current?.focus();
            }}
          >
            Limpar campo
          </Button>
        </div>
      )}
    </section>
  );
}
