# Ziel-Spec: Vereinfachtes Layoutmodell

## Zweck

Diese Spec beschreibt das Zielmodell fuer die vereinfachte Layoutregel mit `|`.

## Normative Grundregel

`|` bedeutet eine harte horizontale Aufteilung innerhalb einer Zeile.

Alle durch `|` getrennten Slots einer Zeile werden horizontal gleich verteilt.

## Lesen einer Zeile

Eine Zeile wird von links nach rechts gelesen.

Jeder durch `|` getrennte Teil ist:

- ein Slot
- gleich breit wie die anderen Slots derselben Zeile
- ohne versteckte Sonderbehandlung

## Nicht erlaubt

Nicht erlaubt sind:

- Colspans
- implizite Breitenregeln
- verdeckte Sonderregeln
- mehrdeutige Grid-Ableitungen
- mehrstufige Breitenlogik hinter derselben Notation

## Sections und Zeilen

Sections enthalten Zeilen.

Zeilen enthalten:

- einen Slot
- oder mehrere gleich verteilte Slots mit `|`

## Zielwirkung

Die Regel soll:

- leicht lesbar sein
- leicht renderbar sein
- leicht parserbar sein
- keine zweite Layout-Semantik neben sich brauchen

## Bezug zum aktuellen Stand

Diese Spec konkretisiert die Zielrichtung aus:

- `docs/changes/03_layout_model_change.md`
- der heutigen komplexeren Alt-Spec-Richtung in `specs/04_form_mdx_spec.md`

## In dieser Spec bewusst noch nicht festgelegt

- konkrete Syntax fuer Umbrueche und Verschachtelung
- Responsive-Verhalten im Detail
- Sonderregeln fuer sehr kleine Bildschirme
