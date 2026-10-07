import Image from "next/image";

export function BrandPageDivider() {
  return (
    <div className="brand-page-divider">
      <span className="brand-divider-lead" />
      <span className="brand-divider-tab">
        <Image
          src="/ohriise-wordmark@full.png"
          alt="oHRiise"
          width={180}
          height={48}
          unoptimized
        />
      </span>
      <span className="brand-divider-line" />
      <span className="brand-divider-arrow" />
    </div>
  );
}
