/**
 * Indica se o link da navegação deve aparecer como ativo para o pathname atual.
 */
export function isNavPathActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }
  return pathname.startsWith(`${href}/`);
}
