export default function QueueStatus() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">

        <p className="text-sm font-medium text-primary">
          Walkinly
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Du bist eingecheckt!
        </h1>

        <p className="mt-6 text-zinc-500">
          Deine Position
        </p>

        <p className="mt-2 text-5xl font-bold">
          #4
        </p>

        <p className="mt-6 text-zinc-500">
          Geschätzte Wartezeit
        </p>

        <p className="mt-2 text-2xl font-semibold">
          ca. 25 Minuten
        </p>

      </div>
    </main>
  );
}