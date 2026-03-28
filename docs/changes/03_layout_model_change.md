# Änderungsspec: Layout-Modell mit `|`

## Zweck

Korrekturrichtung für das bisherige Layoutmodell vor einer neuen Zielspezifikation.

## Problem im bisherigen Konzept

- das bisherige Layoutdenken ist zu offen für Sonderregeln und implizite Interpretation
- horizontale Anordnung ist nicht hart genug auf eine einzige einfache Bedeutung reduziert
- komplexere Grid- oder Spaltenlogik erhöht die künftige Parser- und UI-Komplexität

Beobachtbare heutige Stellen:

- `specs/04_form_mdx_spec.md`
- `src/modules/templates/form-read.ts`
- `src/views/pages/document-detail.ejs`

## Künftige Änderungsrichtung

- `|` steht künftig für eine harte, einfache horizontale Gleichverteilung
- keine Colspans
- keine verdeckten Sonderregeln
- keine mehrstufige Grid-Logik hinter derselben Notation

## Was dadurch vereinfacht werden soll

- weniger Layout-Ambiguität
- weniger Parserkomplexität
- direkteres Lesen des Formulartexts
- bessere Vorhersehbarkeit der Darstellung

## Welche bisherigen Konzepte entfallen oder zurückgestuft werden sollen

- Colspan-artige Ableitungen
- implizite Grid-Semantik
- Sonderfälle, die nur aus komplexer Breiten- oder Rasterlogik entstehen
- flexible, aber schwer nachvollziehbare Layoutinterpretation

## In dieser Änderungsspec bewusst noch nicht ausformuliert

- keine endgültige Syntaxbeschreibung
- keine exakten Renderregeln für alle Breakpoints
- keine vollständige Layout-Spezifikation jenseits der neuen Kernregel
