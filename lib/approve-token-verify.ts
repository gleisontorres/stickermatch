import crypto from "crypto";

/**
 * Decodifica token base64url para Buffer (assinatura HMAC crua).
 */
function base64UrlToBuffer(token: string): Buffer | null {
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(normalized + pad, "base64");
  } catch {
    return null;
  }
}

/**
 * Verifica se `token` é HMAC-SHA256(secret, perfilId) em base64url (mesmo formato da Edge Function).
 */
export function verifyApproveToken(
  token: string,
  perfilId: string,
  secret: string,
): boolean {
  const received = base64UrlToBuffer(token.trim());
  if (!received || received.length !== 32) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(perfilId, "utf8")
    .digest();
  if (received.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(received, expected);
}
