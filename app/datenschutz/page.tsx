import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Datenschutz | Walkinly",
  description: "Datenschutzhinweise zu Check-in, WhatsApp-Erinnerung und Feedback bei Walkinly.",
  robots: { index: false, follow: true },
};

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <p className="rounded-xl border border-border bg-card p-4 text-sm">
        Fassung mit offenen Angaben: Einzelne Angaben zu den Salons,
        Dienstleistern, Bearbeitungsorten und Aufbewahrungsfristen müssen noch ergänzt werden.
      </p>
      <section id="verantwortliche">
        <h2>1. Verantwortliche und Kontakt</h2>
        <p>Walkinly wird vom Einzelunternehmen Mino Klamer betrieben.
          Adresse: Felsenstrasse 6, 5400 Baden, Schweiz.
          Kontakt für Datenschutzanliegen: <a href="mailto:info@walkinly.ch">info@walkinly.ch</a>.</p>
        <p>Für die Organisation deines Besuchs und die Auswertung deines Feedbacks ist
          der von dir ausgewählte Salon verantwortlich. Walkinly stellt dafür die
          Software bereit und bearbeitet diese Daten im Auftrag des Salons.
          Für die Verwaltung der Walkinly-Geschäftskonten und die Sicherheit des
          eigenen Dienstes ist Mino Klamer verantwortlich.</p>
        <p>[Rechtlichen Betreiber, Adresse und Kontakt der angeschlossenen Salons ergänzen.]
          Über die oben genannte Kontaktadresse kannst du auch eine Zuordnung deines
          Anliegens zum richtigen Salon anfragen.</p>
      </section>
      <section id="checkin">
        <h2>2. Frei gewählter Name und Warteschlange</h2>
        <p>Du brauchst kein Kundenkonto und musst deinen echten Namen nicht angeben.
          Ein beliebiger Aufrufname oder Spitzname genügt. Wir speichern diesen Namen,
          den Salon, den Check-in-Zeitpunkt, deine Warteschlangenposition und den
          Bearbeitungsstatus sowie eine technische Kennung und einen Zugangsschlüssel.</p>
        <p>Diese Angaben dienen dazu, deinen Platz zu verwalten, die geschätzte
          Wartezeit anzuzeigen und dich aufzurufen. Berechtigtes Salonpersonal kann
          die Warteschlange verwalten; berechtigte Plattformadministratoren können
          auf die Salonverwaltung zugreifen. Bei einem mündlichen Aufruf können
          andere anwesende Personen deinen gewählten Namen hören.</p>
        <p>Öffentliche Warteschlangenübersichten zeigen zusammengefasste Angaben,
          keine Liste der Kundennamen. Für den Salon werden aus den Besuchseinträgen
          Kennzahlen wie Check-in-Anzahlen und deren Verteilung über Zeiträume
          berechnet. Die zusammengefasste Anzeige bedeutet nicht, dass die
          zugrunde liegenden Einträge bereits anonymisiert sind. Auch ein Spitzname
          kann zusammen mit weiteren Angaben einen Personenbezug ermöglichen.</p>
      </section>
      <section id="whatsapp">
        <h2>3. Freiwillige WhatsApp-Erinnerung</h2>
        <p>Wenn du die angebotene Option aktiv auswählst, sendet Walkinly für den
          ausgewählten Salon einmal eine WhatsApp-Erinnerung, sobald du bei diesem
          Besuch als Nächstes an der Reihe bist. Ohne WhatsApp kannst du ebenfalls
          einchecken. Die Zustimmung umfasst keine Werbung.</p>
        <p>Dafür speichern wir deine Mobilnummer, den Zeitpunkt und die Version
          deiner Zustimmung sowie technische Versandangaben. Zur Zustellung werden
          deine Mobilnummer, dein gewählter Aufrufname und der Salonname an die
          WhatsApp Business Platform von Meta übermittelt. Dabei fallen auch
          Kommunikations- und Zustelldaten an. Für die eigene Bearbeitung durch
          WhatsApp gelten dessen <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Datenschutzbestimmungen (neuer Tab)</a>.
          Informationen zur Bearbeitung im Ausland findest du in Abschnitt 6.</p>
        <p>Du kannst deine Zustimmung für künftige Sendungen über <a href="mailto:info@walkinly.ch?subject=Widerruf%20WhatsApp-Erinnerung">info@walkinly.ch</a> widerrufen.
          Bitte nenne den Salon und die betroffene Mobilnummer, damit wir deine
          Anfrage zuordnen können. Bereits versandte oder an WhatsApp übergebene
          Nachrichten können nicht zurückgeholt werden. Die Zulässigkeit der
          Bearbeitung vor dem Widerruf bleibt unberührt.</p>
      </section>
      <section id="feedback">
        <h2>4. Freiwilliges Feedback</h2>
        <p>Wir speichern deine Sternebewertung, deinen optionalen Kommentar, den
          Salon, den Zeitpunkt und eine technische Übermittlungskennung. Das
          Formular fragt weder Namen noch Kontaktdaten ab und verknüpft dein
          Feedback nicht ausdrücklich mit dem Warteschlangeneintrag. Es dient
          der internen Auswertung durch den Salon und wird in Walkinly nicht
          öffentlich angezeigt.</p>
        <p>Bitte erwähne im Kommentar keine persönlichen Angaben über dich oder
          andere Personen, insbesondere keine Gesundheitsdaten. Der Kommentar
          und technische Zugriffsprotokolle können dennoch einen Personenbezug
          ermöglichen.</p>
      </section>
      <section id="browser">
        <h2>5. Browserdaten, technische Daten und Salon-Login</h2>
        <p>Wir speichern die Kennung und den Zugangsschlüssel deines Check-ins im
          lokalen Speicher deines Browsers, damit du deinen Platz nach einem
          Neuladen wieder anzeigen kannst. Die Anwendung entfernt diese Angaben,
          wenn sie einen erledigten oder entfernten Eintrag erkennt oder du die
          Warteschlange über die Anwendung erfolgreich verlässt. Bei geschlossener
          Seite können sie bis zum erneuten Aufruf oder bis zur Löschung deiner
          Websitedaten gespeichert bleiben. Das Löschen im Browser löscht nicht
          automatisch den Datenbankeintrag und kann deinen Zugang zum Platz aufheben.</p>
        <p>Beim Salon-Login werden E-Mail-Adresse, Benutzerkennung, Berechtigungen
          und Sitzungsinformationen verarbeitet. Die Anmeldung bleibt über den
          lokalen Browserspeicher erhalten. Bestimmte Bedienaktionen werden mit
          Benutzerkennung, Zeitpunkt und Salon- oder Besuchsbezug protokolliert,
          unter anderem für die Rückgängig-Funktion.</p>
        <p>Beim Abruf der Anwendung erhalten beteiligte Server Verbindungsdaten
          wie deine IP-Adresse. Je nach Dienst können zudem Zeitpunkt, angefragte
          Adresse, Browserinformationen und Fehlerangaben protokolliert werden.
          Die Anwendung enthält keine eingebauten Werbepixel. Die beschriebenen
          lokalen Speicherungen dienen der Warteschlange und der Anmeldung.</p>
        <p>Salons können Logos von externen Websites laden lassen. Beim Abruf
          erhält deren Betreiber unter anderem deine IP-Adresse.
          [Tatsächlich verwendete externe Logoanbieter und Bearbeitungsstaaten ergänzen.]
          Wird Walkinly auf einer Salonwebsite eingebettet, gelten für deren
          eigene Datenbearbeitung zusätzlich die dortigen Datenschutzhinweise.</p>
      </section>
      <section id="dienstleister">
        <h2>6. Dienstleister und Bearbeitung im Ausland</h2>
        <p>Für die Domain wird Hostpoint AG, Rapperswil, Schweiz, eingesetzt.
          Informationen des Anbieters: <a href="https://www.hostpoint.ch/hostpoint/kontakt-agb.html" target="_blank" rel="noopener noreferrer">Hostpoint Datenschutz (neuer Tab)</a>.
          </p>
        <p>Die Walkinly-Anwendung wird bei Vercel Inc., USA, betrieben. Vercel
          verarbeitet die für Auslieferung, Betrieb und Absicherung der Anwendung
          erforderlichen Verbindungs- und Nutzungsdaten. Informationen des Anbieters:
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Datenschutz (neuer Tab)</a>.
          [Tatsächliche Bearbeitungsstaaten, einschliesslich Unterauftragnehmer,
          entsprechend der Projektkonfiguration ergänzen.]</p>
        <p>Für die Datenbank und die Anmeldung verwenden wir Supabase.
          [Vertragsgesellschaft, gewählte Datenbankregion und tatsächliche
          Bearbeitungsstaaten einschliesslich Unterauftragnehmer ergänzen.]</p>
        <p>Für die freiwilligen Erinnerungen verwenden wir WhatsApp/Meta.
          [Vertragsgesellschaft und tatsächliche Bearbeitungsstaaten ergänzen.]
          Die Nutzung eines Schweizer Domainanbieters bedeutet daher nicht,
          dass sämtliche Daten ausschliesslich in der Schweiz verarbeitet werden.</p>
        <p>[Für Auslandübermittlungen die tatsächlich geltenden Schutzgarantien
          ergänzen, soweit der Empfängerstaat keinen angemessenen Datenschutz
          bietet. Die vorhandenen Vertragsgrundlagen und Unterauftragnehmer sind
          hierfür noch zu prüfen.]</p>
      </section>
      <section id="speicherdauer">
        <h2>7. Aufbewahrung und Löschung</h2>
        <p>Das Beenden oder Verlassen der Warteschlange löscht nicht automatisch
          sämtliche Besuchs- und Kontaktdaten. Eine automatische Löschung nach
          einer festen Frist ist derzeit nicht vorgesehen. Die Anzeige von
          Statistiken ersetzt keine Löschung oder Anonymisierung der Einträge.</p>
        <p>[Aufbewahrungsfristen beziehungsweise Kriterien für Besuchseinträge,
          Telefonnummern, Zustimmungsnachweise, Versanddaten, Feedback,
          Geschäftskonten, Bedienprotokolle, technische Logs und Backups
          festlegen und entsprechend umsetzen.]</p>
        <p>Für ein Löschungsanliegen kannst du dich an <a href="mailto:info@walkinly.ch">info@walkinly.ch</a> wenden.</p>
      </section>
      <section id="rechte">
        <h2>8. Deine Rechte</h2>
        <p>Im Rahmen des anwendbaren Datenschutzrechts kannst du Auskunft über
          die Bearbeitung deiner Personendaten und die Berichtigung unrichtiger
          Angaben verlangen. Soweit die gesetzlichen Voraussetzungen vorliegen,
          kannst du die Löschung oder Herausgabe beziehungsweise Übertragung
          deiner Daten verlangen und einer Bearbeitung widersprechen. Eine
          erteilte Zustimmung kannst du für die Zukunft widerrufen.</p>
        <p>Wende dich an <a href="mailto:info@walkinly.ch">info@walkinly.ch</a> oder den
          betroffenen Salon. Nenne nur Angaben, die zur Zuordnung nötig sind,
          etwa Salon und Besuchszeitpunkt. Sende keine Zugangsschlüssel oder
          Passwörter. Zum Schutz vor der Offenlegung fremder Daten können
          angemessene Angaben zur Prüfung deiner Berechtigung erforderlich sein.</p>
        <p>Bei Datenschutzbedenken kannst du dich auch an den <a href="https://www.edoeb.admin.ch/" target="_blank" rel="noopener noreferrer">Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (neuer Tab)</a> wenden.</p>
      </section>
    </LegalPage>
  );
}
