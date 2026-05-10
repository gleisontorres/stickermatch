import { redirect } from "next/navigation";

import {
  PacoteModeClient,
  type PacoteCatalogRow,
} from "@/components/pacote-mode-client";
import { createClient } from "@/lib/supabase/server";

export default async function PacotePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/pacote");
  }

  const [figRes, colRes] = await Promise.all([
    supabase
      .from("figurinhas")
      .select("id, nome, numero")
      .order("numero", { ascending: true, nullsFirst: false }),
    supabase
      .from("colecao")
      .select("figurinha_id, quantidade")
      .eq("user_id", user.id),
  ]);

  if (figRes.error) {
    throw new Error(figRes.error.message);
  }
  if (colRes.error) {
    throw new Error(colRes.error.message);
  }

  const catalog = (figRes.data ?? []) as PacoteCatalogRow[];
  const initialQuantities = Object.fromEntries(
    (colRes.data ?? []).map((r) => [r.figurinha_id, r.quantidade]),
  );

  return (
    <div className="p-4 pb-12 pt-6 md:p-6">
      <PacoteModeClient
        catalog={catalog}
        initialQuantities={initialQuantities}
      />
    </div>
  );
}
