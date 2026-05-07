import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <h1 className="text-xl font-semibold">Entrar</h1>
      <p className="text-muted-foreground max-w-sm text-center text-sm">
        OAuth com Google será configurado na tarefa 4 (Supabase Auth).
      </p>
      <Button size="lg" disabled>
        Entrar com Google
      </Button>
      <Link href="/" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}
