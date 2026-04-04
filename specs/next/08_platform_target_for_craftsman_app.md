# Ziel-Spec: Plattformziel fuer die Handwerker-App

## Zwischenziel

Die Plattform ist auf drei produktive Referenzwelten ausgerichtet:

- Kundenauftrag
- Produktionsdokumentation
- Qualifikationsnachweis

## Kernbausteine

- Forms
- Workflows
- TypeScript APIs

## Führende Referenzbasis

Die Plattform-Referenzwelt ist nicht mehr ERP-SIM-getrieben.

Stattdessen gilt:

- Customer- und Product-Stammdaten kommen per CSV
- interne lesende APIs liefern diese Stammdaten
- Formulare nutzen diese APIs produktiv

## Handwerker-App

Der erste kommerzielle Zielpfad bleibt:

- Kundenauftrag
- Service-Durchführung
- Service-Freigabe
- Nachweis / Signatur / Dokumentation

## Zweite Testwelt

Produktionsdokumentation ist als gleichwertige zweite Referenzwelt verankert:

- Batch
- Serie
- Produkt
- Grid für Schritte

## Dritte Testwelt

Qualifikationsnachweis ist der Mehrbenutzer- und Nachweis-Testfall:

- User-Zuweisung
- per-User Save/Submit/Signatur
- Fragen via `radio-group` und `checkbox-group`
