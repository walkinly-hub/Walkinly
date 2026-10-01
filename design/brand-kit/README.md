# Walkinly Brand-Kit

Version 5 · 1. Oktober 2026

## Grundlage

Für alle Anwendungen gilt die freigestellte Datei `assets/walkinly-logo-transparent.png`. Sie wurde mit Imagegen aus der ausgewählten Vorlage abgeleitet (Auftrag: nur weissen Hintergrund entfernen, Buchstaben und Bögen bewahren). Das unveränderte Original bleibt ausschliesslich als Referenz archiviert; die generierte Freistellung ist keine pixelidentische Kopie. Beide Dateien sind Rasterbilder, keine Vektoren.

`index.html` ist die lokale, druckbare Markenübersicht. Im Browser öffnen; über Drucken lässt sie sich auch als PDF speichern. `tokens.css` enthält die vorgeschlagenen Gestaltungswerte, wird aber nicht automatisch in die App eingebunden.

## Markencharakter

Freundlich, unkompliziert, nahbar und klar. Die runden Buchstaben vermitteln Offenheit. Grosszügige Abstände und ruhige Flächen geben der verspielten Wortmarke Raum.

## Farben

| Rolle | Farbe | HEX | Einsatz |
| --- | --- | --- | --- |
| Primär | Walkinly Pink | #EC4899 | Logo und gezielte Hervorhebungen, z. B. primäre CTAs |
| Sekundär 1 | Mahagoni | #420D09 | Standard für Text, Navigation, Buttons und dunkle Elemente |
| Sekundär 2 | Babyblau | #89CFF0 | Standard für Karten, Flächen und weitere Website-Elemente |
| Akzent 1 | Blush | #FCE7F3 | Gezielte sanfte rosa Akzente |
| Akzent 2 | Ice Blue | #E7F5FC | Gezielte sanfte blaue Akzente |
| Akzent 3 | Warmweiss | #F8F7F4 | Ruhige Hintergrund- und Akzentflächen, auch in Website und Dashboard |

Mahagoni entspricht dem HEX-Wert der Vorlage, Babyblau wurde direkt aus der blauen Bildfläche ausgelesen. Ice Blue ist eine Aufhellung von Babyblau mit rund 80 % Weiss: ähnlich zart wie Blush, bei erhaltener blauer Farbrichtung.

Neutrale Funktionsfarben: Weiss #FFFFFF, Ink #1D1D1F und Stone #E7E5E4. Pink dunkel #DB2777 bleibt ausschliesslich eine funktionale Buttonfarbe und zählt nicht als zusätzliche Markenfarbe.
Die HEX-Werte sind verbindliche Gestaltungswerte, keine Behauptung, dass jeder Pixel des generierten Logos exakt diesen Farbwert besitzt. Das Original enthält leichte Farbvariation.

Für kleinen Text Mahagoni auf hellen Flächen verwenden. Pinke CTAs erhalten dunkle Mahagoni-Schrift; weisse Schrift ist der dunkleren Pink-Variante vorbehalten. Statusinformationen immer zusätzlich mit Text oder Symbol erklären.

## Verbindliche Farbverteilung

- Mahagoni und Babyblau bilden grundsätzlich die Website-Elemente: Navigation, Karten, Buttons, Icons, Konturen und strukturierende Flächen. Mahagoni ist die dunkle, Babyblau die helle Variante.
- Blush und Ice Blue ausschliesslich gezielt als Akzente einsetzen, etwa für kleine Hinweisflächen, Labels und dekorative Details. Sie ersetzen nicht die sekundären Grundfarben der Elemente.
- Warmweiss #F8F7F4 ist die dritte Akzentfarbe und darf zusätzlich grossflächig als ruhiger Seitenhintergrund eingesetzt werden. Der Ton entspricht dem bestehenden Website- und App-Hintergrund. Im CSS ist `--walkinly-background` ein Alias von `--walkinly-warm-white`.
- Walkinly Pink primär für das Logo reservieren. Weitere pinke Elemente nur bewusst hervorheben, beispielsweise den wichtigsten CTA einer Ansicht. Gewöhnliche Buttons bleiben in den Sekundärfarben.
- Neutrale Farben bleiben für Seitenhintergründe und Lesbarkeit verfügbar. Rundungen und transparente Logo-Darstellung gelten weiterhin.
- Auf pinken CTAs Mahagoni als Textfarbe verwenden. Auf Babyblau ebenfalls Mahagoni, auf Mahagoni Weiss. Pink dunkel ist nur eine optionale funktionale CTA-Variante, keine Standardfarbe aller Buttons.

