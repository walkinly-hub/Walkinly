import SalonBrand from "./SalonBrand";

type QueueStatusProps = {
  salonName: string;
  logoUrl?: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
};

export default function QueueStatus({
  salonName,
  logoUrl,
  queuePosition,
  estimatedWaitMinutes,
}: QueueStatusProps) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">

        <SalonBrand salonName={salonName} logoUrl={logoUrl} />

        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Du bist eingecheckt!
        </h1>

        <p className="mt-6 text-[var(--muted-foreground)]">
          Deine Position
        </p>

        <p className="mt-2 text-5xl font-bold">
          #{queuePosition}
        </p>

        <p className="mt-6 text-[var(--muted-foreground)]">
          Geschätzte Wartezeit
        </p>

        <p className="mt-2 text-2xl font-semibold">
          ca. {estimatedWaitMinutes} Minuten
        </p>

      </div>
    </main>
  );
}
