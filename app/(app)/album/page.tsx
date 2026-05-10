import { redirect } from "next/navigation";

import { AlbumView } from "@/components/album-view";
import { createClient } from "@/lib/supabase/server";
import type { Figurinha } from "@/lib/types";

export default async function AlbumPage({
  searchParams,
}: {
  searchParams: { bulk?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/album");
  }

  const { data: figurinhasRows, error: figurinhasError } = await supabase
    .from("figurinhas")
    .select(
      "id, numero, nome, selecao, selecao_codigo, grupo, tipo, posicao, imagem_url",
    )
    .order("numero", { ascending: true, nullsFirst: false });

  if (figurinhasError) {
    throw new Error(figurinhasError.message);
  }

  const { data: colecaoRows, error: colecaoError } = await supabase
    .from("colecao")
    .select("figurinha_id, quantidade")
    .eq("user_id", user.id);

  if (colecaoError) {
    throw new Error(colecaoError.message);
  }

  const initialQuantities = Object.fromEntries(
    (colecaoRows ?? []).map((r) => [r.figurinha_id, r.quantidade]),
  );

  const figurinhas = (figurinhasRows ?? []) as Figurinha[];

  return (
    <div className="p-4 pb-12 md:p-6">
      <AlbumView
        figurinhas={figurinhas}
        initialQuantities={initialQuantities}
        initialMassDialogOpen={searchParams.bulk === "1"}
      />
    </div>
  );
}
