import type { Figurinha } from "@/lib/types";

import { ESPECIAIS_SELECTION_TITLE_CC } from "@/lib/album/group-title";

/** Ordem dos grupos no álbum físico Panini (Copa 2026). */
export const GRUPOS_ORDEM = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

/** Chave da seção externa para itens com grupo ∉ A–L e não‑FWC/CC. */
export const ESPECIAIS_BUCKET = "Especiais";

/** FIFA World Cup (figurinhas douradas, selecao_codigo FWC). */
export const ESPECIAIS_FWC_BUCKET = "Especiais-FWC";

/** Coca‑Cola (patrocinador, selecao_codigo CC). */
export const ESPECIAIS_CC_BUCKET = "Especiais-CC";

/** Ordem das seções de especiais após os grupos A–L. */
export const COPA_ESPECIAIS_BUCKET_ORDER = [
  ESPECIAIS_FWC_BUCKET,
  ESPECIAIS_CC_BUCKET,
  ESPECIAIS_BUCKET,
] as const;

/** Slug do pacote lipis/flag-icons (flags/4x3/{slug}.svg) por `selecao_codigo` do catálogo. FWC omitido. */
export const SELECAO_CODIGO_FLAG_SLUG: Record<string, string> = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CIV: "ci",
  COD: "cd",
  COL: "co",
  CPV: "cv",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  IRN: "ir",
  IRQ: "iq",
  JOR: "jo",
  JPN: "jp",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  RSA: "za",
  /** Alias legado se algum registro tiver ISO2 em vez do código Panini. */
  ZA: "za",
  SCO: "gb-sct",
  SEN: "sn",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TUR: "tr",
  URU: "uy",
  USA: "us",
  UZB: "uz",
};

const FLAG_ICONS_BASE =
  "https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3";

/**
 * URL do SVG da bandeira (flag-icons) para `selecao_codigo`, ou null se não houver (ex.: FWC).
 */
export function flagIconSrcForSelecaoCodigo(
  selecaoCodigo: string | null | undefined,
): string | null {
  const key = (selecaoCodigo ?? "").trim().toUpperCase();
  if (!key) return null;
  const slug = SELECAO_CODIGO_FLAG_SLUG[key];
  if (!slug) return null;
  return `${FLAG_ICONS_BASE}/${slug}.svg`;
}
export const GRUPO_CORES: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
  E: "#8b5cf6",
  F: "#06b6d4",
  G: "#ec4899",
  H: "#f97316",
  I: "#84cc16",
  J: "#6366f1",
  K: "#14b8a6",
  L: "#d97706",
  [ESPECIAIS_BUCKET]: "#94a3b8",
  [ESPECIAIS_FWC_BUCKET]: "#f59e0b",
  [ESPECIAIS_CC_BUCKET]: "#ef4444",
};

const GRUPO_SET = new Set<string>(GRUPOS_ORDEM);

/**
 * Cor de acento para o cabeçalho do grupo no álbum.
 */
export function copaGroupAccentHex(copaKey: string): string {
  return GRUPO_CORES[copaKey] ?? "#94a3b8";
}

/**
 * Retorna a chave da seção do álbum (A–L ou blocos de especiais FWC/CC/outros).
 * `grupo` ∈ A–L usa a letra; fora disso diferencia especial FWC/CC por `selecao_codigo`.
 */
export function copaBucketForFigurinha(
  f: Pick<Figurinha, "grupo" | "tipo" | "selecao_codigo">,
): string {
  const g = f.grupo;
  if (g != null && GRUPO_SET.has(g)) {
    return g;
  }

  const sc = (f.selecao_codigo ?? "").trim().toUpperCase();
  if (f.tipo === "especial") {
    if (sc === "FWC") {
      return ESPECIAIS_FWC_BUCKET;
    }
    if (sc === "CC") {
      return ESPECIAIS_CC_BUCKET;
    }
  }

  return ESPECIAIS_BUCKET;
}

/** Rótulo do header da seção externa (ex.: "Grupo A", "Especiais", FWC, CC). */
export function copaSectionLabel(bucket: string): string {
  if (bucket === ESPECIAIS_BUCKET) {
    return ESPECIAIS_BUCKET;
  }
  if (bucket === ESPECIAIS_FWC_BUCKET) {
    return "🏆 FWC — FIFA World Cup";
  }
  if (bucket === ESPECIAIS_CC_BUCKET) {
    return ESPECIAIS_SELECTION_TITLE_CC;
  }
  return `Grupo ${bucket}`;
}
