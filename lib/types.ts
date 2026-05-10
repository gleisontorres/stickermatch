/** Identificador de figurinha no catálogo (ex.: BRA01). */
export type FigurinhaId = string;

/** Linha do catálogo `figurinhas` (subset usado na UI). */
export interface Figurinha {
  id: string;
  numero: number | null;
  nome: string;
  selecao: string | null;
  selecao_codigo: string | null;
  grupo: string | null;
  tipo: "jogador" | "logo" | "especial";
  posicao: string | null;
  imagem_url: string | null;
}

export type AlbumFilterMode = "all" | "faltas" | "repetidas" | "tenho";

/** Rótulo de figurinha já resolvido para exibição em matches. */
export interface MatchStickerLabel {
  id: string;
  label: string;
}

/** Match agregado por parceiro (server monta para a UI). */
export interface MatchPartnerEntry {
  partnerId: string;
  displayName: string;
  whatsapp: string | null;
  eu_dou: MatchStickerLabel[];
  eu_recebo: MatchStickerLabel[];
  scoreMutual: number;
  isMutual: boolean;
}
