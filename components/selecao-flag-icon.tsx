import { flagIconSrcForSelecaoCodigo } from "@/lib/album/copa-groups";
import { cn } from "@/lib/utils";

interface SelecaoFlagIconProps {
  selecaoCodigo: string | null | undefined;
  title?: string;
  className?: string;
}

/**
 * Bandeira da seleção via SVG (flag-icons), mesma abordagem do cabeçalho do Álbum.
 * Evita emoji de bandeira (ex.: Escócia/SCO não renderiza bem no Windows).
 */
export function SelecaoFlagIcon({
  selecaoCodigo,
  title,
  className,
}: SelecaoFlagIconProps) {
  const src = flagIconSrcForSelecaoCodigo(selecaoCodigo);
  if (!src) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- asset externo versionado no jsDelivr
    <img
      src={src}
      alt=""
      title={title}
      width={28}
      height={21}
      loading="lazy"
      decoding="async"
      className={cn(
        "inline-block h-[1.125rem] w-auto shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10 dark:ring-white/15",
        className,
      )}
    />
  );
}
