# Automatische Erinnerung bei Position 1 – manuelle Aktivierung

Der Code allein aktiviert keine Nachrichten. Die folgenden Schritte vollständig
und in dieser Reihenfolge durchführen. Keine bestehenden Schlüssel ersetzen.

## 1. Supabase-Migration

Im richtigen Supabase-Projekt unter **SQL Editor → New query** den gesamten Inhalt
von `supabase/migrations/20260904010000_add_whatsapp_reminder_outbox.sql` einfügen
und einmal ausführen. Voraussetzung sind alle bisherigen Walkinly-Migrationen.
Die Migration verändert weder Warteschlangenpositionen noch bestehende Check-ins.
Sie aktiviert WhatsApp auch nicht für zusätzliche Salons.

## 2. Vercel-Konfiguration und Deployment

Unter **Walkinly → Settings → Environment Variables → Project → Production**:

- `WHATSAPP_DISPATCH_SECRET`: neues zufälliges Passwort mit mindestens 32 Zeichen
  aus dem Passwortmanager. Als Sensitive speichern. NICHT den Meta Verify Token,
  Access Token oder Supabase Service Role Key verwenden.
- `WHATSAPP_AUTOMATION_ENABLED`: `true`.

Die bisherigen fünf WhatsApp-Variablen und Supabase-Variablen unverändert lassen.
Danach das aktuelle Production-Deployment mit dem neuen Code **Redeploy** ausführen
und **Ready** abwarten. Vor Abschluss von Schritt 3 noch keine Test-Check-ins machen.

## 3. Supabase Database Webhook

Unter **Database → Webhooks → Create webhook** einen Webhook anlegen:

- Name: `whatsapp_position_one`
- Schema / Tabelle: **public / whatsapp_reminders**
- Ereignis: nur **INSERT** (nicht UPDATE oder DELETE)
- Typ: HTTP Request
- Methode: POST
- URL: `https://<aktive-produktionsdomain>/api/whatsapp/reminder`
- Header `Content-Type`: `application/json`
- Header `Authorization`: `Bearer DEIN_DISPATCH_SECRET`
  (nach `Bearer` ein Leerzeichen, danach der exakte Wert aus Vercel).
- Timeout, falls einstellbar: **20000 ms**.

Speichern. Der Webhook übermittelt keine Telefonnummern oder Namen; der Server
liest die Daten erst nach Authentifizierung und Prüfung aus Supabase.
Dies ist ein ZUSÄTZLICHER Webhook. Den bestehenden Meta-Webhook
`/api/whatsapp/webhook` und sein `messages`-Abonnement nicht ändern.

## 4. Kontrollierter Test

In einem freigegebenen Testszenario die eigene private WhatsApp-Nummer nutzen,
keine fremden Kunden als Testempfänger. Der Salon muss bereits
`whatsapp_notifications_enabled = true` haben und der Check-in muss ausdrücklich
WhatsApp auswählen. Wenn diese Option fehlt, den Salon nicht ungeprüft aktivieren.

1. Zwei Testkunden einreihen: zuerst ohne WhatsApp, danach den eigenen Testkunden
   mit Zustimmung und eigener Nummer. Erwartung: auf Position 2 keine Nachricht.
2. Ersten Kunden bedienen oder aus der Warteschlange entfernen.
3. Der Testkunde rückt auf Position 1: genau ein Sendeversuch mit dem eingegebenen
   Namen und dem echten Salonnamen. Browser des Kunden darf geschlossen sein.
4. Dashboard neu laden: keine zweite Nachricht.
5. Optional in einer leeren Warteschlange direkt mit WhatsApp einchecken: auch
   das löst eine Erinnerung aus, weil die Position schon beim Eintritt 1 ist.

Es geht um Position 1 der WARTENDEN, nicht darum, ob der Stuhl schon frei ist.
Die App sendet nur bei Salon-Freigabe und gespeicherter Zustimmung.

## Kontrolle und Grenzen

In Supabase zeigt `whatsapp_reminders` pro Check-in den Bearbeitungsstand:
`pending`, `sending`, `accepted`, `failed` oder `skipped`.
`accepted` ist keine Zustellbestätigung. Über die gespeicherte `reference` lassen
sich `whatsapp_delivery`-Einträge in den Vercel-Logs zuordnen.

- Bereits vor der Aktivierung wartende Kunden werden nicht nachträglich erfasst.
- Bei Verarbeitung werden Position, Status, Salon-Freigabe und Zustimmung erneut
  geprüft. Aufträge älter als fünf Minuten werden übersprungen.
- Doppelte oder parallele Webhooks können keinen zweiten Sendeversuch auslösen.
- Nach Timeout/Fehler wird NICHT automatisch erneut gesendet: Meta könnte den
  Auftrag trotzdem angenommen haben. Auch ein Prozessabbruch bei `sending` erfordert
  manuelle Prüfung. Nicht einfach den Zustand auf `pending` zurücksetzen.
- Fällt der Supabase-HTTP-Webhook vor Erreichen der App aus, kann ein Auftrag auf
  `pending` bleiben. Es gibt keinen zusätzlichen periodischen Wiederholungsdienst.
  Die Supabase-Webhook-Logs und ausstehende Aufträge bei Störungen prüfen.
- Zwischen abschliessender DB-Prüfung und Meta-Zustellung kann sich die Position
  ändern. Exakte Echtzeit-Zustellung kann WhatsApp nicht garantieren.

Zum Stoppen `WHATSAPP_AUTOMATION_ENABLED=false` setzen und neu deployen; alternativ
den Supabase-Dispatch-Webhook deaktivieren. Es sind keine Daten zu löschen.

Lokale Tests versenden keine Nachrichten. Die Live-Migration und den End-to-End-Test
führt der Projektinhaber durch. Erst nach diesem Test ist die Aktivierung bestätigt.
