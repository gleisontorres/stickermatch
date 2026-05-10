import Anthropic from "@anthropic-ai/sdk";

/** Modelo solicitado no PROMPT_CURSOR.md (Haiku). */
export const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001" as const;

let singleton: Anthropic | null = null;

/**
 * Indica se a API key está disponível no ambiente (sem lançar erro).
 */
export function hasAnthropicApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Cliente singleton para Route Handlers / Server Actions (apenas server-side).
 */
export function getAnthropicClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY não configurada.");
  }
  if (!singleton) {
    singleton = new Anthropic({ apiKey: key });
  }
  return singleton;
}
