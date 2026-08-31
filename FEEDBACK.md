# Feedbackformular

Separater Branch: `codex/feedback-form`. Keine Änderungen an Check-in,
WhatsApp, gemeinsamen Komponenten oder bestehender Dashboard-Logik.

Die bestehende Route `/feedback/[location]` zeigt das Formular im jeweiligen
Salon-Design: Bewertung 1–5, optionaler Kommentar (maximal 2000 Zeichen),
Ladezustand, Fehlermeldung mit erhaltenen Eingaben und Speicherbestätigung.
Es werden keine Namen, Kontaktdaten oder Check-in-Tokens gespeichert.

## Inbetriebnahme

1. `supabase/migrations/20260831010000_add_salon_feedback.sql` in Supabase
   anwenden, bevor das Formular veröffentlicht wird.
2. Den Branch gezielt zusammenführen und deployen. Keine Änderungen aus
   anderen Worktrees pauschal committen.
3. Unter `/feedback/besbarber` und `/feedback/ambiente` testen; den tatsächlichen
   Salon-Slug der jeweiligen Umgebung verwenden.

Feedback liegt in `public.salon_feedback`. Berechtigte Salonmitarbeiter können
via RLS nur Feedback ihres Salons lesen; öffentliche Clients können nichts
lesen, ändern oder löschen. Betreiber können die Einträge im Supabase Table
Editor einsehen. Eine Dashboard-Auswertung gehört noch nicht zu dieser Version.

## Prüfungen mit Testdatenbank

- Bewertungen 1 und 5 mit und ohne Kommentar speichern.
- Null, 0, 6, unbekannten Salon und Kommentare über 2000 Zeichen per RPC
  ablehnen lassen; die Prüfung gilt auch ohne Browser-Validierung.
- Dieselbe Übermittlungs-UUID erneut senden: Es darf nur eine Zeile entstehen.
- Als `anon` Feedback lesen: kein Zugriff. Als Salonmitarbeiter nur eigene
  Salon-Zeilen lesen; fremde Salon-Zeilen dürfen nicht sichtbar sein.
- Netzwerk trennen: Fehlermeldung, erhaltene Eingaben, erneutes Senden möglich.
- Mit Tastatur Radio-Gruppe bedienen und bei 320px Breite prüfen.

Das öffentliche Formular bestätigt keinen tatsächlichen Salonbesuch. Der
Duplikatschutz gilt für Wiederholungen innerhalb des geöffneten Formulars,
nicht als Schutz gegen automatisierten Spam. Vor grösserer öffentlicher
Verbreitung sollte serverseitiger Missbrauchsschutz ergänzt werden.
