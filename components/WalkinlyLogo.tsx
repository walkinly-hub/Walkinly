import Image from "next/image";

type WalkinlyLogoProps = {
  className?: string;
  priority?: boolean;
};

export default function WalkinlyLogo({
  className = "h-auto w-40",
  priority = false,
}: WalkinlyLogoProps) {
  return (
    <Image
      src="/walkinly-logo-transparent.png"
      alt="Walkinly"
      width={1774}
      height={887}
      priority={priority}
      className={className}
    />
  );
}
