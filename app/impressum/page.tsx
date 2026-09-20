import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Impressum | Walkinly",
  robots: { index: false, follow: true },
};

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <section>
        <h2>Anbieter</h2>
        <address className="not-italic">
          Mino Klamer · Einzelunternehmen<br />
          Walkinly<br />
          Felsenstrasse 6<br />
          5400 Baden<br />
          Schweiz
        </address>
        <p>E-Mail: <a href="mailto:info@walkinly.ch">info@walkinly.ch</a></p>
      </section>
      <section>
        <h2>Walkinly und die Salons</h2>
        <p>Walkinly stellt die Software für die Warteschlange und das Feedback bereit.
          Die Salonleistungen werden vom jeweils angezeigten Salon angeboten.
          Fragen zu deinem Besuch richtest du bitte direkt an diesen Salon.</p>
      </section>
      <section>
        <h2>Datenschutz</h2>
        <p>Informationen zur Bearbeitung deiner Daten findest du in unserer <a href="/datenschutz">Datenschutzerklärung</a>.</p>
      </section>
    </LegalPage>
  );
}
