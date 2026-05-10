import { redirect } from "next/navigation";

import { DashboardView } from "@/components/dashboard-view";
import { ALBUM_TOTAL_FIGURINHAS } from "@/lib/album-constants";
import {
  albumCompletionBarPercent,
  formatAlbumCompletionPercentDisplay,
} from "@/lib/album-completion-percent";
import { computeColecaoAggregates } from "@/lib/colecao-stats";
import { fetchMatchPartnerEntries } from "@/lib/fetch-match-partner-entries";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const uid = user.id;

  const [figRes, colRes, partnerEntries] = await Promise.all([
    supabase.from("figurinhas").select("id"),
    supabase
      .from("colecao")
      .select("figurinha_id, quantidade")
      .eq("user_id", uid),
    fetchMatchPartnerEntries(supabase, uid),
  ]);

  if (figRes.error) {
    throw new Error(figRes.error.message);
  }
  if (colRes.error) {
    throw new Error(colRes.error.message);
  }

  const catalogIds = (figRes.data ?? []).map((r) => r.id);
  const qtyByFigurinhaId = new Map(
    (colRes.data ?? []).map((r) => [r.figurinha_id, r.quantidade]),
  );

  const aggregates = computeColecaoAggregates(catalogIds, qtyByFigurinhaId);

  const denom = Math.max(ALBUM_TOTAL_FIGURINHAS, catalogIds.length);
  const completionPercentDisplay = formatAlbumCompletionPercentDisplay(
    aggregates.ownedCount,
    denom,
  );
  const completionBarPercent = albumCompletionBarPercent(
    aggregates.ownedCount,
    denom,
  );
  const albumComplete = denom > 0 && aggregates.ownedCount >= denom;

  const topMatches = partnerEntries.slice(0, 5);

  return (
    <div className="p-4 pt-6 md:p-6">
      <DashboardView
        completionPercentDisplay={completionPercentDisplay}
        completionBarPercent={completionBarPercent}
        albumComplete={albumComplete}
        ownedCount={aggregates.ownedCount}
        albumTotal={denom}
        surplusCopies={aggregates.surplusCopies}
        repetidasTypes={aggregates.repetidasTypes}
        faltasCount={aggregates.faltasCount}
        matchPartnersCount={partnerEntries.length}
        topMatches={topMatches}
        showMatchesOnboardingTip={(colRes.data ?? []).length < 50}
      />
    </div>
  );
}
