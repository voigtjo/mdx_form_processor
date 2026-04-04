# Ziel-Spec: Plattformziel fuer die Handwerker-App

## Zwischenziel

Die Plattform ist auf vier produktive Referenzwelten ausgerichtet:

- Kundenauftrag
- Produktionsdokumentation
- Qualifikationsnachweis
- generisches Formular

## Kernbausteine

- Forms
- Workflows
- TypeScript APIs
- form_type plus typed entity tables als fachliche Zielstruktur

TypeScript APIs sind dabei nicht nur Katalogeintraege, sondern zentrale DB-Objekte mit UI-Wartung und Runtime.

Documents bleiben der Prozesscontainer; typed Tabellen werden pro Familie als fachliche Entitaeten vorbereitet.

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
- 3 Pages im normalen Dokumentpfad
- erste Auswertung mit `evaluation_status`, `score_value`, `passed`

## Vierte Testwelt

`generic_form` ist der kleinste vierte Typ:

- publiziertes Template
- publizierter Workflow
- sichtbares Referenzdokument
- typed Record in `generic_form_records`