## Typografie

Geist ist die bestehende App-Schrift: 600–700 für Überschriften, 400–500 für Text und Bedienelemente. Fallback: Arial, sans-serif. Die lokale Übersicht benötigt keine Internetverbindung und zeigt Arial, falls Geist nicht installiert ist. Die Schriftdateien sind nicht im Kit enthalten.

- Titel: 40–64 px, Zeilenhöhe 1.05–1.15.
- Abschnittstitel: 24–32 px, Zeilenhöhe 1.2.
- Fliesstext: 16–18 px, Zeilenhöhe 1.5–1.6.
- Beschriftungen: mindestens 14 px, Zeilenhöhe 1.4.

## Logo-Regeln

Das Logo immer freigestellt auf dem jeweiligen Hintergrund darstellen: kein weisses Rechteck, kein eigener Hintergrund am Bild oder Logo-Container. Nur die transparente PNG für Anwendungen verwenden. Seitenverhältnis erhalten, keine Effekte oder Verzerrung. Ruhige kontrastreiche Flächen wählen, beispielsweise Warmweiss, Blush oder Ice Blue.

Als zusätzlicher Schutzraum mindestens die Höhe des i-Punkts um die sichtbare Wortmarke einplanen. Empfohlene sichtbare Wortmarkenbreite mindestens 160 px; kleinere Darstellungen am tatsächlichen Ausgabegerät prüfen. Für Favicons wird nur das W verwendet; die vier Varianten liegen im Ordner `favicons`. Die hier ausdrücklich gewünschten deckenden Hintergründe sind eine Ausnahme zur Freistellung der vollständigen Wortmarke.

Das Original ist 1774 × 887 px. Wegen der weissen Ränder ist die sichtbare Wortmarke kleiner als die Bildfläche. Für grosse Drucksachen wird eine separat geprüfte Vektorreinzeichnung benötigt. Dieses Kit enthält keine vermeintlich fertige SVG-Datei.

## Gestaltung

Website-Elemente sind verbindlich weich abgerundet, passend zur Logo-Schrift. Karten und Dialoge: 24 px; Buttons, Eingabefelder, Auswahlfelder und Bildflächen: 16 px; Chips und Badges: 999 px. Keine scharfkantigen Boxen. Abstände auf einem 8-px-Raster. Klare Hierarchie, wenige Akzente, ruhige weisse und warmweisse Flächen. Runde Bögen können als abstrakte Hintergrundformen eingesetzt werden; das Logo selbst bleibt unverändert.

## Sprache

Direkte Du-Ansprache, kurze aktive Sätze und Schweizer Rechtschreibung. Beispiele: «Entdecke Salons in deiner Nähe.» und «Salon ansehen». Konkrete Wartezeiten oder Verfügbarkeiten nur nennen, wenn aktuelle Daten sie belegen. Kein Versprechen wie «Garantiert sofort dran».

## Enthaltene Anwendungen

Die Übersicht enthält ein Beispiel für eine Salon-Karte, einen Social-Media-Beitrag und einen Aushang. Texte und Layouts sind Gestaltungsvorschläge, keine Veröffentlichung oder Änderung der Anwendung.

## Vor Produktion

Für Druck Farbproof beim Druckdienstleister prüfen. Für Vektor- und monochrome Logo-Ausgaben sowie ein App-Icon ist eine eigene Reinzeichnung erforderlich. Es sind keine Supabase-Schritte nötig.

## Favicon-Dateien

Vier Varianten: Pink auf Weiss, Pink auf Schwarz, Weiss auf Pink und Schwarz auf Pink. Mit Imagegen anhand des Original-W erzeugt; leichte Form- und Farbabweichungen zwischen den Rastervarianten sind möglich. Prompt-Vorgabe: nur das runde Logo-W zentriert auf quadratischer Fläche, Pink #EC4899, Weiss #FFFFFF und Schwarz #000000; keine weiteren Buchstaben oder Effekte.

Je Variante: Master-PNG, PNGs in 16/32/48/180/192/512 px und ICO mit 16/32/48 px. Die Website wurde nicht automatisch auf eine Variante umgestellt. Die aktuelle Vorschau zeigt alle vier Varianten inklusive kleiner Darstellungen.
