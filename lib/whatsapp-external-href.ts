/**
 * Monta URL para abrir WhatsApp (wa.me) a partir do valor no perfil.
 *
 * Aceita número formatado, URL `https://wa.me/...` (extrai os dígitos) ou outro
 * link https/https armazenado como fallback.
 */
export function whatsappExternalHref(raw: string | null | undefined): string | null {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) {
    return null;
  }
  const digits = t.replace(/\D/g, "");
  if (digits.length > 0) {
    return `https://wa.me/${digits}`;
  }
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const u = new URL(t);
      if (u.protocol === "http:" || u.protocol === "https:") {
        return u.href;
      }
    } catch {
      return null;
    }
  }
  return null;
}
