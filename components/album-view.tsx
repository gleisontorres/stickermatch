"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";

import { FigurinhaCard } from "@/components/figurinha-card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  copaBucketForFigurinha,
  COPA_ESPECIAIS_BUCKET_ORDER,
  copaGroupAccentHex,
  copaSectionLabel,
  ESPECIAIS_CC_BUCKET,
  flagIconSrcForSelecaoCodigo,
  GRUPOS_ORDEM,
} from "@/lib/album/copa-groups";
import {
  albumGroupTitle,
  ESPECIAIS_SELECTION_TITLE_CC,
  ESPECIAIS_SELECTION_TITLE_FWC,
} from "@/lib/album/group-title";
import {
  chunkedColecaoDelete,
  chunkedColecaoUpsert,
} from "@/lib/colecao/chunked-write";
import type { AlbumFilterMode, Figurinha } from "@/lib/types";
import { brandProgressBarStyle } from "@/lib/brand-progress";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AlbumViewProps {
  figurinhas: Figurinha[];
  initialQuantities: Record<string, number>;
  /** Abre o modal "Ações em massa" (ex.: /album?bulk=1). */
  initialMassDialogOpen?: boolean;
}

const MAX_UNDO_RECORDS = 100;
const HIDE_BULK_TIP_KEY = "hide_bulk_tip";

type UndoEntry = { figurinha_id: string; quantidade: number };

function minNumero(items: Figurinha[]): number {
  return Math.min(...items.map((i) => i.numero ?? 999999));
}

