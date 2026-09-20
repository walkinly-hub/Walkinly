import PrivacyLink from "./PrivacyLink";

export default function LegalFooter() {
  return (
    <footer className="border-t border-border bg-background px-4 py-4 text-center text-xs text-foreground">
      <nav aria-label="Rechtliche Informationen" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        <PrivacyLink />
        <a href="/impressum" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
          Impressum<span className="sr-only"> (öffnet in einem neuen Tab)</span>
        </a>
      </nav>
    </footer>
  );
}
