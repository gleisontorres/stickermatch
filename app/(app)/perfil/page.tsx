import { redirect } from "next/navigation";

import { PerfilForm, type PerfilFormInitial } from "@/components/perfil-form";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select("nome, avatar_url, whatsapp, email")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const metaNome =
    typeof meta?.full_name === "string" ? meta.full_name : "";
  const metaAvatar =
    typeof meta?.avatar_url === "string" ? meta.avatar_url : "";

  const initial: PerfilFormInitial = {
    nome: perfil?.nome?.trim() || metaNome.trim(),
    email: user.email ?? perfil?.email ?? "",
    avatarUrl: perfil?.avatar_url?.trim() || metaAvatar.trim(),
    whatsapp: perfil?.whatsapp?.trim() ?? "",
  };

  return (
    <div className="p-4 pb-12 pt-6 md:p-6">
      <PerfilForm userId={user.id} initial={initial} />
    </div>
  );
}
