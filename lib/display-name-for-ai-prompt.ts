/**
 * Nome ou e-mail para textos enviados ao modelo de IA.
 * Nunca usa UUID nem prefixo de id de usuário.
 */
export function displayNameForAiPrompt(
  nome: string | null | undefined,
  email: string | null | undefined,
): string {
  const n = nome?.trim();
  if (n) {
    return n;
  }
  const e = email?.trim();
  if (e) {
    return e;
  }
  return "Usuário desconhecido";
}
