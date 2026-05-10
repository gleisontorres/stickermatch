/** Modelo Gemini para o chat Albu AI (tier gratuito). */
export const GEMINI_CHAT_MODEL = "gemini-2.5-flash";

/**
 * Verifica se a API key do Gemini está configurada no servidor.
 */
export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GOOGLE_GEMINI_API_KEY?.trim());
}