/** Agrupa figurinhas filtradas por seleção (acordeão interno), mesma regra do álbum antes do agrupamento por grupo da Copa. */
function buildSelectionGroups(items: Figurinha[]): [string, Figurinha[]][] {
  const map = new Map<string, Figurinha[]>();
  for (const f of items) {
    const key = albumGroupTitle(f);
    const list = map.get(key) ?? [];
    list.push(f);
    map.set(key, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
  }
  const selectionSortRank = (title: string): number => {
    if (title === ESPECIAIS_SELECTION_TITLE_FWC) {
      return 1;
    }
    if (title === ESPECIAIS_SELECTION_TITLE_CC) {
      return 2;
    }
    if (title === "Especiais") {
      return 3;
    }
    return 0;
  };

  return [...map.entries()].sort((a, b) => {
    const ra = selectionSortRank(a[0]);
    const rb = selectionSortRank(b[0]);
    if (ra !== rb) {
      return ra - rb;
    }
    return minNumero(a[1]) - minNumero(b[1]);
  });
}

interface CopaAlbumSection {
  copaKey: string;
  headerTitle: string;
  selections: [string, Figurinha[]][];
}

/** Cabeçalho Coca‑Cola na seção Especiais (garrafa + texto). */
function AlbumCcHeadingWithBottleIcon() {
  return (
    <span className="inline-flex items-center gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/bottle.png"
        alt="garrafa"
        style={{
          width: "16px",
          height: "24px",
          filter: "invert(1)",
          display: "inline-block",
          verticalAlign: "middle",
        }}
      />
      <span>{ESPECIAIS_SELECTION_TITLE_CC}</span>
    </span>
  );
}

/**
 * Álbum completo: filtros, busca, acordeão e ações em massa.
 */
export function AlbumView({
  figurinhas,
  initialQuantities,
  initialMassDialogOpen = false,
}: AlbumViewProps) {
  const [quantities, setQuantities] =
    useState<Record<string, number>>(initialQuantities);
  const qtyRef = useRef<Record<string, number>>(initialQuantities);
  const [filterMode, setFilterMode] = useState<AlbumFilterMode>("all");
  const [search, setSearch] = useState("");
  const [openCopaGroups, setOpenCopaGroups] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyGroupTitle, setBusyGroupTitle] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [quickRegistrationMode, setQuickRegistrationMode] = useState(false);
  const [quickPrepLoading, setQuickPrepLoading] = useState(false);
  const [massDialogOpen, setMassDialogOpen] = useState(initialMassDialogOpen);
  const [quickConfirmOpen, setQuickConfirmOpen] = useState(false);
  const [resetCollectionOpen, setResetCollectionOpen] = useState(false);
  const [resetPhrase, setResetPhrase] = useState("");
  const [globalBusy, setGlobalBusy] = useState(false);

  const [faltaModal, setFaltaModal] = useState<{
    title: string;
    ids: string[];
    marcadas: number;
    repetidas: number;
  } | null>(null);

  const [resetSelModal, setResetSelModal] = useState<{
    title: string;
    ids: string[];
  } | null>(null);

  const [bulkTipReady, setBulkTipReady] = useState(false);
  const [bulkTipHidden, setBulkTipHidden] = useState(false);

  useEffect(() => {
    setQuantities(initialQuantities);
    qtyRef.current = initialQuantities;
  }, [initialQuantities]);

  useEffect(() => {
    qtyRef.current = quantities;
  }, [quantities]);

  useEffect(() => {
    try {
      setBulkTipHidden(localStorage.getItem(HIDE_BULK_TIP_KEY) === "1");
    } catch {
      setBulkTipHidden(false);
    }
    setBulkTipReady(true);
  }, []);

  const markedCount = useMemo(
    () => Object.values(quantities).filter((q) => q >= 1).length,
    [quantities],
  );

  const applyPatch = useCallback((patch: Record<string, number>) => {
    setQuantities((prev) => ({ ...prev, ...patch }));
    qtyRef.current = { ...qtyRef.current, ...patch };
  }, []);

  const removeKeys = useCallback((ids: string[]) => {
    setQuantities((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        delete next[id];
      }
      return next;
    });
    const r = { ...qtyRef.current };
    for (const id of ids) {
      delete r[id];
    }
    qtyRef.current = r;
  }, []);

  const getSession = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user };
  }, []);

  const runRestore = useCallback(
    async (entries: UndoEntry[]) => {
      const { supabase, user } = await getSession();
      if (!user) {
        toast.error("Sessão expirada. Entre novamente.");
        return;
      }
      try {
        await chunkedColecaoUpsert(
          supabase,
          user.id,
          entries.map((e) => ({
            figurinha_id: e.figurinha_id,
            quantidade: e.quantidade,
          })),
        );
        const patch = Object.fromEntries(
          entries.map((e) => [e.figurinha_id, e.quantidade]),
        );
        applyPatch(patch);
        toast.success("Alteração desfeita.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao desfazer.");
      }
    },
    [applyPatch, getSession],
  );

  const toastSuccessMaybeUndo = useCallback(
    (message: string, snapshot: UndoEntry[] | null) => {
      const canUndo =
        snapshot !== null &&
        snapshot.length > 0 &&
        snapshot.length <= MAX_UNDO_RECORDS;

      if (!canUndo) {
        toast.success(message, {
          duration: snapshot && snapshot.length > MAX_UNDO_RECORDS ? 6000 : 4000,
          description:
            snapshot && snapshot.length > MAX_UNDO_RECORDS ?
              "Desfazer não está disponível para operações muito grandes."
            : undefined,
        });
        return;
      }

      const snap = snapshot;
      toast.success(message, {
        duration: 10_000,
        action: {
          label: "Desfazer",
          onClick: () => void runRestore(snap),
        },
      });
    },
    [runRestore],
  );

  const persistQty = useCallback(
    async (figurinhaId: string, oldVal: number, newVal: number) => {
      setBusyId(figurinhaId);
      setSaveError(null);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setQuantities((p) => ({ ...p, [figurinhaId]: oldVal }));
        qtyRef.current = { ...qtyRef.current, [figurinhaId]: oldVal };
        setSaveError("Sessão expirada. Entre novamente.");
        setBusyId(null);
        return;
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
        setQuantities((p) => ({ ...p, [figurinhaId]: oldVal }));
        qtyRef.current = { ...qtyRef.current, [figurinhaId]: oldVal };
        setSaveError(error.message);
      }

      setBusyId(null);
    },
    [],
  );

  const handleQtyChange = useCallback(
    (figurinhaId: string, rawNext: number) => {
      const next = Math.max(0, Math.min(99, rawNext));
      const oldVal = qtyRef.current[figurinhaId] ?? 0;
      if (next === oldVal) {
        return;
      }

      setQuantities((p) => ({ ...p, [figurinhaId]: next }));
      qtyRef.current = { ...qtyRef.current, [figurinhaId]: next };

      void persistQty(figurinhaId, oldVal, next);
    },
    [persistQty],
  );

  const handleQuickTap = useCallback(
    (figurinhaId: string) => {
      const q = qtyRef.current[figurinhaId] ?? 0;
      if (q <= 0) {
        return;
      }
      handleQtyChange(figurinhaId, q - 1);
    },
    [handleQtyChange],
  );

  const idsForGroupTitle = useCallback(
    (title: string) =>
      figurinhas.filter((f) => albumGroupTitle(f) === title).map((f) => f.id),
    [figurinhas],
  );

  const applyMarkHaveOneForIds = useCallback(
    async (ids: string[], messagePrefix: string) => {
      const targetIds = ids.filter((id) => (qtyRef.current[id] ?? 0) === 0);
      if (targetIds.length === 0) {
        toast.info("Todas as figurinhas alvo já estão marcadas como tenho.");
        return;
      }

      const snapshot: UndoEntry[] = targetIds.map((id) => ({
        figurinha_id: id,
        quantidade: 0,
      }));

      const { supabase, user } = await getSession();
      if (!user) {
        toast.error("Sessão expirada.");
        return;
      }

      await chunkedColecaoUpsert(
        supabase,
        user.id,
        targetIds.map((id) => ({ figurinha_id: id, quantidade: 1 })),
      );

      const patch = Object.fromEntries(targetIds.map((id) => [id, 1]));
      applyPatch(patch);

      toastSuccessMaybeUndo(
        `✅ ${targetIds.length} figurinha${targetIds.length === 1 ? "" : "s"} ${messagePrefix}`,
        snapshot.length <= MAX_UNDO_RECORDS ? snapshot : null,
      );
    },
    [applyPatch, getSession, toastSuccessMaybeUndo],
  );

  const onSelectionMarkHave1 = useCallback(
    async (title: string) => {
      const ids = idsForGroupTitle(title);
      setBusyGroupTitle(title);
      setSaveError(null);
      try {
        await applyMarkHaveOneForIds(ids, `marcada${ids.length === 1 ? "" : "s"} na seleção «${title}».`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao marcar seleção.");
      } finally {
        setBusyGroupTitle(null);
      }
    },
    [applyMarkHaveOneForIds, idsForGroupTitle],
  );

  const onSelectionMarkFaltaRequest = useCallback(
    (title: string) => {
      const ids = idsForGroupTitle(title);
      const marcadas = ids.filter((id) => (qtyRef.current[id] ?? 0) >= 1).length;
      const repetidas = ids.filter((id) => (qtyRef.current[id] ?? 0) > 1).length;

      if (marcadas >= 1) {
        setFaltaModal({ title, ids, marcadas, repetidas });
        return;
      }

      void (async () => {
        setBusyGroupTitle(title);
        try {
          const snapshot: UndoEntry[] = ids.map((id) => ({
            figurinha_id: id,
            quantidade: qtyRef.current[id] ?? 0,
          }));
          const { supabase, user } = await getSession();
          if (!user) {
            toast.error("Sessão expirada.");
            return;
          }
          await chunkedColecaoUpsert(
            supabase,
            user.id,
            ids.map((id) => ({ figurinha_id: id, quantidade: 0 })),
          );
          const patch = Object.fromEntries(ids.map((id) => [id, 0]));
          applyPatch(patch);
          toastSuccessMaybeUndo(
            `✅ ${ids.length} figurinha${ids.length === 1 ? "" : "s"} de ${title} marcadas como falta.`,
            snapshot.length <= MAX_UNDO_RECORDS ? snapshot : null,
          );
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Falha.");
        } finally {
          setBusyGroupTitle(null);
        }
      })();
    },
    [
      applyPatch,
      getSession,
      idsForGroupTitle,
      toastSuccessMaybeUndo,
    ],
  );

  const confirmFaltaModal = useCallback(async () => {
    if (!faltaModal) {
      return;
    }
    const { title, ids } = faltaModal;
    setFaltaModal(null);
    setBusyGroupTitle(title);
    try {
      const snapshot: UndoEntry[] = ids.map((id) => ({
        figurinha_id: id,
        quantidade: qtyRef.current[id] ?? 0,
      }));
      const { supabase, user } = await getSession();
      if (!user) {
        toast.error("Sessão expirada.");
        return;
      }
      await chunkedColecaoUpsert(
        supabase,
        user.id,
        ids.map((id) => ({ figurinha_id: id, quantidade: 0 })),
      );
      const patch = Object.fromEntries(ids.map((id) => [id, 0]));
      applyPatch(patch);
      toastSuccessMaybeUndo(
        `✅ ${ids.length} figurinha${ids.length === 1 ? "" : "s"} de ${title} marcadas como falta.`,
        snapshot.length <= MAX_UNDO_RECORDS ? snapshot : null,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha.");
    } finally {
      setBusyGroupTitle(null);
    }
  }, [applyPatch, faltaModal, getSession, toastSuccessMaybeUndo]);

  const onSelectionResetRequest = useCallback((title: string) => {
    const ids = idsForGroupTitle(title);
    setResetSelModal({ title, ids });
  }, [idsForGroupTitle]);

  const confirmResetSelection = useCallback(async () => {
    if (!resetSelModal) {
      return;
    }
    const { title, ids } = resetSelModal;
    setResetSelModal(null);
    setBusyGroupTitle(title);
    try {
      const snapshot: UndoEntry[] = ids.map((id) => ({
        figurinha_id: id,
        quantidade: qtyRef.current[id] ?? 0,
      }));

      const { supabase, user } = await getSession();
      if (!user) {
        toast.error("Sessão expirada.");
        return;
      }

      await chunkedColecaoDelete(supabase, user.id, ids);
      removeKeys(ids);

      toastSuccessMaybeUndo(
        `🗑️ Seleção «${title}» resetada (${ids.length} itens).`,
        snapshot.length <= MAX_UNDO_RECORDS ? snapshot : null,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao resetar.");
    } finally {
      setBusyGroupTitle(null);
    }
  }, [getSession, removeKeys, resetSelModal, toastSuccessMaybeUndo]);

  const onGlobalMarkHave1 = useCallback(async () => {
    const ids = figurinhas.map((f) => f.id);
    setGlobalBusy(true);
    setSaveError(null);
    try {
      const targetIds = ids.filter((id) => (qtyRef.current[id] ?? 0) === 0);
      setBulkProgress({ done: 0, total: targetIds.length });
      if (targetIds.length === 0) {
        toast.info("Todas as figurinhas já estão marcadas.");
        return;
      }

      const snapshot: UndoEntry[] = targetIds.map((id) => ({
        figurinha_id: id,
        quantidade: 0,
      }));

      const { supabase, user } = await getSession();
      if (!user) {
        toast.error("Sessão expirada.");
        return;
      }

      await chunkedColecaoUpsert(
        supabase,
        user.id,
        targetIds.map((id) => ({ figurinha_id: id, quantidade: 1 })),
        {
          onProgress: (done, total) => setBulkProgress({ done, total }),
        },
      );

      const patch = Object.fromEntries(targetIds.map((id) => [id, 1]));
      applyPatch(patch);

      toastSuccessMaybeUndo(
        `✅ ${targetIds.length} figurinha${targetIds.length === 1 ? "" : "s"} marcadas no álbum.`,
        snapshot.length <= MAX_UNDO_RECORDS ? snapshot : null,
      );
      setMassDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha.");
    } finally {
      setGlobalBusy(false);
      setBulkProgress(null);
    }
  }, [
    applyPatch,
    figurinhas,
    getSession,
    toastSuccessMaybeUndo,
  ]);

  const runQuickRegistrationPrep = useCallback(async () => {
    setQuickConfirmOpen(false);
    setMassDialogOpen(false);
    setQuickPrepLoading(true);
    setSaveError(null);

    try {
      const ids = figurinhas.map((f) => f.id);
      const targetIds = ids.filter((id) => (qtyRef.current[id] ?? 0) === 0);

      if (targetIds.length === 0) {
        toast.info(
          "Todas as figurinhas já estão marcadas — modo rápido ativo para ajustes.",
        );
        setQuickRegistrationMode(true);
        return;
      }

      const snapshot: UndoEntry[] = targetIds.map((id) => ({
        figurinha_id: id,
        quantidade: 0,
      }));

      setBulkProgress({ done: 0, total: targetIds.length });

      const { supabase, user } = await getSession();
      if (!user) {
        toast.error("Sessão expirada.");
        return;
      }

      await chunkedColecaoUpsert(
        supabase,
        user.id,
        targetIds.map((id) => ({ figurinha_id: id, quantidade: 1 })),
        {
          onProgress: (done, total) => setBulkProgress({ done, total }),
        },
      );

      const patch = Object.fromEntries(targetIds.map((id) => [id, 1]));
      applyPatch(patch);

      toastSuccessMaybeUndo(
        `Álbum preparado: ${targetIds.length} figurinha${targetIds.length === 1 ? "" : "s"} marcadas como tenho.`,
        snapshot.length <= MAX_UNDO_RECORDS ? snapshot : null,
      );

      setQuickRegistrationMode(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao preparar álbum.");
    } finally {
      setQuickPrepLoading(false);
      setBulkProgress(null);
    }
  }, [applyPatch, figurinhas, getSession, toastSuccessMaybeUndo]);

  const onResetCollection = useCallback(async () => {
    if (resetPhrase.trim() !== "RESETAR") {
      return;
    }
    setResetCollectionOpen(false);
    setResetPhrase("");
    setGlobalBusy(true);
    try {
      const { supabase, user } = await getSession();
      if (!user) {
        toast.error("Sessão expirada.");
        return;
      }
      const { error } = await supabase
        .from("colecao")
        .delete()
        .eq("user_id", user.id);
      if (error) {
        throw new Error(error.message);
      }
      removeKeys(figurinhas.map((f) => f.id));
      toast.success("Coleção resetada. Não há como desfazer esta ação.");
      setMassDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao resetar.");
    } finally {
      setGlobalBusy(false);
    }
  }, [figurinhas, getSession, removeKeys, resetPhrase]);

  const filteredFigurinhas = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return figurinhas.filter((f) => {
      const qty = quantities[f.id] ?? 0;

      if (needle) {
        const hay = `${f.nome} ${f.id} ${f.selecao ?? ""} ${f.selecao_codigo ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) {
          return false;
        }
      }

      switch (filterMode) {
        case "faltas":
          return qty === 0;
        case "repetidas":
          return qty > 1;
        case "tenho":
          return qty >= 1;
        default:
          return true;
      }
    });
  }, [figurinhas, quantities, search, filterMode]);

  const groupedByCopa = useMemo((): CopaAlbumSection[] => {
    const byBucket = new Map<string, Figurinha[]>();
    for (const f of filteredFigurinhas) {
      const bucket = copaBucketForFigurinha(f);
      const list = byBucket.get(bucket) ?? [];
      list.push(f);
      byBucket.set(bucket, list);
    }

    const sections: CopaAlbumSection[] = [];
    for (const letter of GRUPOS_ORDEM) {
      const items = byBucket.get(letter);
      if (items && items.length > 0) {
        sections.push({
          copaKey: letter,
          headerTitle: copaSectionLabel(letter),
          selections: buildSelectionGroups(items),
        });
      }
    }

    for (const bucketKey of COPA_ESPECIAIS_BUCKET_ORDER) {
      const items = byBucket.get(bucketKey);
      if (items && items.length > 0) {
        sections.push({
          copaKey: bucketKey,
          headerTitle: copaSectionLabel(bucketKey),
          selections: buildSelectionGroups(items),
        });
      }
    }

    return sections;
  }, [filteredFigurinhas]);

  const visibleCopaKeyList = useMemo(
    () => groupedByCopa.map((s) => s.copaKey),
    [groupedByCopa],
  );

  const statsByCopa = useMemo(() => {
    const map = new Map<string, { total: number; owned: number }>();
    for (const f of figurinhas) {
      const k = copaBucketForFigurinha(f);
      const cur = map.get(k) ?? { total: 0, owned: 0 };
      cur.total += 1;
      if ((quantities[f.id] ?? 0) >= 1) {
        cur.owned += 1;
      }
      map.set(k, cur);
    }
    return map;
  }, [figurinhas, quantities]);

  const filterSignature = `${filterMode}|${search.trim()}`;
  const visibleCopaKeysRef = useRef(visibleCopaKeyList);
  visibleCopaKeysRef.current = visibleCopaKeyList;
  const prevFilterSignatureRef = useRef(filterSignature);
  const prevNarrowFilterRef = useRef(false);

  useEffect(() => {
    const narrow = search.trim() !== "" || filterMode !== "all";

    if (!narrow) {
      if (prevNarrowFilterRef.current) {
        setOpenCopaGroups([]);
      }
      prevNarrowFilterRef.current = false;
      prevFilterSignatureRef.current = filterSignature;
      return;
    }

    prevNarrowFilterRef.current = true;

    if (prevFilterSignatureRef.current !== filterSignature) {
      prevFilterSignatureRef.current = filterSignature;
      setOpenCopaGroups(visibleCopaKeysRef.current);
    } else {
      setOpenCopaGroups((prev) =>
        prev.filter((k) => visibleCopaKeysRef.current.includes(k)),
      );
    }
  }, [filterSignature, visibleCopaKeyList, filterMode, search]);

  const isNarrowFilter = search.trim() !== "" || filterMode !== "all";

  const toggleCopaGroup = useCallback(
    (key: string) => {
      if (isNarrowFilter) {
        setOpenCopaGroups((prev) =>
          prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
      } else {
        setOpenCopaGroups((prev) =>
          prev.length === 1 && prev[0] === key ? [] : [key],
        );
      }
    },
    [isNarrowFilter],
  );

  const filterButtons: { mode: AlbumFilterMode; label: string }[] = [
    { mode: "all", label: "Todas" },
    { mode: "faltas", label: "Só faltas" },
    { mode: "tenho", label: "Só tenho" },
    { mode: "repetidas", label: "Só repetidas" },
  ];

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearch("");
    }
  };

  const dismissBulkTip = useCallback(() => {
    try {
      localStorage.setItem(HIDE_BULK_TIP_KEY, "1");
    } catch {
      /* ignore */
    }
    setBulkTipHidden(true);
  }, []);

  const showBulkTip =
    bulkTipReady && !bulkTipHidden && markedCount < 50 && !quickRegistrationMode;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {quickPrepLoading ?
        <div
          className="bg-background/90 fixed inset-0 z-[280] flex flex-col items-center justify-center gap-4 p-6 backdrop-blur-sm"
          role="alertdialog"
          aria-busy="true"
          aria-label="Preparando álbum"
        >
          <div
            className="loading-spinner-gradient animate-spin"
            aria-hidden
          />
          <p className="loading-gradient-text max-w-sm text-center text-base font-semibold">
            Preparando seu álbum…
          </p>
          <p className="text-muted-foreground max-w-sm text-center text-xs">
            Isso leva alguns segundos.
          </p>
          {bulkProgress ?
            <p className="text-muted-foreground text-xs">
              Marcando {bulkProgress.done}/{bulkProgress.total}…
            </p>
          : null}
        </div>
      : null}

      {quickRegistrationMode ?
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-3 text-sm text-orange-950 dark:text-orange-50"
          role="status"
        >
          <p className="min-w-0 flex-1 font-medium">
            🎯 Modo Cadastro Rápido ativo — toque nas figurinhas que você{" "}
            <span className="underline">não</span> tem.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-orange-600/50 shrink-0 bg-background/80"
            onClick={() => setQuickRegistrationMode(false)}
          >
            Sair do modo
          </Button>
        </div>
      : null}

      {showBulkTip ?
        <div className="border-border bg-muted/40 flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
          <p className="text-muted-foreground min-w-0 max-w-xl">
            💡 <span className="text-foreground font-medium">Já tem várias figurinhas?</span>{" "}
            Use os menus ⋯ em cada seleção pra marcar em lote, ou clique em{" "}
            <span className="text-foreground font-medium">Ações em massa</span> pra um cadastro
            mais rápido.
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={dismissBulkTip}>
            Não mostrar mais
          </Button>
        </div>
      : null}

      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Álbum</h1>
          <p className="text-muted-foreground text-sm">
            {quickRegistrationMode ?
              "Toque nas figurinhas que faltam para marcar como não tenho."
            : "Toque em + ou − para atualizar a coleção (salvo automaticamente)."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setMassDialogOpen(true)}
          >
            Ações em massa
          </Button>
          <Link
            href="/pacote"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "shrink-0 self-start",
            )}
          >
            Modo pacote rápido
          </Link>
        </div>
      </header>

      {saveError ?
        <p
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
          role="alert"
        >
          {saveError}
        </p>
      : null}

      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-10 flex flex-col gap-3 border-b pb-4 pt-1 backdrop-blur-md md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(({ mode, label }) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={filterMode === mode ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setFilterMode(mode)}
            >
              {label}
            </Button>
          ))}
        </div>
        <label className="flex min-w-[min(100%,20rem)] flex-1 flex-col gap-1 md:max-w-sm">
          <span className="text-muted-foreground text-xs font-medium">
            Buscar por nome ou código
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Nome, código ou seleção…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
          />
        </label>
      </div>

      <p className="text-muted-foreground text-sm">
        Mostrando{" "}
        <span className="text-foreground font-medium">
          {filteredFigurinhas.length}
        </span>{" "}
        de {figurinhas.length} figurinhas
      </p>

      {groupedByCopa.length === 0 ?
        <p className="text-muted-foreground py-12 text-center text-sm">
          Nenhuma figurinha neste filtro. Ajuste a busca ou os filtros acima.
        </p>
      : (
        <div className="flex flex-col gap-3">
          {groupedByCopa.map((section) => {
            const isOpen = openCopaGroups.includes(section.copaKey);
            const selectionCount = section.selections.length;
            const copaStats = statsByCopa.get(section.copaKey);
            const showProgress =
              copaStats !== undefined &&
              copaStats.owned >= 1 &&
              copaStats.total > 0;
            const progressPct = showProgress ?
              (copaStats.owned / copaStats.total) * 100
            : 0;
            const grupoCor = copaGroupAccentHex(section.copaKey);
            const bandeiraImagens = section.selections
              .map(([title, items]) => {
                const codigo = items[0]?.selecao_codigo ?? "";
                const src = flagIconSrcForSelecaoCodigo(codigo);
                if (!src) return null;
                return (
                  // Bandeiras via SVG (flag-icons): emojis de bandeira viram "MX ZA KR" no Windows.
                  // eslint-disable-next-line @next/next/no-img-element -- asset externo versionado no jsDelivr
                  <img
                    key={`${section.copaKey}-${codigo}-${title}`}
                    src={src}
                    alt=""
                    title={title}
                    width={28}
                    height={21}
                    loading="lazy"
                    decoding="async"
                    className="inline-block h-[1.125rem] w-auto shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10 dark:ring-white/15"
                  />
                );
              })
              .filter(Boolean);

            return (
              <div
                key={section.copaKey}
                className="border-border overflow-hidden rounded-xl border"
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left outline-none transition-[filter]",
                    "hover:brightness-[0.98] dark:hover:brightness-[1.04]",
                    "focus-visible:ring-ring focus-visible:ring-2",
                  )}
                  style={{
                    borderLeft: `4px solid ${grupoCor}`,
                    background: `linear-gradient(to right, ${grupoCor}14, transparent)`,
                  }}
                  onClick={() => toggleCopaGroup(section.copaKey)}
                  aria-expanded={isOpen}
                >
                  <span className="text-muted-foreground mt-0.5 shrink-0" aria-hidden>
                    {isOpen ?
                      <ChevronDown className="size-5" />
                    : <ChevronRight className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1.5">
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-semibold">
                        {section.copaKey === ESPECIAIS_CC_BUCKET ?
                          <AlbumCcHeadingWithBottleIcon />
                        : section.headerTitle}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {selectionCount}{" "}
                        {selectionCount === 1 ? "seleção" : "seleções"}
                      </span>
                    </span>
                    {bandeiraImagens.length > 0 ?
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {bandeiraImagens}
                      </div>
                    : null}
                    {showProgress ?
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {copaStats.owned}/{copaStats.total} figurinhas
                        </span>
                        <span
                          className="bg-muted/80 inline-flex h-1.5 w-20 max-w-[40%] overflow-hidden rounded-full sm:w-24"
                          role="progressbar"
                          aria-valuenow={copaStats.owned}
                          aria-valuemin={0}
                          aria-valuemax={copaStats.total}
                          aria-label={`Figurinhas no ${section.headerTitle}: ${copaStats.owned} de ${copaStats.total}`}
                        >
                          <span
                            className="h-full rounded-full transition-all duration-300"
                            style={
                              copaStats.total > 0 &&
                              copaStats.owned >= copaStats.total
                                ? brandProgressBarStyle(100)
                                : brandProgressBarStyle(progressPct)
                            }
                          />
                        </span>
                      </span>
                    : null}
                  </span>
                </button>

                {isOpen ?
                  <div className="border-border flex flex-col gap-3 border-t px-2 py-3 sm:px-3">
                    {section.selections.map(([title, items]) => (
                      <details
                        key={`${section.copaKey}-${title}`}
                        className="group border-border rounded-xl border"
                      >
                        <summary
                          className={cn(
                            "cursor-pointer list-none px-4 py-3 font-medium outline-none",
                            "[&::-webkit-details-marker]:hidden",
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="min-w-0">
                              {title === ESPECIAIS_SELECTION_TITLE_CC ?
                                <AlbumCcHeadingWithBottleIcon />
                              : title}
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              {busyGroupTitle === title ?
                                <span
                                  className="loading-spinner-gradient-sm inline-block animate-spin"
                                  aria-hidden
                                />
                              : null}
                              <span className="text-muted-foreground text-xs font-normal whitespace-nowrap">
                                {items.length} figurinha{items.length === 1 ? "" : "s"}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-muted-foreground hover:text-foreground shrink-0"
                                    disabled={
                                      busyGroupTitle === title ||
                                      quickPrepLoading ||
                                      globalBusy
                                    }
                                    aria-label={`Ações em massa da seleção ${title}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-56"
                                  onCloseAutoFocus={(e) => e.preventDefault()}
                                >
                                  <DropdownMenuItem
                                    disabled={busyGroupTitle === title || globalBusy}
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      void onSelectionMarkHave1(title);
                                    }}
                                  >
                                    ✅ Marcar todas como &quot;tenho 1&quot;
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={busyGroupTitle === title || globalBusy}
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      onSelectionMarkFaltaRequest(title);
                                    }}
                                  >
                                    ❌ Marcar todas como faltas (0)
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={busyGroupTitle === title || globalBusy}
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      onSelectionResetRequest(title);
                                    }}
                                  >
                                    🗑️ Resetar seleção
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </span>
                          </span>

                          {(() => {
                            const total = items.length;
                            const tendo = items.filter(
                              (f) => (quantities[f.id] ?? 0) >= 1,
                            ).length;
                            if (tendo === 0) return null;
                            const pct = (tendo / total) * 100;
                            const selComplete = tendo === total && total > 0;
                            return (
                              <div className="px-4 pb-2 pt-1">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-muted-foreground text-xs">
                                    {tendo}/{total} figurinhas
                                  </span>
                                </div>
                                <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                                  <div
                                    className="h-1 rounded-full transition-all duration-300"
                                    style={
                                      selComplete
                                        ? brandProgressBarStyle(100)
                                        : brandProgressBarStyle(pct)
                                    }
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </summary>
                        <div className="border-border grid gap-2 border-t p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {items.map((f) => (
                            <FigurinhaCard
                              key={f.id}
                              figurinha={f}
                              quantidade={quantities[f.id] ?? 0}
                              disabled={
                                busyId === f.id ||
                                quickPrepLoading ||
                                globalBusy ||
                                (busyGroupTitle !== null &&
                                  albumGroupTitle(f) === busyGroupTitle)
                              }
                              quickTapMode={quickRegistrationMode}
                              onQuickTap={() => handleQuickTap(f.id)}
                              onQuantidadeChange={handleQtyChange}
                            />
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                : null}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={massDialogOpen} onOpenChange={setMassDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ações em massa</DialogTitle>
            <DialogDescription>
              ⚠️ Cuidado: estas ações podem afetar o álbum inteiro (
              {figurinhas.length} figurinhas).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="border-border space-y-3 rounded-xl border p-4">
              <p className="text-sm font-medium">Marcar todo o álbum como &quot;tenho 1&quot;</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Só afeta figurinhas que ainda não tem (quantidade 0). Repetidas não são
                alteradas.
              </p>
              {bulkProgress && globalBusy ?
                <p className="text-muted-foreground text-xs">
                  Marcando {bulkProgress.done}/{bulkProgress.total}…
                </p>
              : null}
              <Button
                type="button"
                variant="gradient"
                size="sm"
                className="w-full sm:w-auto"
                disabled={globalBusy || quickPrepLoading}
                onClick={() => void onGlobalMarkHave1()}
              >
                Aplicar
              </Button>
            </div>

            <div className="border-border space-y-3 rounded-xl border p-4">
              <p className="text-sm font-medium">Modo de Cadastro Rápido</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Para quem já tem o álbum quase completo. Marca tudo como &quot;tenho&quot; e você
                só toca nas que estão faltando.
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={globalBusy || quickPrepLoading}
                onClick={() => setQuickConfirmOpen(true)}
              >
                Iniciar
              </Button>
            </div>

            <div className="border-border space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Resetar coleção inteira</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Apaga todos os registros de figurinhas do seu usuário. Esta ação não pode ser
                desfeita pelo app.
              </p>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={globalBusy || quickPrepLoading}
                onClick={() => {
                  setMassDialogOpen(false);
                  setResetCollectionOpen(true);
                }}
              >
                Resetar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={quickConfirmOpen} onOpenChange={setQuickConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modo Cadastro Rápido</DialogTitle>
            <DialogDescription className="text-left">
              Vamos marcar todas as figurinhas que ainda estão em falta como &quot;tenho 1&quot;
              (preservando repetidas). Depois você toca só nas que não tem. Confirma?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setQuickConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="gradient" onClick={() => void runQuickRegistrationPrep()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetCollectionOpen} onOpenChange={setResetCollectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar coleção inteira</DialogTitle>
            <DialogDescription className="text-left">
              Digite <strong>RESETAR</strong> para apagar todos os registros da sua coleção.
              Isso não pode ser desfeito.
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={resetPhrase}
            onChange={(e) => setResetPhrase(e.target.value)}
            placeholder="RESETAR"
            autoCapitalize="characters"
            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResetCollectionOpen(false);
                setResetPhrase("");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={resetPhrase.trim() !== "RESETAR" || globalBusy}
              onClick={() => void onResetCollection()}
            >
              Apagar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(faltaModal)} onOpenChange={(o) => !o && setFaltaModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar todas como faltas?</DialogTitle>
            <DialogDescription className="text-left">
              Você tem{" "}
              <strong>{faltaModal?.marcadas ?? 0}</strong> figurinha
              {(faltaModal?.marcadas ?? 0) === 1 ? "" : "s"} marcada
              {(faltaModal?.marcadas ?? 0) === 1 ? "" : "s"} nesta seleção (
              <strong>{faltaModal?.repetidas ?? 0}</strong>{" "}
              {(faltaModal?.repetidas ?? 0) === 1 ? "é repetida" : "são repetidas"}).
              Confirma marcar todas como faltas?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setFaltaModal(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmFaltaModal()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetSelModal)} onOpenChange={(o) => !o && setResetSelModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar seleção?</DialogTitle>
            <DialogDescription className="text-left">
              Remove todos os registros de figurinhas do grupo{" "}
              <strong>{resetSelModal?.title}</strong> ({resetSelModal?.ids.length ?? 0} itens).
              Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setResetSelModal(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmResetSelection()}>
              Resetar seleção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
