import type { MatchPartnerEntry, MatchStickerLabel } from "@/lib/types";
import { whatsappExternalHref } from "@/lib/whatsapp-external-href";

type MessageVariant = "give" | "receive";

interface StickerPick {
  variant: MessageVariant;
  stickers: MatchStickerLabel[];
}

/**
 * Escolhe figurinhas e o tom da mensagem conforme o equilíbrio da troca.
 *
 * Caso A (dou ≤ recebo): primeiras N de `eu_dou`.
 * Caso B (recebo < dou): primeiras N de `eu_recebo`.
 * N = min(qtd dou, qtd recebo). Em troca só de um lado (N = 0), usa a lista não vazia.
 */
function pickStickersForMessage(entry: MatchPartnerEntry): StickerPick {
  const giveCount = entry.eu_dou.length;
  const receiveCount = entry.eu_recebo.length;
  const balance = entry.scoreMutual;
  const caseGive = giveCount <= receiveCount;

  if (balance === 0) {
    if (giveCount > 0 && receiveCount === 0) {
      return { variant: "give", stickers: entry.eu_dou };
    }
    if (receiveCount > 0 && giveCount === 0) {
      return { variant: "receive", stickers: entry.eu_recebo };
    }
    return { variant: caseGive ? "give" : "receive", stickers: [] };
  }

  if (caseGive) {
    return { variant: "give", stickers: entry.eu_dou.slice(0, balance) };
  }
  return { variant: "receive", stickers: entry.eu_recebo.slice(0, balance) };
}

function formatStickerBullets(stickers: MatchStickerLabel[]): string {
  if (stickers.length === 0) {
    return "";
  }
  return stickers.map((s) => `• ${s.label}`).join("\n");
}

/**
 * Monta o texto da mensagem de abertura de troca no WhatsApp.
 */
export function buildMatchWhatsappMessage(entry: MatchPartnerEntry): string {
  const partnerName = entry.displayName.trim() || "parceiro";
  const { variant, stickers } = pickStickersForMessage(entry);
  const bullets = formatStickerBullets(stickers);
  const bulletsBlock = bullets ? `\n\n${bullets}` : "";

  if (variant === "give") {
    return (
      `Oi ${partnerName}! Vi aqui no CollectHub que tenho figurinhas que você precisa. Que tal a gente trocar? 🔄` +
      `\n\nEu tenho pra te dar:${bulletsBlock}` +
      `\n\nVamos combinar? 😄\ncollecthub.app`
    );
  }

  return (
    `Oi ${partnerName}! Vi aqui no CollectHub que você tem figurinhas que eu preciso. Que tal a gente trocar? 🔄` +
    `\n\nEu preciso dessas aqui:${bulletsBlock}` +
    `\n\nVamos combinar? 😄\ncollecthub.app`
  );
}

/**
 * URL `wa.me` com mensagem pré-preenchida para um parceiro de match.
 */
export function matchWhatsappHref(entry: MatchPartnerEntry): string | null {
  const base = whatsappExternalHref(entry.whatsapp);
  if (!base) {
    return null;
  }
  const message = buildMatchWhatsappMessage(entry);
  return `${base}?text=${encodeURIComponent(message)}`;
}
