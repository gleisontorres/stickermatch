import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";

function LoginFallback() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
      <p className="text-muted-foreground text-sm">Carregando…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
