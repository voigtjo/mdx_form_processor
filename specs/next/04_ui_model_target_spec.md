# Ziel-Spec: UI-Modell der naechsten Phase

## Zweck

Diese Spec beschreibt die neue Zielrichtung fuer die UI auf Basis des aktuellen Repo-Stands und der dokumentierten UI-Erkenntnisse.

## Grundprinzipien

Die Standard-UI ist:

- ruhig
- arbeitsorientiert
- objektzentriert
- sparsam mit Technikdetails

Technische Details gehoeren nur in gezielte Review- oder Konfigurationskontexte.

## Standard-Arbeitsseiten

Standard-Arbeitsseiten zeigen:

- die fuer Arbeit und Entscheidung noetigen Fachinformationen
- die naechsten sinnvollen Aktionen
- den relevanten Status- und Kontextbezug

Standard-Arbeitsseiten zeigen nicht standardmaessig:

- technische Modelldetails
- Source-Sichten
- Binding- oder Parserdetails

## Review-/Konfigurationskontexte

Review- oder Konfigurationskontexte duerfen zeigen:

- Modelldetails
- technische Bindungen
- JSON-/Source-Sichten
- technische Review-Informationen

Diese Kontexte sind bewusst von Arbeitsseiten getrennt zu halten.

## Navigationsmodell

Fuehrend ist ein klares objektzentriertes Modell:

- Liste
- Detail
- New
- Edit

Dies gilt besonders fuer:

- Templates
- Workflows
- Admin-Objekte

## Korrektur zum aktuellen Repo-Stand

Diese Spec reagiert auf:

- die Mischseite `src/views/pages/document-detail.ejs`
- die inzwischen beruhigten, aber noch nicht voll konsistenten Konfigurationsscreens
- die Erkenntnisse in `docs/ui-deviations.md`

## Ziel fuer Documents

`Document Detail` soll kuenftig eine Arbeitsseite sein.

Review- und Technikdetails gehoeren nicht in die Standard-Arbeitsseite, sondern in getrennte Kontexte.

## Ziel fuer Konfigurationsscreens

Templates und Workflows bleiben objektzentriert.

Nicht gewuenscht sind:

- Inline-Review-Karten unter Tabellen
- Mischscreens aus Finder, Tiefensicht und Edit
- technische Ueberladung ohne klaren Fokus

## In dieser Spec bewusst noch nicht festgelegt

- konkrete Seitenhierarchie aller Screens
- exakte Tab-Strukturen
- finale visuelle Gestaltung
- konkrete Komponentenbibliothek
