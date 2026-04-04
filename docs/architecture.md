# Architektur und Produktzuschnitt

## Zweck

Dieses Dokument beschreibt den aktuellen technischen Zuschnitt passend zum bereinigten Spec-Stand.
Es ist keine zweite Produktspezifikation, sondern die technische Lesebrille auf das Zwischenziel:

- schlanke Formular-Prozess-Plattform
- erste Ziel-App: digitale Dokumentation und Nachweise fuer Handwerker

## Drei Kernbausteine

Die Plattform besteht fachlich und technisch aus drei gleichrangigen Kernen:

### 1. Forms

- versionierte Template-Quelle
- `.form.md`-orientierter Formularpfad
- Readonly-/Edit-/Lookup-Semantik
- Journal, Attachments und Referenzen im Dokumentkontext

### 2. Workflows

- versionierte Workflow-Quelle
- technisches JSON als Speicherformat
- fachliches Transition-Modell als Primaerleserichtung
- Lifecycle mit Publish, Unpublish und Archive

### 3. TypeScript APIs

- Lookup-Aktionen
- Form-Actions
- Workflow-Hooks
- spaeter Import-, Export- und Datenquellenfunktionen

## Aktueller technischer Stack

- Datenbank: Postgres
- Backend: Node.js + Fastify
- Sprache: TypeScript
- Rendering: EJS
- UI: serverseitig, HTMX gezielt als Teilupdate-Werkzeug
- Persistente Seed-/Smoke-Basis fuer den Referenzbestand

## Produktpfad ohne Preview-Nebenwelt

Neue Funktionen landen ausschliesslich im normalen Template-, Workflow-, Dokument-, API- und Admin-Pfad.
Eine parallele Preview-/Dev-Form-UI gehoert nicht mehr zum Zielbild.

## Modulzuschnitt

Die technische Hauptstruktur ist jetzt fachlich klarer getrennt:

- `src/modules/forms/*` enthaelt Parser, Controls, Grid, Rich-Text, Formular-UI-Semantik und Formularruntime
- `src/modules/lookups/*` enthaelt nur noch kleine Hilfslogik fuer Stammdaten-/Lookup-Verhalten, nicht die fuehrende API-Wahrheit
- `src/modules/operations/*` enthaelt DB-Lesen, UI-Wartung und Runtime fuer zentrale APIs
- `src/modules/entities/*` enthaelt interne Stammdatenzugriffe und CSV-Import

Der normale Dokumentpfad fuer Formulararbeit ist `/documents/:id/form`.

## API-Kern in DB + UI + Runtime

APIs sind eigene Plattformobjekte in der Datenbank.
Fuehrend gepflegt werden pro API:

- `key`, `title`, `status`
- `connector`, `auth_mode`
- `request_schema_json`, `response_schema_json`
- `handler_ts_source`
- `tags`

Die UI auf `/apis` ist deshalb kein Lesekatalog mehr, sondern die Wartungsoberflaeche fuer Draft, Publish, Unpublish und Archive.
Formulare und Workflows referenzieren dieselben zentralen API-Objekte.

## Documents als Container, typed tables als Ziel- und Leseschicht

`documents` bleibt der fuehrende Prozesscontainer fuer:

- Workflow-Status
- Versionbindung
- Assignments
- Audit
- allgemeines `data_json`

Zusaetzlich fuehrt die Plattform jetzt typed Zieltabellen pro `form_type`:

- `customer_orders`
- `production_records`
- `qualification_records`
- `generic_form_records`

Im aktuellen Slice werden Kernfelder beim Save-/Submit-/Approve-Pfad in diese Tabellen synchronisiert.
`data_json` bleibt dabei bewusst als Uebergangs- und Fallbackschicht bestehen.

Neu ist dabei:

- typed tables tragen die fachlich wichtigen Leitfelder pro Familie
- die Plattform liest typed records gezielt pro Dokument und pro Familie
- die Dokumentliste und Suche duerfen typed Leitkennungen verwenden

Die aktuelle Leseschicht umfasst damit nicht nur:

- `/api/typed-records/:documentId`

sondern auch Familien-Schnitte:

- `/api/typed-records/customer-orders`
- `/api/typed-records/production-records`
- `/api/typed-records/qualification-records`
- `/api/typed-records/generic-form-records`

optional ergaenzt durch CSV-Export pro Familie.

Fuer den Qualifikationsnachweis kommt jetzt zusaetzlich ein erster fachlicher Mehrseiten- und Auswertungsschnitt dazu:

- 3 Seiten im normalen Dokumentpfad
- Seitenstand pro User
- berechnete Bewertungsfelder in `qualification_records`

Im UI wird diese Leseschicht zusaetzlich sichtbar ueber:

- Document Context mit `form_type`, typed table und API-Link
- Documents-Liste mit typed Leitkennung je Familie
- `/apis` mit eigenem Bereich fuer typed record APIs

## Laufzeitprinzipien

- neue Dokumente starten aus publizierten Template-/Workflow-Staenden
- laufende Dokumente bleiben an ihrer Startversion gebunden
- Dokumentdetail bleibt die fuehrende Arbeitsflaeche
- Konfigurationsscreens bleiben getrennt von der Arbeits-UI
- HTMX ergaenzt SSR nur dort, wo echte Teilupdates sinnvoll sind

## Zielbild fuer die naechste Phase

Die naechste Architekturphase soll nicht alles neu bauen, sondern die vorhandene Struktur auf den Meilenstein hin staerken:

- Controls explizit machen
- Tabellen-/Grid-Modell pro Template ergaenzen
- TypeScript APIs als Datenquelle, Import- und Exportbaustein ergaenzen
- typed entity tables schrittweise weiter von Sync-Zielen zu primaeren Read-Modellen ausbauen
- Qualification Pages spaeter vorsichtig in Richtung wiederverwendbarer Mehrseitenstruktur verallgemeinern
- Referenzen auf Stammdaten und andere Formulare tragfaehig machen
- Medienmodell fuer Journal und Attachments sauber nachziehen
- Teststrategie von Smokes in Richtung echte Start-to-End-Pfade absichern

## Was bewusst nicht Ziel dieser Architekturphase ist

- keine neue SPA-Architektur
- kein visueller Builder
- keine allgemeine Low-Code-Laufzeit
- keine neue Queue-/Worker-/Integrationsplattform
- keine Big-Bang-Migration aller bestehenden Modelle
