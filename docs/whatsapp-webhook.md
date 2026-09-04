# WhatsApp-Zustellung prüfen

Eine erfolgreiche Antwort beim Versand bestätigt nur die Annahme durch Meta.
Zustellung oder spätere Fehler werden über Webhooks gemeldet. Ein fehlender Webhook
verhindert nicht den Versand, aber die Auswertung dieser Rückmeldungen.

## Manuelle Einrichtung

1. In Meta bei der **Walkinly-App → App settings / Basic** das **App secret** anzeigen.
   In Vercel für Production als `WHATSAPP_APP_SECRET` speichern.
   Das ist nicht der WhatsApp Access Token und nicht der Supabase Service Role Key.
2. Im Passwortmanager einen zufälligen geheimen Wert mit mindestens 32 Zeichen
   erzeugen. In Vercel als `WHATSAPP_WEBHOOK_VERIFY_TOKEN` speichern.
   Keinen dieser Werte in Chat, Git oder Screenshots teilen.
3. Nach dem Speichern ein neues Production-Deployment erstellen.
4. In Metas WhatsApp-Konfiguration unter **Configure Webhooks**:
   - Callback URL: `https://<deine-produktionsdomain>/api/whatsapp/webhook`
     (die tatsächlich aktive Domain einsetzen; öffentlich ohne Login erreichbar).
   - Verify token: derselbe selbst gewählte Wert aus Schritt 2.
   - **Verify and save**, danach das Webhook-Feld **messages** abonnieren.
5. Sicherstellen, dass die App auch das richtige WhatsApp Business Account (WABA)
   abonniert hat. Für diese Einrichtung ist dies `1253883810176760`, nicht das Testkonto.
   Meta dokumentiert dafür `POST /<WABA-ID>/subscribed_apps`; die reine Zuweisung
   des Kontos zum Systemnutzer ersetzt dieses Abonnement nicht. Token nur in einem
   vertrauenswürdigen API-Client lokal einsetzen, nicht in einer URL oder im Chat.
   Falls Meta wegen einer unveröffentlichten App nur Test-Webhooks erlaubt, muss
   zuerst die im Dashboard verlangte Veröffentlichung abgeschlossen werden.
6. Erst nach erfolgreicher Einrichtung eine einzelne Testnachricht an die eigene
   WhatsApp-Nummer senden und die angezeigte **Prüf-ID** notieren.
7. In **Vercel → Projekt → Logs** nach `whatsapp_delivery` bzw. dieser Prüf-ID suchen.
   Bei `failed` die `errorCodes` und Prüf-ID weitergeben. Keine Geheimnisse teilen.

`sent` bedeutet beim WhatsApp-Server angekommen, `delivered` zugestellt und
`read` gelesen. Die Reihenfolge der Callbacks kann variieren; `timestamp` ist
der Zeitpunkt bei Meta. Wiederholte Callback-Einträge sind möglich.

Die Anwendung speichert nur Status, Zeitpunkt, numerische Fehlercodes und eine
gehashte Prüf-ID in den Server-Logs. Nachrichtentexte, Empfängernummern, rohe
Nachrichten-IDs und Fehlerfreitexte werden nicht protokolliert. Eingehende
Nachrichten werden bestätigt, aber nicht verarbeitet oder beantwortet.
Logs unterliegen Vercels Aufbewahrungsdauer; es gibt hier keine dauerhafte
Statusdatenbank und keine Statusanzeige im Dashboard. Historische Zustellfehler
lassen sich damit nicht rückwirkend abrufen. Keine Supabase-Änderung nötig.

## Prüfung lokal

`node --test tests/whatsapp-webhook.test.mjs tests/whatsapp-error.test.mjs`

Die Tests verwenden ausschließlich fiktive Daten und versenden keine Nachrichten.

## Meta-Referenzen

- [Statusmeldungen und Fehler](https://www.postman.com/meta/whatsapp-business-platform/folder/fuaee8l/statuses-object)
- [Webhook-Payload und WABA-Abonnement](https://www.postman.com/meta/whatsapp-business-platform/folder/tduohwq/webhook-payload-reference)
