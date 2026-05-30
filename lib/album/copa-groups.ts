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

const REGIONAL_INDICATOR_A = 0x1f1e6;

/** Subdivisões do Reino Unido — verificadas antes da conversão ISO genérica. */
const SPECIAL_FLAGS: Record<string, string> = {
  SCO: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E006F}\u{E007F}",
  ENG: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
  WAL: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
};

/** Bandeiras emoji para slugs flag-icons que não são ISO2 simples. */
const FLAG_SLUG_EMOJI: Record<string, string> = {
  "gb-eng": SPECIAL_FLAGS.ENG,
  "gb-sct": SPECIAL_FLAGS.SCO,
  "gb-wls": SPECIAL_FLAGS.WAL,
};

function iso2ToFlagEmoji(iso2: string): string | null {
  const upper = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) {
    return null;
  }
  return String.fromCodePoint(
    ...[...upper].map(
      (char) => REGIONAL_INDICATOR_A + (char.charCodeAt(0) - 65),
    ),
  );
}

function flagEmojiFromSlug(slug: string): string | null {
  const preset = FLAG_SLUG_EMOJI[slug];
  if (preset) {
    return preset;
  }
  return iso2ToFlagEmoji(slug);
}

/**
 * Emoji de bandeira para `selecao_codigo`, ou null (ex.: FWC, CC).
 * Usa o mesmo mapa `SELECAO_CODIGO_FLAG_SLUG` de `flagIconSrcForSelecaoCodigo`.
 */
export function flagEmojiForSelecaoCodigo(
  selecaoCodigo: string | null | undefined,
): string | null {
  const key = (selecaoCodigo ?? "").trim().toUpperCase();
  if (!key) {
    return null;
  }

  const special = SPECIAL_FLAGS[key];
  if (special) {
    return special;
  }

  const slug = SELECAO_CODIGO_FLAG_SLUG[key];
  if (!slug) {
    return null;
  }
  return flagEmojiFromSlug(slug);
}

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

/** Ordem oficial das seleções dentro de cada grupo (Copa 2026, códigos FIFA). */
export const GRUPO_SELECOES_ORDEM: Record<
  (typeof GRUPOS_ORDEM)[number],
  readonly string[]
> = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"],
};

const GRUPO_SET = new Set<string>(GRUPOS_ORDEM);

/** Figurinhas de seleção (jogador, logo, cartão de seleção) — não especiais do álbum. */
export function isAlbumTeamFigurinha(
  f: Pick<Figurinha, "tipo">,
): boolean {
  return (
    f.tipo === "jogador" || f.tipo === "logo" || f.tipo === "selecao"
  );
}

/** Índice do grupo A–L; valores fora da lista vão após L. */
export function grupoOrdemIndex(grupo: string | null | undefined): number {
  if (grupo == null) {
    return GRUPOS_ORDEM.length;
  }
  const idx = (GRUPOS_ORDEM as readonly string[]).indexOf(grupo);
  return idx >= 0 ? idx : GRUPOS_ORDEM.length;
}

/** Posição da seleção dentro do grupo conforme `GRUPO_SELECOES_ORDEM`. */
export function selecaoCodigoOrdemNoGrupo(
  f: Pick<Figurinha, "grupo" | "selecao_codigo">,
): number {
  const g = f.grupo;
  if (g == null || !GRUPO_SET.has(g)) {
    return 99;
  }
  const list = GRUPO_SELECOES_ORDEM[g as (typeof GRUPOS_ORDEM)[number]];
  const sc = (f.selecao_codigo ?? "").trim().toUpperCase();
  const idx = list.indexOf(sc);
  return idx >= 0 ? idx : list.length;
}

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
