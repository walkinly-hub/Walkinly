import type { ReactNode } from "react";

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-16">
      <p className="text-sm font-semibold">Walkinly · Mino Klamer</p>
      <h1 className="mt-3 break-words text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm">Stand: 20. September 2026 · Angebot für Salons in der Schweiz</p>
      <div className="mt-8 space-y-8 text-base leading-7 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_p+p]:mt-3 [&_a]:underline [&_a]:underline-offset-4 [&_section]:scroll-mt-6">
        {children}
      </div>
    </main>
  );
}
