import { redirect } from "next/navigation";

import { ColecaoListClient } from "@/components/colecao-list-client";
import { createClient } from "@/lib/supabase/server";
import type { Figurinha } from "@/lib/types";

const FIGURINHA_SELECT =
  "id, numero, nome, selecao, selecao_codigo, grupo, tipo, posicao, imagem_url";

export default async function FaltasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/faltas");
  }

  const [figRes, colRes] = await Promise.all([
    supabase
      .from("figurinhas")
      .select(FIGURINHA_SELECT)
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

  const qtyMap = new Map(
    (colRes.data ?? []).map((r) => [r.figurinha_id, r.quantidade]),
  );

  const items = (figRes.data ?? [])
    .filter((f) => (qtyMap.get(f.id) ?? 0) === 0)
    .map((f) => ({
      ...(f as Figurinha),
      quantidade: 0,
    }));

  return (
    <div className="p-4 pb-12 md:p-6">
      <ColecaoListClient variant="faltas" items={items} />
    </div>
  );
}
