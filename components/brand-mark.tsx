import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("brand-lockup", compact && "is-compact", className)} aria-label="oHRiise">
      <Image
        className={cn("official-logo", compact && "compact-brand-icon")}
        src={compact ? "/assets/brand/ohriise-icon.png" : "/brand/ohriise-logo.png"}
        alt="oHRiise"
        width={compact ? 44 : 180}
        height={compact ? 44 : 120}
        priority
        unoptimized={compact}
      />
    </div>
  );
}
