/**
 * Percentual de completude do álbum para exibição e barra de progresso.
 *
 * Regra: 100% só com todas as figurinhas “tenho”; abaixo disso no máximo 99,9%
 * na zona alta (≥99% cru), com uma casa decimal e vírgula pt-BR.
 */

/** Razão 0–100 para largura da barra (valor cru, sem arredondar pra “100” fictício). */
export function albumCompletionBarPercent(owned: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (owned / total) * 100));
}

/**
 * Retorna o trecho numérico exibido antes do símbolo % (ex.: "99,9", "100", "50").
 */
export function formatAlbumCompletionPercentDisplay(
  owned: number,
  total: number,
): string {
  if (total <= 0 || owned <= 0) {
    return "0";
  }
  if (owned >= total) {
    return "100";
  }

  const raw = (owned / total) * 100;

  if (raw >= 99) {
    /* Arredondamento a 1 decimal com teto 99,9 (979/980 → 99,9). Math.floor daria 99,8. */
    const roundedOneDecimal = Math.min(Math.round(raw * 10) / 10, 99.9);
    return roundedOneDecimal.toFixed(1).replace(".", ",");
  }

  return String(Math.round(raw));
}
