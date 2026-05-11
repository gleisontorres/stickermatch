import { redirect } from "next/navigation";

import { MatchesGroupedList } from "@/components/match-list";
import { fetchMatchPartnerEntries } from "@/lib/fetch-match-partner-entries";
import { createClient } from "@/lib/supabase/server";

export default async function MatchesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/matches");
  }

  const [{ data: meuPerfil }, entries] = await Promise.all([
    supabase
      .from("perfis")
      .select("latitude, longitude")
      .eq("id", user.id)
      .maybeSingle(),
    fetchMatchPartnerEntries(supabase, user.id),
  ]);

  const viewerHasLocation =
    meuPerfil?.latitude != null &&
    meuPerfil?.longitude != null &&
    Number.isFinite(meuPerfil.latitude) &&
    Number.isFinite(meuPerfil.longitude);

  return (
    <div className="p-4 pb-12 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Matches</h1>
          <p className="text-muted-foreground text-sm">
            Quem tem repetida do que você precisa e vice-versa. Trocas mútuas
            aparecem primeiro.
          </p>
        </header>
        <MatchesGroupedList
          entries={entries}
          viewerHasLocation={viewerHasLocation}
        />
      </div>
    </div>
  );
}
