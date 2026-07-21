type QueueOverviewProps = {
  salonName: string;
  waitingCount: number;
  estimatedWaitMinutes: number;
  onStartCheckIn: () => void;
};

export default function QueueOverview({
  salonName,
  waitingCount,
  estimatedWaitMinutes,
  onStartCheckIn,
}: QueueOverviewProps) {

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">

        <p className="text-sm font-medium text-primary">
          Walkinly
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Willkommen bei {salonName}
        </h1>

        <p className="mt-3 text-zinc-500">
          Momentan warten
        </p>

        <p className="mt-2 text-5xl font-bold text-foreground">
          {waitingCount}
        </p>

        <p className="mt-4 text-zinc-500">
          Geschätzte Wartezeit
        </p>

        <p className="mt-2 text-2xl font-semibold text-foreground">
          ca. {estimatedWaitMinutes} Minuten
        </p>

        <button
          onClick={onStartCheckIn}
          className="mt-8 w-full rounded-2xl bg-primary py-4 text-lg font-semibold text-white hover:opacity-90 transition"
        >
          Jetzt einchecken
        </button>

      </div>
    </main>
  );
}
