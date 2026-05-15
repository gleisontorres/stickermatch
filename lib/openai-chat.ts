/** Modelo OpenAI para o chat Albu AI (configurável via env). */
export const OPENAI_CHAT_MODEL =
  process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-5.4-nano";

/**
 * Indica se a API key da OpenAI está configurada no servidor.
 */
export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
