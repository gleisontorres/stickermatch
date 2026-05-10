import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav-bar";

/**
 * Navbar da área autenticada: resolve nome para exibir e delega UI ao cliente.
 */
export async function Nav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "";
  if (user) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("nome, email")
      .eq("id", user.id)
      .maybeSingle();
    displayName =
      perfil?.nome?.trim() ||
      perfil?.email?.trim() ||
      user.email?.split("@")[0] ||
      user.email ||
      "";
  }

  return <NavBar displayName={displayName} />;
}
