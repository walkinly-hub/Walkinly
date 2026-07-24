import Image from "next/image";

type SalonBrandProps = {
  salonName: string;
  logoUrl?: string;
};

export default function SalonBrand({ salonName, logoUrl }: SalonBrandProps) {
  if (!logoUrl) {
    return <p className="text-sm font-semibold text-primary">{salonName}</p>;
  }

  return (
    <Image
      src={logoUrl}
      alt={`${salonName} Logo`}
      width={180}
      height={48}
      priority
      className="h-10 w-auto object-contain object-left"
    />
  );
}
