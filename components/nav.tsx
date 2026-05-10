import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/album", label: "Álbum" },
  { href: "/pacote", label: "Pacote" },
  { href: "/repetidas", label: "Repetidas" },
  { href: "/faltas", label: "Faltas" },
  { href: "/matches", label: "Matches" },
  { href: "/chat", label: "Chat" },
  { href: "/perfil", label: "Perfil" },
] as const;

/**
 * Navegação principal da área autenticada (refinar na tarefa 2+).
 */
export function Nav() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm font-medium">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
