import { notFound, redirect } from "next/navigation";

import { PerfilPartnerPublicView } from "@/components/perfil-partner-public-view";
import { formatAlbumCompletionPercentDisplay } from "@/lib/album-completion-percent";
import { createClient } from "@/lib/supabase/server";
import { whatsappExternalHref } from "@/lib/whatsapp-external-href";

const UUID_REGEX =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

interface PartnerPublicRpcRow {
  nome: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  created_at: string | null;
  owned_count: number | string | null;
  surplus_copies: number | string | null;
  album_total: number | string | null;
}

function toBigIntish(v: number | string | null | undefined): number {
  if (v === null || v === undefined) {
    return 0;
  }
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatMemberSince(createdAt: string | null): string {
  if (!createdAt) {
    return "Membro desde data não informada";
  }
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) {
    return "Membro desde data não informada";
  }
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(d);
  const year = d.getFullYear();
  return `Membro desde ${month} ${year}`;
}

/**
 * Perfil público de outro colecionador (apenas se existe match mútuo na view `matches`).
 */
export default async function PerfilParceiroPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const partnerId = params.id;

  if (!UUID_REGEX.test(partnerId)) {
    notFound();
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/perfil/${partnerId}`);
  }

  if (user.id === partnerId) {
    redirect("/perfil");
  }

  const { data, error } = await supabase.rpc("partner_public_profile", {
    p_partner_id: partnerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : null) as
    | PartnerPublicRpcRow
    | undefined
    | null;

  if (!row) {
    notFound();
  }

  const ownedCount = toBigIntish(row.owned_count);
  const surplusCopies = toBigIntish(row.surplus_copies);
  const albumTotal = toBigIntish(row.album_total);
  const completionPercentDisplay = formatAlbumCompletionPercentDisplay(
    ownedCount,
    albumTotal,
  );
  const displayName = row.nome?.trim() || "Coletor";
  const waHref = whatsappExternalHref(row.whatsapp);

  return (
    <PerfilPartnerPublicView
      displayName={displayName}
      avatarUrl={row.avatar_url?.trim() || null}
      memberSinceLabel={formatMemberSince(row.created_at)}
      ownedCount={ownedCount}
      albumTotal={albumTotal}
      completionPercentDisplay={completionPercentDisplay}
      surplusCopies={surplusCopies}
      whatsappHref={waHref}
    />
  );
}
