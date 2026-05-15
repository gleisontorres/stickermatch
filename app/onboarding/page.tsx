import { redirect } from "next/navigation";

import { OnboardingForm } from "./onboarding-form";
import { createClient } from "@/lib/supabase/server";

/**
 * Onboarding obrigatório: WhatsApp ausente no perfil (middleware redireciona até concluir).
 */
export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.whatsapp?.trim()) {
    redirect("/dashboard");
  }

  return <OnboardingForm initialEmail={user.email ?? ""} />;
}
