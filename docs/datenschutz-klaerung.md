# Datenschutz: bestätigte Antworten und verbleibende Arbeit

Interner Arbeitsstand aus dem Gespräch und der Anbieterrecherche vom
20. September 2026. Nicht als öffentliche Datenschutzerklärung oder fertiger
Vertrag verwenden. Entscheidungen, Umsetzung und rechtliche Prüfung sind
getrennt aufgeführt. Keine weiteren Vertragsfragen stellen, solange es um die
ursprüngliche Datenschutzklärung geht.

## Bestätigt

| Thema | Antwort / Nachweis |
| --- | --- |
| Betreiber | Einzelunternehmen Mino Klamer, Felsenstrasse 6, 5400 Baden, Schweiz |
| Markt | Vorerst Schweiz; noch kein Salon mit echten Kunden im Einsatz |
| Datenschutzkontakt | info@walkinly.ch besteht und wird regelmässig gelesen |
| Domain / Anwendung | Hostpoint / Vercel |
| Vercel-Tarif | Hobby; Betreiber belässt ihn vorerst so. Tarif-/Vertragsfrage bleibt offen |
| Vercel-Functions-Region | Screenshot der Projekteinstellungen: iad1, Washington, D.C., USA; bestehendes Deployment nicht separat geprüft |
| Supabase | Kostenlos; Konto vom Betreiber selbst für Walkinly angelegt |
| Primäre Datenbank | Screenshot: West EU (Ireland), eu-west-1; in öffentlichem Text übernommen |
| Aufrufname | Frei wählbar; kein echter Name erforderlich |
| Daten nach Besuch | Betreiber benötigt danach nur Statistiken ohne Personenbezug |
| Feedback | Kommentare sollen für mehrjährige Qualitätsvergleiche lesbar bleiben |
| Geplante Feedbackfrist | Drei Jahre akzeptiert; anschliessend löschen oder zuverlässig anonymisieren. Noch nicht umgesetzt |
| WhatsApp-Zweck | Ausschliesslich einmalige Erinnerung für den aktuellen Besuch, keine Werbung |
| WhatsApp-Antworten | Können gelesen werden, werden während Salonöffnungszeiten nicht regelmässig überwacht |

## Bewusst zurückgestellt – nicht als umgesetzt oder erledigt behandeln

- Keine 24-Stunden-Frist für vergessene Check-ins beschlossen. Keine automatische
  Löschung einrichten. Die Aussage, nach dem Besuch nur Statistiken zu benötigen,
  legt noch keine ausführbare Löschregel für alle Datenkategorien fest.
- Kein Abmeldebutton und keine automatische STOP-Verarbeitung beauftragt. Der
  Umgang mit Widerrufen bleibt offen; vorherige Zustimmung beseitigt ihn nicht.
- Drei Jahre für Feedback sind ein geplanter Zeitraum für Qualitätsvergleiche,
  keine gesetzliche Frist oder pauschale Erlaubnis, jeden Kommentar so lange
  aufzubewahren. Personenbezug und Erforderlichkeit prüfen. Erst nach Umsetzung
  eine verbindliche Löschzusage veröffentlichen.
- Daten nach Salon-Vertragsende sollen zunächst erhalten bleiben. Dauer, Zweck,
  Weisung des Salons und Vereinbarkeit mit Lösch-/Rückgabepflichten bleiben offen.
  Keine unbegrenzte Aufbewahrung als rechtlich geklärt darstellen.
- Vercel bleibt auf Wunsch Hobby. Kein Tarifwechsel und keine Freigabe der
  geschäftlichen Nutzung oder Bestätigung einer DPA-Abdeckung.

## Recherche: Was öffentlich geklärt werden konnte

### Supabase

