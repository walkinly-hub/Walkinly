# Datenschutztexte – Stand 20. September 2026

## Eingebaut

- `/datenschutz`: Informationen zu frei gewähltem Aufrufnamen, Warteschlange,
  WhatsApp, Feedback, Browserspeicher, Personal-Login, Dienstleistern und Rechten.
- `/impressum`: Einzelunternehmen Mino Klamer, Felsenstrasse 6, 5400 Baden, Schweiz.
- Direkte Links vor dem Absenden von Check-in, Feedback und Login; zusätzlicher
  globaler Footer auch auf Status-, Abschluss- und Widgetseiten. Neue Tabs
  verhindern den Verlust von Formulareingaben und das Öffnen im kleinen Iframe.
- Freiwillige WhatsApp-Checkbox; kein Pflichtkästchen für die Datenschutzerklärung.
- Domain: Hostpoint; Anwendung: Vercel; Datenbank/Authentifizierung: Supabase.
  Markt: vorerst Schweiz. Diese Aufteilung wurde vom Betreiber bestätigt.

Die Seiten sind wegen offener Angaben vorläufig mit `noindex` versehen. Das ist
keine Zugriffssperre: Die Routen sind nach Deployment öffentlich erreichbar.
Die Datenschutzerklärung kennzeichnet ihre offenen Angaben ausdrücklich.

## Angaben vor einer vollständigen Veröffentlichung ergänzen

1. Erledigt: Postadresse von Mino Klamer in beiden Rechtsseiten eingetragen
   (Felsenstrasse 6, 5400 Baden, Schweiz).
2. Rechtlichen Betreiber, Adresse und Datenschutzkontakt jedes Salons ergänzen;
   der angezeigte Salon-Markenname allein reicht dafür nicht sicher aus.
3. `info@walkinly.ch` ist die bereits im Projekt verwendete Kontaktadresse.
   Sicherstellen, dass Datenschutzanfragen und WhatsApp-Widerrufe dort bearbeitet
   werden. Der Webhook verarbeitet keine STOP-Nachrichten. Ein automatischer
   Widerruf unter Beibehaltung des Warteschlangenplatzes wurde nicht hinzugefügt.
   Abmeldung muss auch bei direkt an WhatsApp gerichteten Anfragen beachtet werden.
4. Supabase-Vertragsgesellschaft und Projektregion, Vercel-Bearbeitungsorte,
   WhatsApp-Vertragsgesellschaft, alle relevanten Empfängerstaaten und tatsächlich
   geltenden Transfergarantien prüfen und konkret eintragen. Nicht einfach
   "EU" oder "weltweit" einsetzen. Region, Logs, Support und Unterauftragnehmer
   berücksichtigen. Verträge wurden nicht in den Anbieteraccounts geprüft.
5. Auftragsbearbeitung zwischen Salon und Walkinly vereinbaren sowie
   Unterauftragnehmer freigeben. Vercel-Vertragsdeckung passend zum tatsächlich
   verwendeten Tarif prüfen; die am 20.09.2026 gelesene DPA nennt Pro/Enterprise.
6. Lösch-/Anonymisierungsfristen für Besuchseinträge, Nummern, Zustimmung,
   Versanddaten, Feedback, Personal, Bedienaktionen, Logs und Backups festlegen
   und tatsächlich umsetzen. Die neue Erklärung verspricht keine vorhandene
   automatische Löschung. Nur Browserdaten zu löschen genügt nicht.
7. Externe Logos prüfen: `SalonBrand` lädt konfigurierte Bild-URLs direkt;
   eine vorhandene Migration nennt `besbarber.com`. Anbieter und Staaten
   ergänzen oder in einer getrennten Änderung tatsächlich lokal bereitstellen.
8. Nach Ergänzung der Angaben Entwurfskennzeichnung und `noindex` entfernen.

## Manueller Supabase-Schritt für den Zustimmungsnachweis

Der erweiterte WhatsApp-Text hat die Version `2026-09-20`. Bisher fügt die
Check-in-RPC keinen expliziten Versionswert ein; die Datenbank verwendet den
Spaltenstandard. Deshalb ist die separate Migration erforderlich:

`supabase/migrations/20260920000000_update_whatsapp_consent_version.sql`

Sie ändert ausschliesslich die Vorgabe für NEUE Zustimmungen. Bestehende Nummern,
Zeitpunkte und Zustimmungsnachweise werden nicht geändert. Die Migration führt
weder eine Löschung noch einen neuen Versand ein.

Die Ausführung erfolgt durch den Betreiber im Supabase SQL Editor. Während der
Umstellung neue WhatsApp-Anmeldungen pausieren (die Salonfreigabe für WhatsApp
vorübergehend deaktivieren). Dann neue Anwendung veröffentlichen und die Migration
ausführen. Erst bei passender Anwendung und Datenbank neue Anmeldungen zulassen;
bereits geöffnete alte Check-in-Seiten müssen neu geladen werden. Andernfalls
können Textanzeige und gespeicherte Versionsnummer auseinanderfallen. Eine
technisch erzwungene Version pro Formularübermittlung wäre eine weitergehende
RPC-Änderung; sie ist nicht Teil dieser Textänderung.

Wenn bereits neue Anmeldungen während einer gemischten Version eingegangen sind,
diese nicht pauschal rückwirkend umetikettieren. Zeitraum und tatsächlich
angezeigten Text gesondert dokumentieren.

### Archiv des Textes für Version 2026-09-20

Checkbox (Salonname wird dynamisch eingesetzt):

> Ich möchte für diesen Besuch einmal von Walkinly für {salonName} per WhatsApp
> benachrichtigt werden, sobald ich als Nächstes an der Reihe bin.

Begleittext:

> Dafür werden deine Mobilnummer, dein gewählter Aufrufname und der Salonname an
> WhatsApp/Meta übermittelt. Die Auswahl ist freiwillig und umfasst keine Werbung.
> Datenschutz und Widerruf.

Linkziel: `/datenschutz#whatsapp`. Ändert sich die Information inhaltlich,
Text und tatsächlich verwendete Version erneut aufeinander abstimmen.

## Quellen der Redaktion

Am 20.09.2026 geprüft:

- [EDÖB: Informationspflicht](https://www.edoeb.admin.ch/de/informationspflicht)
- [EDÖB: Auftragsdatenbearbeitung](https://www.edoeb.admin.ch/de/outsourcing-auftragsdatenbearbeitung)
- [WhatsApp Business Messaging Policy](https://business.whatsapp.com/policy)
- [Hostpoint: Kontakt und Datenschutz](https://www.hostpoint.ch/hostpoint/kontakt-agb.html)
- [Vercel DPA](https://vercel.com/legal/dpa)
- [Supabase DPA](https://supabase.com/downloads/docs/Supabase%2BDPA%2B260317.pdf)

Keine automatische Behauptung, dass diese Anbieterunterlagen in den konkreten
Kundenkonten vereinbart wurden. AGB für Software-Abonnements benötigen separate
Angaben zu Leistungen, Preisen, Laufzeit und Kündigung und sind nicht Teil dieses
Datenschutzauftrags.
