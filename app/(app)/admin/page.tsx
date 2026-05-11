import { redirect } from "next/navigation";

import {
  AdminAccessPanel,
  type AdminPerfilRow,
} from "@/components/admin/admin-access-panel";
import { createClient } from "@/lib/supabase/server";

/**
 * Painel de moderação de acessos (somente perfil com is_admin).
 */
export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfilAdmin } = await supabase
    .from("perfis")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfilAdmin?.is_admin) {
    redirect("/dashboard");
  }

  const { data: perfis, error } = await supabase
    .from("perfis")
    .select("id, nome, email, avatar_url, status, created_at, reviewed_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="text-destructive px-4 py-12 text-center text-sm">
        Não foi possível carregar os perfis. Confira a migration e as políticas
        RLS no Supabase.
      </div>
    );
  }

  const rows = (perfis ?? []) as AdminPerfilRow[];

  return <AdminAccessPanel initialPerfis={rows} />;
}