Die aktuell abrufbaren [Nutzungsbedingungen](https://supabase.com/terms) nennen
Supabase Pte. Ltd., Singapur, als Vertragspartei und beziehen in Abschnitt 7(b)
das DPA ein. Sie enthalten keine Hobby-artige Beschränkung auf rein private
Nutzung. Die für das konkrete Konto geltende Version ist noch zu dokumentieren;
das blosse Fehlen eines separat unterschriebenen PDFs belegt keine Vertragslücke.

Das [verlinkte DPA](https://supabase.com/legal/customer-resources/data-processing-addendum)
enthält Standardvertragsklauseln und einen Schweizer Zusatz (Abschnitt 12 und
Schedule 2, Abschnitt 3). Dies ist ein Befund zum veröffentlichten Vertrag,
kein Nachweis sämtlicher konkreter Datenflüsse oder Schutzmassnahmen.

Die [Unterauftragnehmerliste vom 1. Juni 2026](https://supabase.com/legal/subprocessor-list/June-1-2026.pdf)
nennt unter anderem AWS für Hosting und Supabase Inc. für Support. Die Liste
ordnet keine vollständigen Bearbeitungsstaaten je Datenfluss zu. Nicht sämtliche
gelisteten Dienste erhalten automatisch Walkinly-Kundendaten; insbesondere
optionale Funktionen nicht ohne Prüfung als eingesetzt darstellen.

Folgerung: Irland ist für die primäre Datenbank belegt. Eine vollständige Liste
der Bearbeitungsstaaten lässt sich daraus nicht ableiten. Anbieterbezogene
Rückfragen sind nötigenfalls vorzubereiten, aber nicht ohne ausdrücklichen
Auftrag abzusenden.

### Vercel

Das [DPA](https://vercel.com/legal/dpa) nennt Pro und Enterprise als seinen
Anwendungsbereich. Aus dem veröffentlichten DPA keine automatische Abdeckung
des bestätigten Hobby-Kontos ableiten. Die
[Hobby-Regeln](https://vercel.com/docs/plans/hobby) beschränken den Tarif auf
nicht kommerzielle persönliche Nutzung. Diese interne offene Frage nicht als
Tarifangabe in die öffentliche Erklärung schreiben.

Die [Dokumentation zur Functions-Region](https://vercel.com/docs/functions/configuring-functions/region)
nennt iad1, USA, als Standard für neue Projekte. Ein Standard ist kein Nachweis
der Walkinly-Konfiguration. Im geprüften Repository ist keine Regionsvorgabe
erkennbar. Der inzwischen vorgelegte Screenshot unter Projekt → Settings → Functions
zeigt iad1. Laut [Regionenliste](https://vercel.com/docs/regions) entspricht dies
Washington, D.C., USA. Damit ist die angezeigte Projekteinstellung bestätigt;
die Region des bestehenden Deployments wurde nicht separat geprüft. Die Oberfläche
weist darauf hin, dass Änderungen erst mit einem neuen Deployment wirksam werden.
Auch eine bestätigte Functions-Region deckt nicht automatisch CDN,
Protokolle, Support und alle Unterauftragnehmer ab.

Das DPA verweist für Unterauftragnehmer auf das
[Trust Center](https://security.vercel.com/). Die Liste konnte über den hier
verwendeten Textabruf nicht vollständig ausgelesen werden. Keine Länder erfinden
und eine pauschale Angabe wie «weltweit» nicht als abgeschlossene Prüfung behandeln.

### WhatsApp / Meta

Die [Business-Bedingungen](https://www.whatsapp.com/legal/business-terms) ordnen
Kunden ihrer definierten European Region WhatsApp Ireland Limited zu.
Die konkrete Kontozuordnung und die anwendbaren Cloud-API-Bedingungen müssen
mit dem Geschäftskonto abgeglichen werden.

Die [Datenverarbeitungsbedingungen](https://www.whatsapp.com/legal/business-data-processing-terms)
sehen Unterauftragnehmer auch ausserhalb des eigenen Landes vor, unter anderem
im EWR und in den USA. Das
[Data Transfer Addendum](https://www.whatsapp.com/legal/business-data-transfer-addendum)
beschreibt Transfermechanismen. Die dortige Nennung des EU-US Data Privacy
Framework darf nicht ohne Prüfung als Nachweis einer passenden Schweizer
Transfergrundlage übernommen werden.

Der aktuelle Walkinly-Code sendet direkt an die Meta Graph API; ein zusätzlicher
Versanddienst wie Twilio ist im Versandpfad nicht erkennbar. Der Webhook liest
Zustellstatus, verarbeitet aber keine eingehenden Abmeldewünsche. Die
[Messaging Policy](https://business.whatsapp.com/policy) verlangt die Beachtung
von Abmeldewünschen innerhalb und ausserhalb von WhatsApp. Der Punkt ist auf
Wunsch des Betreibers zurückgestellt, nicht gelöst.

### Externe Salonlogos

`components/customer/SalonBrand.tsx` verwendet `Image` mit `unoptimized` und
konfigurierbaren URLs. Eine Migration nennt besbarber.com; andere Logos liegen
unter der Walkinly-Domain. Welche URLs produktiv hinterlegt sind, wurde nicht in
Supabase geprüft. Keine Logos verschieben oder externe Dienste verändern, nur um
diesen offenen Punkt ohne Auftrag zu beseitigen.

## Verbleibende Klärung ohne erneute lange Befragung

1. Vercel-Functions-Region: Screenshot bestätigt die Projekteinstellung iad1, USA.
   Keine weitere Ablesung nötig; keine Einstellung geändert.
2. Danach Konto-/Vertragsnachweise für Supabase und das Meta-Geschäftskonto gezielt
   abgleichen. Nur konkret benötigte Angaben erfragen, keine Schlüssel oder Tokens.
3. Tatsächliche weitere Bearbeitungsorte, Logs und Vertragsgrundlagen anhand der
   passenden Anbieterunterlagen vervollständigen. Nicht durch blosses Nutzer-«Ja»
   als geprüft markieren.
4. Löschung, Widerrufe und Aufbewahrung nach Vertragsende bleiben zurückgestellt.
   Nicht erneut nach derselben bereits abgelehnten Implementierung fragen.
5. Salonverantwortliche beim späteren Einrichten des jeweiligen Salons zugänglich
   machen. Keine öffentliche Gesamtliste aller Salons erforderlich.

Die Datenschutzerklärung bleibt bis zur sachlichen Ergänzung und Umsetzung der
erforderlichen Abläufe vorläufig. Eine Frist im Text richtet keinen Löschjob ein.
Es wurden keine Remote-Einstellungen geändert, keine Anbieter kontaktiert und
keine Supabase-Migrationen ausgeführt.

## Separat: Bereits besprochene Eckpunkte eines späteren Salonvertrags

Keine veröffentlichten AGB und noch kein vollständiger Vertrag. Diese Antworten
sind gesichert, damit sie nicht nochmals abgefragt werden müssen:

- Erster Shop nach aktueller Planung dauerhaft kostenlos; ab dem zweiten Shop
  monatliche Bezahlung. Preis offen, im Entwurf Platzhalter verwenden.
- Ein Monat ab individuellem Vertragsstart, nicht Kalendermonat und nicht 30 Tage.
  Beispiel: 12. Mai bis 11. Juni. Monatsend-/Schaltjahrfälle im Entwurf eindeutig
  regeln; bisher nicht gesondert entschieden.
- Monatlich kündbar ohne Mindestlaufzeit. Kündigung per E-Mail an info@walkinly.ch
  bis zum letzten Tag des laufenden Abrechnungszeitraums möglich; sonst Verlängerung
  um einen Monat. Zugang endet direkt mit Wirksamwerden der Kündigung.
- Zahlung per Rechnung, im Voraus, Zahlungsfrist zehn Tage ab Rechnungsdatum.
  Rechnung entsprechend früh versenden; erster Vertragsmonat praktisch noch
  auszugestalten. Keine zusätzliche Frage dazu im Datenschutzgespräch nötig.
- Bei Nichtzahlung Mahnung mit weiteren zehn Tagen ab Zugang; danach kann der
  Zugang vorübergehend gesperrt werden.
- Salon betreut seine Kunden; Walkinly bietet technischen Support per E-Mail an
  info@walkinly.ch ohne garantierte Antwortzeit.
- Ein vertraglicher Datenexport als Produktleistung ist aktuell nicht vorgesehen.
  Gesetzliche Rechte und Pflichten gegenüber dem Salon als Verantwortlichem
  dürfen dadurch nicht ausgeschlossen werden.
- Daten sollen bei Vertragsende zunächst erhalten bleiben. Noch keine Frist und
  keine rechtliche Freigabe für dauerhafte Speicherung; siehe zurückgestellte Punkte.
