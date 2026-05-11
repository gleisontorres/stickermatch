"use client";

import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Ban, CheckCircle2, RotateCcw, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface AdminPerfilRow {
  id: string;
  nome: string | null;
  email: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

interface AdminAccessPanelProps {
  initialPerfis: AdminPerfilRow[];
}

type TabKey = "pendentes" | "aprovados" | "rejeitados";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function formatReviewedAt(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  try {
    return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

function relativeRequestedAt(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return "—";
  }
}

/**
 * Painel administrativo: filas por status com ações de aprovação.
 */
export function AdminAccessPanel({ initialPerfis }: AdminAccessPanelProps) {
  const [perfis, setPerfis] = useState<AdminPerfilRow[]>(initialPerfis);
  const [activeTab, setActiveTab] = useState<TabKey>("pendentes");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { pendentes, aprovados, rejeitados } = useMemo(() => {
    const p = perfis.filter((row) => row.status === "pendente");
    const a = perfis.filter((row) => row.status === "aprovado");
    const r = perfis.filter((row) => row.status === "rejeitado");
    return { pendentes: p, aprovados: a, rejeitados: r };
  }, [perfis]);

  async function setStatus(
    id: string,
    nextStatus: "aprovado" | "rejeitado",
    successMessage: string,
  ) {
    const supabase = createClient();
    const reviewedAt = new Date().toISOString();
    const snapshot = perfis;

    setPendingId(id);
    setPerfis((rows) =>
      rows.map((row) =>
        row.id === id ?
          { ...row, status: nextStatus, reviewed_at: reviewedAt }
        : row,
      ),
    );

    const { error } = await supabase
      .from("perfis")
      .update({ status: nextStatus, reviewed_at: reviewedAt })
      .eq("id", id);

    if (error) {
      setPerfis(snapshot);
      toast.error("Não foi possível atualizar o usuário. Tente de novo.");
      setPendingId(null);
      return;
    }

    toast.success(successMessage);
    setPendingId(null);
  }

  function tabButton(tab: TabKey, label: string, count: number) {
    const selected = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={cn(
          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          selected ?
            "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted/60 text-muted-foreground",
        )}
      >
        {label}{" "}
        <span
          className={cn(
            "tabular-nums",
            selected ? "opacity-90" : "opacity-80",
          )}
        >
          ({count})
        </span>
      </button>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="size-6 shrink-0" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Painel Admin — Stickermatch
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Aprove ou recuse solicitações de acesso. Alterações aplicam na hora
          para quem está na fila de espera.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabButton("pendentes", "Pendentes", pendentes.length)}
        {tabButton("aprovados", "Aprovados", aprovados.length)}
        {tabButton("rejeitados", "Rejeitados", rejeitados.length)}
      </div>

      {activeTab === "pendentes" ?
        <section aria-labelledby="pendentes-heading" className="space-y-4">
          <h2 id="pendentes-heading" className="text-sm font-semibold uppercase">
            Pendentes
          </h2>
          {pendentes.length === 0 ?
            <p className="text-muted-foreground text-sm">
              Nenhuma solicitação pendente.
            </p>
          : (
            <ul className="flex flex-col gap-3">
              {pendentes.map((row) => (
                <li
                  key={row.id}
                  className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="shrink-0">
                      {row.avatar_url ?
                        // eslint-disable-next-line @next/next/no-img-element -- URL externa (Google)
                        <img
                          src={row.avatar_url}
                          alt=""
                          className="size-12 rounded-full object-cover"
                        />
                      : (
                        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full text-sm font-medium">
                          {initialsFromName(row.nome ?? row.email ?? "?")}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">
                        {row.nome?.trim() || "Sem nome"}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
                        {row.email ?? "—"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Solicitou {relativeRequestedAt(row.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1"
                      disabled={pendingId === row.id}
                      onClick={() =>
                        void setStatus(row.id, "aprovado", "Usuário aprovado.")
                      }
                    >
                      <CheckCircle2 className="size-4" aria-hidden />
                      Aprovar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      disabled={pendingId === row.id}
                      onClick={() =>
                        void setStatus(row.id, "rejeitado", "Usuário recusado.")
                      }
                    >
                      <Ban className="size-4" aria-hidden />
                      Rejeitar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      : null}

      {activeTab === "aprovados" ?
        <section aria-labelledby="aprovados-heading" className="space-y-4">
          <h2 id="aprovados-heading" className="text-sm font-semibold uppercase">
            Aprovados
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Decisão em</th>
                </tr>
              </thead>
              <tbody>
                {aprovados.map((row) => (
                  <tr key={row.id} className="border-border border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.avatar_url ?
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.avatar_url}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        : (
                          <span className="bg-muted flex size-8 items-center justify-center rounded-full text-[10px] font-medium">
                            {initialsFromName(row.nome ?? row.email ?? "?")}
                          </span>
                        )}
                        <span className="truncate font-medium">
                          {row.nome?.trim() || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {row.email ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 tabular-nums">
                      {formatReviewedAt(row.reviewed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {aprovados.length === 0 ?
            <p className="text-muted-foreground text-sm">
              Nenhum usuário aprovado listado.
            </p>
          : null}
        </section>
      : null}

      {activeTab === "rejeitados" ?
        <section aria-labelledby="rejeitados-heading" className="space-y-4">
          <h2 id="rejeitados-heading" className="text-sm font-semibold uppercase">
            Rejeitados
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Decisão em</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rejeitados.map((row) => (
                  <tr key={row.id} className="border-border border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.avatar_url ?
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.avatar_url}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        : (
                          <span className="bg-muted flex size-8 items-center justify-center rounded-full text-[10px] font-medium">
                            {initialsFromName(row.nome ?? row.email ?? "?")}
                          </span>
                        )}
                        <span className="truncate font-medium">
                          {row.nome?.trim() || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {row.email ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 tabular-nums">
                      {formatReviewedAt(row.reviewed_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={pendingId === row.id}
                        onClick={() =>
                          void setStatus(
                            row.id,
                            "aprovado",
                            "Usuário reativado como aprovado.",
                          )
                        }
                      >
                        <RotateCcw className="size-4" aria-hidden />
                        Reativar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rejeitados.length === 0 ?
            <p className="text-muted-foreground text-sm">
              Nenhum usuário recusado.
            </p>
          : null}
        </section>
      : null}
    </div>
  );
}
