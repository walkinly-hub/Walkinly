import type { ReactNode } from "react";

export default function PrivacyLink({ section, children = "Datenschutzhinweise" }: {
  section?: string;
  children?: ReactNode;
}) {
  return (
    <a href={`/datenschutz${section ? `#${section}` : ""}`} target="_blank" rel="noopener noreferrer"
      className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">
      {children}<span className="sr-only"> (öffnet in einem neuen Tab)</span>
    </a>
  );
}
