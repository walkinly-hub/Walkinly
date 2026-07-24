type SalonBrandProps = {
  salonName: string;
  logoUrl?: string;
  logoInverted: boolean;
};

export default function SalonBrand({
  salonName,
  logoUrl,
  logoInverted,
}: SalonBrandProps) {
  if (!logoUrl) {
    return <p className="text-sm font-semibold text-primary">{salonName}</p>;
  }

  return (
    <div className="flex items-center gap-3" style={{ color: "var(--foreground)" }}>
      {/* The salon controls whether its uploaded logo needs a light treatment. */}
      <Image
        src={logoUrl}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="h-10 w-10 object-contain"
        style={{ filter: logoInverted ? "invert(1) brightness(2)" : undefined }}
      />
      <span className="font-serif text-2xl font-bold tracking-wide uppercase">
        {salonName}
      </span>
    </div>
  );
}
import Image from "next/image";
