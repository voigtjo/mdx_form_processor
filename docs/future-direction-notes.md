# Produktnahe Richtungsnotizen

## Zweck

Dieses Dokument haelt die naechste Produktrichtung knapp fest, ohne selbst neue Runtime zu definieren.

Es dient dazu:

- die Plattform nicht zu ueberentwickeln
- die Handwerker-App als erste Ziel-App klar zu halten
- spaetere Testwelten bewusst vorzubereiten, aber nicht vorzuziehen

## Naechster Meilenstein

Der naechste belastbare Meilenstein ist:

- **plattformfaehig fuer die Handwerker-App**

## Was fuer diesen Meilenstein wirklich zaehlt

- Forms als ruhiger, editierbarer Produktpfad
- Workflows als einfaches Transition-Modell
- TypeScript APIs als dritter Kernbaustein
- dokumentierter Datenblatt-, Referenz-, Import- und Exportrahmen
- testbare End-to-End-Linie fuer die Handwerker-App

## Was bewusst spaeter bleibt

- breite Produktionsdokumentation als eigener Produktstrang
- Qualifikations- und Schulungswelt als eigener App-Fokus
- Builder- oder Meta-Plattform-Themen
- komplexe Integrations- und Betriebsarchitekturen

## Zwei wichtige spaetere Testwelten

### 1. Auftragsdokumentation bei Kunden

- Kunde
- Auftrag
- Produkte und Material
- Nachweise und Freigaben
- keine Batch-Pflicht

### 2. Produktionsdokumentation

- Batch oder Seriennummer als Produktionsauftrag
- Produkt und Produktionsschritte
- optionale Referenz auf Kundenauftrag oder Nachweis

## Dritter wichtiger Plattform-Testfall

Ein spaeterer Plattform-Testfall soll Qualifikations- und Nachweisformulare absichern:

- Zuweisung an mehrere User
- jeder bearbeitet fuer sich
- Schulungsmaterial
- Fragen
- Signatur

## UI-Zielrichtung

Die UI soll weiter aufraeumen:

- weniger Erklaertext
- HTMX-Formular als einhaengbare Arbeitskomponente
- Status-/Action-Leiste darueber
- Informationen nur einmal klar anzeigen
- History, Journal und Attachments kompakt und tabellarisch
- Readonly ohne ueberfluessigen Hilfetext
