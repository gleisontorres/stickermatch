/**
 * Formata distância em km para exibição curta (apenas UI).
 */
export function formatDistanceKm(
  km: number | null | undefined,
): string | null {
  if (km === null || km === undefined || Number.isNaN(km)) {
    return null;
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1).replace(".", ",")} km`;
  }
  return `${Math.round(km)} km`;
}
