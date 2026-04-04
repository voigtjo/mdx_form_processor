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

## Produktpfad statt Preview-Pfad

Neue Funktionen sollen im normalen Template-, Workflow- und Dokumentpfad landen.
Der Preview-Pfad kann als Dev-/Debug-Hilfe bestehen bleiben, ist aber kein fuehrender Produktweg mehr.

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
- Referenzen auf Stammdaten und andere Formulare tragfaehig machen
- Medienmodell fuer Journal und Attachments sauber nachziehen
- Teststrategie von Smoke-Schnitten in Richtung Start-to-End absichern

## Was bewusst nicht Ziel dieser Architekturphase ist

- keine neue SPA-Architektur
- kein visueller Builder
- keine allgemeine Low-Code-Laufzeit
- keine neue Queue-/Worker-/Integrationsplattform
- keine Big-Bang-Migration aller bestehenden Modelle
