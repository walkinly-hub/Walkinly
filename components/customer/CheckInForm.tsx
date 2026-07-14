type CheckInFormProps = {
  onCheckIn: () => void;
};

export default function CheckInForm({ onCheckIn }: CheckInFormProps) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-sm">

        <p className="text-sm font-medium text-primary">
          Walkinly
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Jetzt einchecken
        </h1>

        <p className="mt-3 text-zinc-500">
          Gib deinen Vornamen ein.
        </p>

        <input
          type="text"
          placeholder="Vorname"
          className="mt-6 w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:border-primary"
        />

        <button
          onClick={onCheckIn}
          className="mt-4 w-full rounded-2xl bg-primary py-4 text-lg font-semibold text-white hover:opacity-90 transition"
        >
          Einchecken
        </button>

      </div>
    </main>
  );
}