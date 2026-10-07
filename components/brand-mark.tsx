import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("brand-lockup", compact && "is-compact", className)} aria-label="oHRiise">
      <Image
        className="official-logo"
        src="/brand/ohriise-logo.png"
        alt="oHRiise"
        width={180}
        height={120}
        priority
      />
    </div>
  );
}
