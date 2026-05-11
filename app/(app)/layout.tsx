import { AppShell } from "@/components/nav/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const metaNome =
    typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
  const metaAvatar =
    typeof meta?.avatar_url === "string" ? meta.avatar_url.trim() : "";

  let perfilNome = "";
  let perfilEmail = "";
  let perfilAvatar = "";
  let perfilIsAdmin = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("nome, email, avatar_url, is_admin")
      .eq("id", user.id)
      .maybeSingle();
    perfilNome = perfil?.nome?.trim() ?? "";
    perfilEmail = perfil?.email?.trim() ?? "";
    perfilAvatar = perfil?.avatar_url?.trim() ?? "";
    perfilIsAdmin = Boolean(perfil?.is_admin);
  }

  const displayName =
    perfilNome ||
    metaNome ||
    user?.email?.split("@")[0] ||
    user?.email ||
    "Conta";

  const email = perfilEmail || user?.email || "";

  const avatarUrl = perfilAvatar || metaAvatar;

  const userNav = {
    displayName,
    email,
    avatarUrl,
    isAdmin: perfilIsAdmin,
  };

  return (
    <div className="bg-background min-h-screen">
      <AppShell user={userNav}>{children}</AppShell>
    </div>
  );
}
