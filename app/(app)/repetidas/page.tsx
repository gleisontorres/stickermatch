import { redirect } from "next/navigation";

import { ColecaoListClient } from "@/components/colecao-list-client";
import { createClient } from "@/lib/supabase/server";
import type { Figurinha } from "@/lib/types";

const FIGURINHA_SELECT =
  "id, numero, nome, selecao, selecao_codigo, grupo, tipo, posicao, imagem_url";

export default async function RepetidasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/repetidas");
  }

  const { data: colecaoRows, error: colecaoError } = await supabase
    .from("colecao")
    .select("figurinha_id, quantidade")
    .eq("user_id", user.id)
    .gt("quantidade", 1);

  if (colecaoError) {
    throw new Error(colecaoError.message);
  }

  const ids = colecaoRows?.map((r) => r.figurinha_id) ?? [];
  if (ids.length === 0) {
    return (
      <div className="p-4 pb-12 md:p-6">
        <ColecaoListClient variant="repetidas" items={[]} />
      </div>
    );
  }

  const { data: figurinhasRows, error: figurinhasError } = await supabase
    .from("figurinhas")
    .select(FIGURINHA_SELECT)
    .in("id", ids)
    .order("numero", { ascending: true, nullsFirst: false });

  if (figurinhasError) {
    throw new Error(figurinhasError.message);
  }

  const qtyById = new Map(
    (colecaoRows ?? []).map((r) => [r.figurinha_id, r.quantidade]),
  );

  const items = (figurinhasRows ?? []).map((f) => ({
    ...(f as Figurinha),
    quantidade: qtyById.get(f.id)!,
  }));

  return (
    <div className="p-4 pb-12 md:p-6">
      <ColecaoListClient variant="repetidas" items={items} />
    </div>
  );
}
