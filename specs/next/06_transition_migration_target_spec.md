# Ziel-Spec: Uebergang und Migration in die neue Richtung

## Zweck

Diese Spec beschreibt den Zielrahmen fuer den Uebergang vom aktuellen Alt-Modell in die neue Richtung.

## Grundsatz

Der Uebergang erfolgt kontrolliert und schrittweise.

Es soll nicht alles gleichzeitig umgebaut werden.

## Zielreihenfolge

1. Alt-Spec-Abnahmestand fixieren
2. Aenderungsspecs formulieren
3. neue Ziel-Specs formulieren
4. Implementierungsroadmap ableiten
5. Umsetzung in kleinen kontrollierten Schritten

## Migrationsprinzipien

- zuerst Spezifikation, dann Umsetzung
- zuerst ruhige Kernentscheidungen, dann technische Ableitung
- keine parallele Vermischung von Alt-Modell und neuer Richtung ohne klare Priorisierung
- keine verdeckte Parser- oder UI-Migration im Bestand

## Bevorzugte Uebergangsform

Bevorzugt ist:

- kleine vertikale Schnitte
- klare Abloesung einzelner alter Konzepte
- kontrollierbare Referenzbeispiele
- nachvollziehbare Zwischenstaende

## Nicht Ziel des Uebergangs

Nicht Ziel ist:

- Big-Bang-Umbau
- gleichzeitige Neudefinition aller Screens und aller Parserdetails
- implizite Teilmigration ohne neue Roadmap

## Bezug zum aktuellen Stand

Diese Spec baut auf auf:

- `docs/acceptance-checkpoint.md`
- `docs/changes/`
- `docs/architecture.md`

## In dieser Spec bewusst noch nicht festgelegt

- technische Migrationsschritte im Detail
- Reihenfolge einzelner Code-Module
- Datenkonvertierung
- Kompatibilitaetsmodus
